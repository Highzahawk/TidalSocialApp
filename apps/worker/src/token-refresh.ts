import IORedis from 'ioredis';
import { Queue, Worker, Job } from 'bullmq';
import { prisma } from './lib/prisma';

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const tokenRefreshQueue = new Queue('token-refresh', { connection });

export interface TokenRefreshJob {
  userId: string;
}

async function refreshTidalToken(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tidalRefreshToken: true,
        tidalExpiresAt: true
      }
    });

    if (!user || !user.tidalRefreshToken) {
      console.log(`No refresh token found for user ${userId}`);
      return false;
    }

    // Check if token is actually expired (with 5 minute buffer)
    const expiresAt = new Date(user.tidalExpiresAt);
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    if (expiresAt.getTime() > now.getTime() + bufferTime) {
      console.log(`Token for user ${userId} is not expired yet`);
      return true;
    }

    // Refresh the token
    const response = await fetch('https://api.tidal.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: user.tidalRefreshToken,
        client_id: process.env.TIDAL_CLIENT_ID!,
        client_secret: process.env.TIDAL_CLIENT_SECRET!,
      }),
    });

    if (!response.ok) {
      console.error(`Failed to refresh token for user ${userId}:`, response.statusText);
      return false;
    }

    const tokenData = await response.json();
    
    // Update user with new tokens
    await prisma.user.update({
      where: { id: userId },
      data: {
        tidalAccessToken: tokenData.access_token,
        tidalRefreshToken: tokenData.refresh_token,
        tidalExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      },
    });

    console.log(`Successfully refreshed token for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error refreshing token for user ${userId}:`, error);
    return false;
  }
}

// Worker to process token refresh jobs
new Worker<TokenRefreshJob>('token-refresh', async (job: Job<TokenRefreshJob>) => {
  const { userId } = job.data;
  console.log(`Processing token refresh for user ${userId}`);
  
  const success = await refreshTidalToken(userId);
  
  if (!success) {
    // If refresh failed, we might want to notify the user or mark them as needing re-auth
    await prisma.user.update({
      where: { id: userId },
      data: { tidalAccessToken: 'expired' }, // Mark as needing re-auth
    });
  }
  
  return success;
}, { connection });

// Function to enqueue token refresh
export async function enqueueTokenRefresh(userId: string, delay = 0) {
  await tokenRefreshQueue.add('refresh-token', { userId }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    delay,
  });
}

// Function to check and refresh tokens for all users
export async function checkAndRefreshAllTokens() {
  const users = await prisma.user.findMany({
    where: {
      tidalRefreshToken: { not: null },
      tidalExpiresAt: { not: null }
    },
    select: {
      id: true,
      tidalExpiresAt: true
    }
  });

  for (const user of users) {
    const expiresAt = new Date(user.tidalExpiresAt!);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    
    // If token expires in less than 10 minutes, refresh it
    if (timeUntilExpiry < 10 * 60 * 1000) {
      await enqueueTokenRefresh(user.id);
    }
  }
}

// Run token check every 5 minutes
setInterval(() => {
  checkAndRefreshAllTokens().catch(console.error);
}, 5 * 60 * 1000);

console.log('Token refresh worker started');
