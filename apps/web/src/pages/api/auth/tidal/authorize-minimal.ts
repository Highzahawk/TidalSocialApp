import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '../../../../env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Minimal OAuth request - no scopes, just basic authorization
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.TIDAL_CLIENT_ID,
    redirect_uri: env.TIDAL_REDIRECT_URI,
    state: 'minimal-test'
  });

  const authUrl = `${env.TIDAL_AUTH_URL}?${params.toString()}`;
  
  console.log('=== MINIMAL TIDAL OAUTH TEST ===');
  console.log('Auth URL:', authUrl);
  console.log('No scopes, minimal params only');
  console.log('===============================');
  
  res.redirect(authUrl);
}