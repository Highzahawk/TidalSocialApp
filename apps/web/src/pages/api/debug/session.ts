import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import jwt from 'jsonwebtoken';
import { env } from '../../../env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers for extension
  res.setHeader('Access-Control-Allow-Origin', 'https://listen.tidal.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const session = await getServerSession(req, res, authOptions);
  
  const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>) || {};

  // Try to decode the raw JWT
  let rawJWT = null;
  const sessionToken = cookies['__Secure-next-auth.session-token'] || cookies['next-auth.session-token'];
  if (sessionToken) {
    try {
      rawJWT = jwt.decode(sessionToken);
      console.log('Raw JWT decoded:', rawJWT);
    } catch (err) {
      console.log('JWT decode error:', err);
    }
  }

  res.json({
    token,
    session,
    cookies: Object.keys(cookies),
    hasNextAuthToken: !!cookies['next-auth.session-token'] || !!cookies['__Secure-next-auth.session-token'],
    rawJWT,
    nextAuthSecret: !!env.NEXTAUTH_SECRET
  });
}