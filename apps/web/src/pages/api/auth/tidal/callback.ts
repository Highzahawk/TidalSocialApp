import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '../../../../env';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error } = req.query;

  if (error) {
    console.error('OAuth error:', error);
    return res.redirect(`/?error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    console.error('No authorization code received');
    return res.redirect('/?error=no_code');
  }

  try {
    console.log('Starting OAuth callback with code:', code);
    console.log('Environment check:', {
      hasClientId: !!env.TIDAL_CLIENT_ID,
      hasClientSecret: !!env.TIDAL_CLIENT_SECRET,
      redirectUri: env.TIDAL_REDIRECT_URI
    });

    // Exchange authorization code for access token
    // Use the alternative TIDAL token endpoint
    const tokenResponse = await fetch('https://api.tidal.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        client_id: env.TIDAL_CLIENT_ID,
        client_secret: env.TIDAL_CLIENT_SECRET,
        redirect_uri: env.TIDAL_REDIRECT_URI,
      }),
    });

    console.log('Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return res.redirect('/?error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();
    console.log('Token response data:', tokenData);
    
    // Create user data
    const userData = {
      id: tokenData.user_id || 'tidal_user_' + Math.random().toString(36).substring(2, 15),
      username: 'TIDAL User ' + Math.random().toString(36).substring(2, 8)
    };
    
    console.log('Created user data:', userData);

    // Save or update user in database
    const user = await prisma.user.upsert({
      where: { tidalUserId: userData.id },
      update: {
        tidalAccessToken: tokenData.access_token,
        tidalRefreshToken: tokenData.refresh_token,
        tidalExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        displayName: userData.username,
      },
      create: {
        tidalUserId: userData.id,
        tidalAccessToken: tokenData.access_token,
        tidalRefreshToken: tokenData.refresh_token,
        tidalExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        displayName: userData.username,
      },
    });

    console.log('User saved to database:', user.id);

    // Redirect to home page with success
    res.redirect('/?success=true&user=' + encodeURIComponent(userData.username));
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/?error=callback_error');
  }
}
