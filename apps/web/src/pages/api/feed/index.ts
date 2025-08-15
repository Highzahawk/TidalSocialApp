import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const limit = Number(req.query.limit ?? 50);
  const cursor = req.query.cursor as string | undefined;

  let cursorFilter: any = {};
  if (cursor) {
    const [ts, id] = Buffer.from(cursor, 'base64').toString('utf8').split('|');
    cursorFilter = {
      OR: [
        { playedAtUtc: { lt: new Date(ts) } },
        { AND: [{ playedAtUtc: new Date(ts) }, { id: { lt: id } }] }
      ]
    };
  }

  const items = await prisma.listeningEvent.findMany({
    where: cursor ? cursorFilter : {},
    orderBy: [{ playedAtUtc: 'desc' }, { id: 'desc' }],
    take: limit
  });

  // If no real data, return sample data
  if (items.length === 0) {
    const sampleItems = [
      {
        id: 'sample-1',
        artist: 'Daft Punk',
        track: 'Get Lucky',
        album: 'Random Access Memories',
        playedAtUtc: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        nowPlaying: false
      },
      {
        id: 'sample-2',
        artist: 'The Weeknd',
        track: 'Blinding Lights',
        album: 'After Hours',
        playedAtUtc: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        nowPlaying: false
      },
      {
        id: 'sample-3',
        artist: 'Tame Impala',
        track: 'The Less I Know The Better',
        album: 'Currents',
        playedAtUtc: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        nowPlaying: false
      },
      {
        id: 'sample-4',
        artist: 'Glass Animals',
        track: 'Heat Waves',
        album: 'Dreamland',
        playedAtUtc: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        nowPlaying: false
      },
      {
        id: 'sample-5',
        artist: 'Arctic Monkeys',
        track: 'Do I Wanna Know?',
        album: 'AM',
        playedAtUtc: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        nowPlaying: false
      }
    ];

    return res.json({ 
      items: sampleItems.slice(0, limit), 
      nextCursor: null,
      isSampleData: true 
    });
  }

  const nextCursor = items.length
    ? Buffer.from(`${items[items.length - 1].playedAtUtc.toISOString()}|${items[items.length - 1].id}`).toString('base64')
    : null;

  res.json({ items, nextCursor });
}
