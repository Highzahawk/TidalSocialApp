import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

const TIDAL_CLIENT_ID = process.env.TIDAL_CLIENT_ID || 'your-client-id';
const TIDAL_CLIENT_SECRET = process.env.TIDAL_CLIENT_SECRET || 'your-client-secret';
const TIDAL_REDIRECT_URI = process.env.TIDAL_REDIRECT_URI || 'http://localhost:3000/api/auth/tidal/callback';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error } = req.query;

  // Check for OAuth errors
  if (error) {
    return res.status(400).json({ error: `OAuth error: ${error}` });
  }

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing authorization code or state' });
  }

  try {
    // Verify state parameter (you should implement proper state verification)
    // const storedState = req.cookies.tidal_oauth_state;
    // if (state !== storedState) {
    //   return res.status(400).json({ error: 'Invalid state parameter' });
    // }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://auth.tidal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${TIDAL_CLIENT_ID}:${TIDAL_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: TIDAL_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return res.status(400).json({ error: 'Failed to exchange authorization code for token' });
    }

    const tokenData = await tokenResponse.json();
    
    // Get user info using the access token
    const userResponse = await fetch('https://api.tidal.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!userResponse.ok) {
      console.error('Failed to get user info:', userResponse.status);
      return res.status(400).json({ error: 'Failed to get user information' });
    }

    const userData = await userResponse.json();

    // Store or update user in database
    const user = await prisma.user.upsert({
      where: { tidalUserId: userData.id.toString() },
      update: {
        tidalAccessToken: tokenData.access_token,
        tidalRefreshToken: tokenData.refresh_token,
        tidalExpiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
        displayName: userData.username || userData.firstName
      },
      create: {
        tidalUserId: userData.id.toString(),
        tidalAccessToken: tokenData.access_token,
        tidalRefreshToken: tokenData.refresh_token,
        tidalExpiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
        displayName: userData.username || userData.firstName
      }
    });

    // Redirect to success page or dashboard
    res.redirect('/dashboard?success=true');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Failed to complete OAuth flow' });
  }
}
