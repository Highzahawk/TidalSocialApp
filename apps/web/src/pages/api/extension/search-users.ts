import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createTidalAPI } from '../../../lib/tidal-api';

export interface SearchUser {
  id: string;
  username: string;
  avatar?: string;
  status: 'online' | 'offline' | 'listening';
  isFriend: boolean;
  currentTrack?: {
    title: string;
    artist: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const tidalAPI = createTidalAPI(session.accessToken);
    
    // In a real implementation, you'd search your database for users
    // For now, return mock search results based on the query
    
    const mockSearchResults: SearchUser[] = [
      {
        id: `user_${query}_1`,
        username: `${query}_user1`,
        avatar: `/api/extension/avatar/${query}_user1`,
        status: 'online',
        isFriend: false,
        currentTrack: {
          title: 'FE!N',
          artist: 'Travis Scott'
        }
      },
      {
        id: `user_${query}_2`,
        username: `${query}_user2`,
        avatar: `/api/extension/avatar/${query}_user2`,
        status: 'listening',
        isFriend: false,
        currentTrack: {
          title: 'HYAENA',
          artist: 'Travis Scott'
        }
      },
      {
        id: `user_${query}_3`,
        username: `${query}_user3`,
        avatar: `/api/extension/avatar/${query}_user3`,
        status: 'offline',
        isFriend: false
      }
    ];

    // Filter out empty results and limit to 10
    const filteredResults = mockSearchResults
      .filter(user => user.username.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10);

    res.json({
      users: filteredResults,
      query,
      total: filteredResults.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
} 