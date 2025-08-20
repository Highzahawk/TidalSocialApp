import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '../../../../env';
import crypto from 'crypto';

// PKCE helper functions
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = Math.random().toString(36).substring(2, 15);

  // Store code verifier in session/cookie for callback
  // For now, we'll use a simple approach - in production use secure session storage
  res.setHeader('Set-Cookie', `tidal_code_verifier=${codeVerifier}; HttpOnly; Path=/; SameSite=Lax`);

  // Build TIDAL OAuth URL with PKCE
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.TIDAL_CLIENT_ID,
    redirect_uri: env.TIDAL_REDIRECT_URI,
    scope: 'user.read collection.read playlists.read', // Start with basic scopes
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  const authUrl = `${env.TIDAL_AUTH_URL}?${params.toString()}`;
  
  console.log('=== TIDAL OAUTH WITH PKCE ===');
  console.log('Auth URL:', authUrl);
  console.log('Code Challenge:', codeChallenge);
  console.log('Code Verifier stored in cookie');
  console.log('=============================');
  
  res.redirect(authUrl);
}