import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '../../../../env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { test } = req.query;

  if (test === 'all') {
    // Test all possible OAuth configurations
    const testConfigs = [
      {
        name: 'Standard OAuth2 (auth.tidal.com)',
        authUrl: 'https://auth.tidal.com/oauth2/authorize',
        tokenUrl: 'https://auth.tidal.com/oauth2/token',
        scopes: ['user.read', 'user.read playlists.read', 'user.read playlists.read playback']
      },
      {
        name: 'API Domain (api.tidal.com)',
        authUrl: 'https://api.tidal.com/oauth2/authorize',
        tokenUrl: 'https://api.tidal.com/oauth2/token',
        scopes: ['user.read', 'user.read playlists.read', 'user.read playlists.read playback']
      },
      {
        name: 'Main Domain (tidal.com)',
        authUrl: 'https://tidal.com/oauth2/authorize',
        tokenUrl: 'https://tidal.com/oauth2/token',
        scopes: ['user.read', 'user.read playlists.read', 'user.read playlists.read playback']
      },
      {
        name: 'Developer Domain (developer.tidal.com)',
        authUrl: 'https://developer.tidal.com/oauth2/authorize',
        tokenUrl: 'https://developer.tidal.com/oauth2/token',
        scopes: ['user.read', 'user.read playlists.read', 'user.read playlists.read playback']
      }
    ];

    const results = [];

    for (const config of testConfigs) {
      for (const scope of config.scopes) {
        const params = new URLSearchParams({
          response_type: 'code',
          client_id: env.TIDAL_CLIENT_ID,
          redirect_uri: env.TIDAL_REDIRECT_URI,
          scope: scope,
          state: 'test'
        });

        const authUrl = `${config.authUrl}?${params.toString()}`;
        
        results.push({
          name: `${config.name} - ${scope}`,
          authUrl: authUrl,
          tokenUrl: config.tokenUrl
        });
      }
    }

    return res.json({
      config: {
        clientId: env.TIDAL_CLIENT_ID ? `${env.TIDAL_CLIENT_ID.substring(0, 8)}...` : 'MISSING',
        hasClientSecret: !!env.TIDAL_CLIENT_SECRET,
        redirectUri: env.TIDAL_REDIRECT_URI
      },
      testConfigs: results,
      instructions: [
        '1. Try each URL manually in your browser',
        '2. Look for any error messages or redirects',
        '3. Check if any of these endpoints actually exist',
        '4. The first working URL will tell us the correct TIDAL OAuth setup'
      ]
    });
  }

  // Default response
  res.json({
    message: 'Add ?test=all to see all possible OAuth configurations',
    currentConfig: {
      clientId: env.TIDAL_CLIENT_ID ? `${env.TIDAL_CLIENT_ID.substring(0, 8)}...` : 'MISSING',
      redirectUri: env.TIDAL_REDIRECT_URI
    }
  });
}
