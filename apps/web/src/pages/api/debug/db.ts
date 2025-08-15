import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test database connection
    await prisma.$connect();
    
    // Count users
    const userCount = await prisma.user.count();
    
    // Get sample user
    const sampleUser = await prisma.user.findFirst({
      select: {
        id: true,
        tidalUserId: true,
        displayName: true,
        createdAt: true
      }
    });

    res.json({
      status: 'connected',
      userCount,
      sampleUser
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
}
