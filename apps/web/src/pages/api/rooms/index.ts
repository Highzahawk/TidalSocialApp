import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { name } = req.body as { name: string };
    const room = await prisma.collabRoom.create({ data: { name, ownerUserId: 'owner_tbd', tidalPlaylistId: 'tbd' } });
    return res.status(201).json(room);
  }
  if (req.method === 'GET') {
    const rooms = await prisma.collabRoom.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(rooms);
  }
  return res.status(405).end();
}
