import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers for extension
  res.setHeader('Access-Control-Allow-Origin', 'https://listen.tidal.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { artist, track, album, playedAtUtc, nowPlaying, source, tidalTrackId } = req.body;

    // Validate required fields
    if (!artist || !track) {
      return res.status(400).json({ error: 'Artist and track are required' });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { tidalUserId: (session as any).tidalUserId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If this is a now playing event, clear previous now playing entries
    if (nowPlaying) {
      await prisma.listeningEvent.updateMany({
        where: { 
          userId: user.tidalUserId,
          nowPlaying: true 
        },
        data: { nowPlaying: false }
      });
    }

    // Create the listening event
    const listeningEvent = await prisma.listeningEvent.create({
      data: {
        userId: user.tidalUserId,
        artist: artist.trim(),
        track: track.trim(),
        album: album?.trim() || null,
        playedAtUtc: playedAtUtc ? new Date(playedAtUtc) : new Date(),
        nowPlaying: nowPlaying || false,
        tidalTrackId: tidalTrackId || null,
        rawJson: {
          source: source || 'unknown',
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString()
        }
      }
    });

    console.log(`[ListeningEvents] Created event for ${user.displayName}: ${artist} - ${track}`);

    // Return the created event
    res.status(201).json({
      id: listeningEvent.id,
      artist: listeningEvent.artist,
      track: listeningEvent.track,
      album: listeningEvent.album,
      playedAtUtc: listeningEvent.playedAtUtc,
      nowPlaying: listeningEvent.nowPlaying,
      success: true
    });

  } catch (error) {
    console.error('[ListeningEvents] Error creating listening event:', error);
    
    // Handle Prisma unique constraint violations
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Duplicate listening event',
        message: 'This exact track at this time was already recorded'
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}