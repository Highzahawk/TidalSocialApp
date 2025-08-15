import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '../../../../env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try a different approach - maybe TIDAL uses a different OAuth flow
    // Let's try the standard OAuth2 endpoints but with different parameters
    
    const state = Math.random().toString(36).substring(2, 15);
    
    // Try with different OAuth parameters
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.TIDAL_CLIENT_ID,
      redirect_uri: env.TIDAL_REDIRECT_URI,
      scope: 'user.read', // Minimal scope
      state: state,
      // Add any additional parameters that might be required
      prompt: 'consent' // Force consent screen
    });

    // Try different possible TIDAL OAuth endpoints
    const possibleEndpoints = [
      'https://auth.tidal.com/oauth2/authorize',
      'https://api.tidal.com/oauth2/authorize',
      'https://tidal.com/oauth2/authorize',
      'https://developer.tidal.com/oauth2/authorize'
    ];

    // For now, let's try the first one and see what happens
    const authUrl = `${possibleEndpoints[0]}?${params.toString()}`;
    
    console.log('Trying TIDAL OAuth with URL:', authUrl);
    
    res.redirect(authUrl);
    
  } catch (error) {
    console.error('SDK auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
