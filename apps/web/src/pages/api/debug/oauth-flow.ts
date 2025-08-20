import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '../../../env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { step } = req.query;

  if (step === 'test-auth-url') {
    // Test if the authorization URL is accessible
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.TIDAL_CLIENT_ID,
      redirect_uri: env.TIDAL_REDIRECT_URI,
      scope: 'user.read collection.read search.read playlists.write playlists.read',
      state: 'debug-test'
    });

    const authUrl = `${env.TIDAL_AUTH_URL}?${params.toString()}`;
    
    try {
      // Try to fetch the auth URL (should return HTML or redirect)
      const response = await fetch(authUrl, { 
        method: 'GET',
        redirect: 'manual' // Don't follow redirects
      });
      
      return res.json({
        authUrl,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        isRedirect: response.status >= 300 && response.status < 400,
        body: response.status < 400 ? await response.text() : null
      });
    } catch (error) {
      return res.json({
        authUrl,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (step === 'check-config') {
    return res.json({
      config: {
        TIDAL_CLIENT_ID: env.TIDAL_CLIENT_ID,
        TIDAL_CLIENT_SECRET: env.TIDAL_CLIENT_SECRET ? 'SET' : 'MISSING',
        TIDAL_REDIRECT_URI: env.TIDAL_REDIRECT_URI,
        TIDAL_AUTH_URL: env.TIDAL_AUTH_URL,
        TIDAL_TOKEN_URL: env.TIDAL_TOKEN_URL,
        TIDAL_API_BASE: env.TIDAL_API_BASE
      },
      authUrlExample: `${env.TIDAL_AUTH_URL}?response_type=code&client_id=${env.TIDAL_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.TIDAL_REDIRECT_URI)}&scope=${encodeURIComponent('user.read collection.read search.read playlists.write playlists.read')}&state=test`
    });
  }

  return res.json({
    message: 'OAuth Flow Debugger',
    endpoints: [
      '?step=check-config - Check configuration',
      '?step=test-auth-url - Test if auth URL is accessible'
    ]
  });
}