import type { NextApiRequest, NextApiResponse } from 'next';
import { env } from '../../../../env';
import { prisma } from '../../../../lib/prisma';
import { encode } from 'next-auth/jwt';

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
    // Get code verifier from cookie
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>) || {};

    const codeVerifier = cookies.tidal_code_verifier;
    if (!codeVerifier) {
      console.error('Code verifier not found in cookies');
      return res.redirect('/?error=missing_code_verifier');
    }

    console.log('Starting PKCE OAuth callback with code:', code);
    console.log('Code verifier found:', !!codeVerifier);

    // Exchange authorization code for access token using PKCE
    const tokenResponse = await fetch(env.TIDAL_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: env.TIDAL_CLIENT_ID,
        code: code as string,
        redirect_uri: env.TIDAL_REDIRECT_URI,
        code_verifier: codeVerifier, // PKCE parameter
      }),
    });

    console.log('Token response status:', tokenResponse.status);
    console.log('Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      });
      return res.redirect(`/?error=token_exchange_failed&details=${encodeURIComponent(errorText)}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token response data:', tokenData);
    
    // Decode the access token to see what scopes we actually got
    if (tokenData.access_token) {
      try {
        const tokenParts = tokenData.access_token.split('.');
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('=== ACCESS TOKEN PAYLOAD ===');
        console.log('Scopes granted:', payload.scope);
        console.log('Full payload:', payload);
      } catch (e) {
        console.log('Could not decode access token:', e.message);
      }
    }
    
    // Clear the code verifier cookie
    res.setHeader('Set-Cookie', 'tidal_code_verifier=; HttpOnly; Path=/; Max-Age=0');

    // Try to get real user info from TIDAL OpenAPI v2
    let userData = {
      id: String(tokenData.user_id),
      username: `Music Lover ${tokenData.user_id}`
    };
    
    try {
      console.log('=== GETTING REAL TIDAL USER INFO ===');
      const userInfoResponse = await fetch(`https://openapi.tidal.com/v2/users/me`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.api+json',
        },
      });
      
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        console.log('✅ GOT REAL USER INFO:', JSON.stringify(userInfo, null, 2));
        
        const attrs = userInfo.data?.attributes;
        if (attrs) {
          userData.username = attrs.firstName ? 
            `${attrs.firstName} ${attrs.lastName || ''}`.trim() :
            attrs.username || `Music Lover ${tokenData.user_id}`;
          console.log('🎉 Using real name:', userData.username);
        }
      } else {
        console.log('❌ Failed to get user info, using fallback');
      }
    } catch (error) {
      console.log('❌ Exception getting user info:', error.message);
    }
    
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

    // Create NextAuth-compatible JWT using NextAuth's encode function
    const sessionToken = await encode({
      token: {
        sub: user.id,
        name: user.displayName,
        email: `${user.tidalUserId}@tidal.com`,
        tidalUserId: user.tidalUserId,
        accessToken: tokenData.access_token,
      },
      secret: env.NEXTAUTH_SECRET,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Set NextAuth session cookie directly
    const cookieName = 'next-auth.session-token';
    const cookieOptions = `${cookieName}=${sessionToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`;

    res.setHeader('Set-Cookie', cookieOptions);
    
    console.log('Session cookie set, redirecting to home');
    res.redirect('/');
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/?error=callback_error');
  }
}