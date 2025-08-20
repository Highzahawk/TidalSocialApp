import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '../../../../env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Generate a random state parameter for security
  const state = Math.random().toString(36).substring(2, 15);
  
  // Store state in session or database (for now, we'll use a simple approach)
  // In production, you'd want to store this securely
  
  // Build the TIDAL OAuth URL using correct environment variables
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.TIDAL_CLIENT_ID,
    redirect_uri: env.TIDAL_REDIRECT_URI,
    scope: 'user.read collection.read search.read playlists.write playlists.read', // Scopes from your portal
    state: state
  });

  // Use the correct auth URL from environment
  const authUrl = `${env.TIDAL_AUTH_URL}?${params.toString()}`;
  
  console.log('=== TIDAL OAUTH DEBUG ===');
  console.log('Auth URL:', authUrl);
  console.log('Client ID:', env.TIDAL_CLIENT_ID);
  console.log('Redirect URI:', env.TIDAL_REDIRECT_URI);
  console.log('========================');
  
  // Redirect to TIDAL's OAuth page
  res.redirect(authUrl);
}
