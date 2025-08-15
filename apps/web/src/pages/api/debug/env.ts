import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '../../../env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.json({
    hasDatabaseUrl: !!env.DATABASE_URL,
    hasRedisUrl: !!env.REDIS_URL,
    hasNextAuthUrl: !!env.NEXTAUTH_URL,
    hasNextAuthSecret: !!env.NEXTAUTH_SECRET,
    hasTidalClientId: !!env.TIDAL_CLIENT_ID,
    hasTidalClientSecret: !!env.TIDAL_CLIENT_SECRET,
    hasTidalRedirectUri: !!env.TIDAL_REDIRECT_URI,
    tidalRedirectUri: env.TIDAL_REDIRECT_URI,
    nextAuthUrl: env.NEXTAUTH_URL
  });
}
