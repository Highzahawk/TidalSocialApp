import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the first user with a TIDAL token
    const user = await prisma.user.findFirst({
      where: {
        tidalAccessToken: { not: null }
      },
      select: {
        id: true,
        tidalUserId: true,
        tidalAccessToken: true,
        displayName: true
      }
    });

    if (!user || !user.tidalAccessToken) {
      return res.json({ error: 'No user with TIDAL token found' });
    }

    // Test different TIDAL API endpoints
    const endpoints = [
      'https://api.tidal.com/v1/users/me',
      'https://api.tidal.com/v1/users/' + user.tidalUserId,
      'https://api.tidal.com/v1/playlists',
      'https://api.tidal.com/v1/favorites/tracks'
    ];

    const results = {};

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${user.tidalAccessToken}`,
            'Content-Type': 'application/json',
          },
        });

        results[endpoint] = {
          status: response.status,
          ok: response.ok,
          data: response.ok ? await response.json() : await response.text()
        };
      } catch (error) {
        results[endpoint] = {
          status: 'error',
          error: error.message
        };
      }
    }

    res.json({
      user: {
        id: user.id,
        tidalUserId: user.tidalUserId,
        displayName: user.displayName,
        hasToken: !!user.tidalAccessToken
      },
      apiTests: results
    });

  } catch (error) {
    console.error('Test API error:', error);
    res.status(500).json({ error: 'Test failed', details: error });
  }
}
