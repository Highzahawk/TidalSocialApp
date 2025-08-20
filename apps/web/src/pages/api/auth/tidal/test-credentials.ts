import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '../../../../env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test client credentials flow (this should work without OAuth)
    const tokenResponse = await fetch(env.TIDAL_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: env.TIDAL_CLIENT_ID,
        client_secret: env.TIDAL_CLIENT_SECRET,
      }),
    });

    const responseText = await tokenResponse.text();
    
    res.json({
      status: tokenResponse.status,
      ok: tokenResponse.ok,
      headers: Object.fromEntries(tokenResponse.headers.entries()),
      body: responseText,
      config: {
        tokenUrl: env.TIDAL_TOKEN_URL,
        clientId: env.TIDAL_CLIENT_ID.substring(0, 8) + '...',
        hasSecret: !!env.TIDAL_CLIENT_SECRET
      }
    });
  } catch (error) {
    res.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        tokenUrl: env.TIDAL_TOKEN_URL,
        clientId: env.TIDAL_CLIENT_ID.substring(0, 8) + '...',
        hasSecret: !!env.TIDAL_CLIENT_SECRET
      }
    });
  }
}