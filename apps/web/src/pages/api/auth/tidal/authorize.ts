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
  
  // Build the TIDAL OAuth URL
  // Try with minimal scopes first to avoid permission issues
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.TIDAL_CLIENT_ID,
    redirect_uri: env.TIDAL_REDIRECT_URI,
    scope: 'user.read', // Start with minimal scope
    state: state
  });

  // Try different OAuth endpoint paths - let's try the most common variations
  const possibleEndpoints = [
    'https://auth.tidal.com/oauth/authorize',
    'https://auth.tidal.com/auth/authorize',
    'https://auth.tidal.com/connect/authorize',
    'https://api.tidal.com/oauth/authorize',
    'https://api.tidal.com/auth/authorize',
    'https://api.tidal.com/connect/authorize'
  ];

  // Try the first one for now
  const authUrl = `${possibleEndpoints[0]}?${params.toString()}`;
  
  // Redirect to TIDAL's OAuth page
  res.redirect(authUrl);
}
