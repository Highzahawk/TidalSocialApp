import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createTidalAPI } from '../../../lib/tidal-api';

export interface FriendActivity {
  id: string;
  username: string;
  avatar?: string;
  currentTrack?: {
    id: string;
    title: string;
    artist: string;
    album?: string;
    albumArt?: string;
    timestamp: string;
  };
  status: 'online' | 'offline' | 'listening';
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
    
    // For now, return mock data since Tidal doesn't have a direct friends API
    // In a real implementation, you'd query your database for connected friends
    // and their current listening status
    
    const mockFriendsActivity: FriendActivity[] = [
      {
        id: '1',
        username: 'adigo',
        avatar: '/api/extension/avatar/adigo',
        currentTrack: {
          id: 'track1',
          title: 'HYAENA',
          artist: 'Travis Scott',
          album: 'UTOPIA',
          albumArt: 'https://resources.tidal.com/images/12345678/640x640.jpg',
          timestamp: 'Now'
        },
        status: 'listening'
      },
      {
        id: '2',
        username: 'musiclover',
        avatar: '/api/extension/avatar/musiclover',
        currentTrack: {
          id: 'track2',
          title: 'FE!N',
          artist: 'Travis Scott',
          album: 'UTOPIA',
          albumArt: 'https://resources.tidal.com/images/87654321/640x640.jpg',
          timestamp: '10 Min Ago'
        },
        status: 'listening'
      },
      {
        id: '3',
        username: 'playlist_creator',
        avatar: '/api/extension/avatar/playlist_creator',
        status: 'offline'
      }
    ];

    res.json({
      friends: mockFriendsActivity,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching friends activity:', error);
    res.status(500).json({ error: 'Failed to fetch friends activity' });
  }
} 