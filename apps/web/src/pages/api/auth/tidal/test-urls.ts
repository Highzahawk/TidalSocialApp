import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '../../../../env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const baseParams = {
    response_type: 'code',
    client_id: env.TIDAL_CLIENT_ID,
    redirect_uri: env.TIDAL_REDIRECT_URI,
    scope: 'user.read playlists.read playback',
    state: 'test'
  };

  // Test different TIDAL OAuth URL variations
  const urlVariations = [
    {
      name: 'Current (v1)',
      authUrl: `https://auth.tidal.com/v1/oauth2/authorize?${new URLSearchParams(baseParams).toString()}`,
      tokenUrl: 'https://auth.tidal.com/v1/oauth2/token'
    },
    {
      name: 'Without v1',
      authUrl: `https://auth.tidal.com/oauth2/authorize?${new URLSearchParams(baseParams).toString()}`,
      tokenUrl: 'https://auth.tidal.com/oauth2/token'
    },
    {
      name: 'Alternative domain',
      authUrl: `https://api.tidal.com/oauth2/authorize?${new URLSearchParams(baseParams).toString()}`,
      tokenUrl: 'https://api.tidal.com/oauth2/token'
    }
  ];

  res.json({
    environment: {
      hasClientId: !!env.TIDAL_CLIENT_ID,
      hasClientSecret: !!env.TIDAL_CLIENT_SECRET,
      redirectUri: env.TIDAL_REDIRECT_URI
    },
    urlVariations,
    recommendation: 'Try the "Without v1" variation first, as many OAuth providers don\'t use version prefixes'
  });
}
