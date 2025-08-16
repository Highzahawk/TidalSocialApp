import type { NextApiRequest, NextApiResponse } from 'next';

const TIDAL_CLIENT_ID = process.env.TIDAL_CLIENT_ID || 'your-client-id';
const TIDAL_REDIRECT_URI = process.env.TIDAL_REDIRECT_URI || 'http://localhost:3000/api/auth/tidal/callback';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate OAuth state for security
    const state = Math.random().toString(36).substring(7);
    
    // Store state in session/cookie for verification
    res.setHeader('Set-Cookie', `tidal_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax`);
    
    // Construct Tidal OAuth URL
    const authUrl = new URL('https://auth.tidal.com/v1/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', TIDAL_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', TIDAL_REDIRECT_URI);
    authUrl.searchParams.set('scope', 'r_usr w_usr w_sub');
    authUrl.searchParams.set('state', state);
    
    // Redirect to Tidal OAuth
    res.redirect(authUrl.toString());
  } catch (error) {
    console.error('Tidal OAuth error:', error);
    res.status(500).json({ error: 'Failed to start OAuth flow' });
  }
}
