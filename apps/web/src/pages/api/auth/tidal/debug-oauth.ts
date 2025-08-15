import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '../../../../env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { test } = req.query;

  if (test === 'token') {
    // Test token endpoint directly
    try {
      const response = await fetch('https://auth.tidal.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: env.TIDAL_CLIENT_ID,
          client_secret: env.TIDAL_CLIENT_SECRET,
        }),
      });

      const result = await response.text();
      return res.json({
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        body: result
      });
    } catch (error) {
      return res.json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Show configuration and test URLs
  const config = {
    clientId: env.TIDAL_CLIENT_ID ? `${env.TIDAL_CLIENT_ID.substring(0, 8)}...` : 'MISSING',
    hasClientSecret: !!env.TIDAL_CLIENT_SECRET,
    redirectUri: env.TIDAL_REDIRECT_URI,
    scopes: 'user.read playlists.read playback'
  };

  const testUrls = [
    {
      name: 'Standard OAuth2',
      authUrl: `https://auth.tidal.com/oauth2/authorize?response_type=code&client_id=${env.TIDAL_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.TIDAL_REDIRECT_URI)}&scope=${encodeURIComponent('user.read playlists.read playback')}&state=test`,
      description: 'Standard OAuth2 flow'
    },
    {
      name: 'Minimal Scopes',
      authUrl: `https://auth.tidal.com/oauth2/authorize?response_type=code&client_id=${env.TIDAL_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.TIDAL_REDIRECT_URI)}&scope=${encodeURIComponent('user.read')}&state=test`,
      description: 'Try with minimal scopes first'
    },
    {
      name: 'Alternative Domain',
      authUrl: `https://api.tidal.com/oauth2/authorize?response_type=code&client_id=${env.TIDAL_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.TIDAL_REDIRECT_URI)}&scope=${encodeURIComponent('user.read')}&state=test`,
      description: 'Try api.tidal.com instead of auth.tidal.com'
    }
  ];

  res.json({
    config,
    testUrls,
    instructions: [
      '1. Check that your TIDAL app has the correct redirect URI configured',
      '2. Try the "Minimal Scopes" URL first',
      '3. Make sure your client ID and secret are correct',
      '4. Check TIDAL developer portal for any additional requirements'
    ]
  });
}
