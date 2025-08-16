import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.accessToken) {
      return res.status(401).json({ 
        authenticated: false,
        error: 'Not authenticated' 
      });
    }

    res.json({
      authenticated: true,
      user: {
        id: session.tidalUserId,
        username: session.tidalUserId,
        accessToken: session.accessToken
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ 
      authenticated: false,
      error: 'Failed to check authentication' 
    });
  }
} 