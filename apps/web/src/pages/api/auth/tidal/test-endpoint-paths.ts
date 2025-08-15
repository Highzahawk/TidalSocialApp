import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '../../../../env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { test } = req.query;

  if (test === 'paths') {
    // Test different OAuth endpoint paths since we know the domain works
    const baseDomains = [
      'https://auth.tidal.com',
      'https://api.tidal.com',
      'https://tidal.com'
    ];

    const oauthPaths = [
      '/oauth2/authorize',
      '/oauth/authorize',
      '/auth/oauth2/authorize',
      '/auth/authorize',
      '/v1/oauth2/authorize',
      '/v2/oauth2/authorize',
      '/api/oauth2/authorize',
      '/api/auth/authorize',
      '/connect/authorize',
      '/authorize'
    ];

    const results = [];

    for (const domain of baseDomains) {
      for (const path of oauthPaths) {
        const params = new URLSearchParams({
          response_type: 'code',
          client_id: env.TIDAL_CLIENT_ID,
          redirect_uri: env.TIDAL_REDIRECT_URI,
          scope: 'user.read',
          state: 'test'
        });

        const authUrl = `${domain}${path}?${params.toString()}`;
        
        results.push({
          name: `${domain}${path}`,
          authUrl: authUrl,
          domain: domain,
          path: path
        });
      }
    }

    return res.json({
      config: {
        clientId: env.TIDAL_CLIENT_ID ? `${env.TIDAL_CLIENT_ID.substring(0, 8)}...` : 'MISSING',
        redirectUri: env.TIDAL_REDIRECT_URI
      },
      testPaths: results,
      instructions: [
        '1. Try each URL manually in your browser',
        '2. Look for OAuth consent screen (success) or 404/error (wrong path)',
        '3. The first URL that shows a TIDAL login/consent screen is the correct one',
        '4. 404 errors mean wrong path, but we\'re on the right domain'
      ]
    });
  }

  // Default response
  res.json({
    message: 'Add ?test=paths to see all possible OAuth path combinations',
    currentConfig: {
      clientId: env.TIDAL_CLIENT_ID ? `${env.TIDAL_CLIENT_ID.substring(0, 8)}...` : 'MISSING',
      redirectUri: env.TIDAL_REDIRECT_URI
    }
  });
}
