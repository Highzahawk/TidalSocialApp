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

  const nextCursor = items.length
    ? Buffer.from(`${items[items.length - 1].playedAtUtc.toISOString()}|${items[items.length - 1].id}`).toString('base64')
    : null;

  res.json({ items, nextCursor });
}
