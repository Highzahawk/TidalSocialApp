import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '../../../../env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Test the OAuth flow step by step
  try {
    // Build the TIDAL OAuth URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.TIDAL_CLIENT_ID,
      redirect_uri: env.TIDAL_REDIRECT_URI,
      scope: 'user.read playlists.read playback',
      state: 'test'
    });

    const authUrl = `https://auth.tidal.com/v1/oauth2/authorize?${params.toString()}`;
    
    res.json({
      success: true,
      authUrl,
      clientId: env.TIDAL_CLIENT_ID ? 'Set' : 'Missing',
      redirectUri: env.TIDAL_REDIRECT_URI,
      message: 'Click the authUrl to test the OAuth flow'
    });
    
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ error: 'Test failed', details: error });
  }
}
