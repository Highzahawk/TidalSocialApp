import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createTidalAPI } from '../../../lib/tidal-api';

export interface ExtensionPlaylist {
  id: string;
  title: string;
  description?: string;
  trackCount: number;
  coverImage?: string;
  creator: string;
  isCollaborative: boolean;
  createdAt: string;
}

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
    
    // Get current user
    const user = await tidalAPI.getCurrentUser();
    
    // Get user's playlists
    const userPlaylists = await tidalAPI.getUserPlaylists(user.id);
    
    // Transform to extension format
    const playlists: ExtensionPlaylist[] = userPlaylists.map(playlist => ({
      id: playlist.id,
      title: playlist.title,
      description: playlist.description,
      trackCount: playlist.trackCount,
      coverImage: playlist.picture,
      creator: user.username,
      isCollaborative: false, // Tidal doesn't expose this directly
      createdAt: new Date().toISOString() // Tidal doesn't expose creation date
    }));

    // Add some mock collaborative playlists for demo
    const mockCollaborativePlaylists: ExtensionPlaylist[] = [
      {
        id: 'collab1',
        title: 'Video Game Music',
        description: 'Epic soundtracks from our favorite games',
        trackCount: 67,
        coverImage: 'https://resources.tidal.com/images/collab1/640x640.jpg',
        creator: 'adigo',
        isCollaborative: true,
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'collab2',
        title: 'Late Night Vibes',
        description: 'Chill music for late night sessions',
        trackCount: 42,
        coverImage: 'https://resources.tidal.com/images/collab2/640x640.jpg',
        creator: 'musiclover',
        isCollaborative: true,
        createdAt: '2024-01-10T15:30:00Z'
      }
    ];

    const allPlaylists = [...playlists, ...mockCollaborativePlaylists];

    res.json({
      playlists: allPlaylists,
      user: {
        id: user.id,
        username: user.username,
        picture: user.picture
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
} 