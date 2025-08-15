import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createTidalAPI } from '../../../lib/tidal-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const tidalAPI = createTidalAPI(session.accessToken);
    
    // Get user profile
    const user = await tidalAPI.getCurrentUser();
    
    // Get user's playlists
    const playlists = await tidalAPI.getUserPlaylists(user.id);
    
    // Get current playback (if any)
    const currentPlayback = await tidalAPI.getCurrentPlayback();

    res.json({
      user,
      playlists,
      currentPlayback,
      session: {
        tidalUserId: session.tidalUserId,
        expiresAt: session.expires
      }
    });
  } catch (error) {
    console.error('Error fetching TIDAL data:', error);
    res.status(500).json({ error: 'Failed to fetch TIDAL data' });
  }
}
