import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // This endpoint shows what parameters TIDAL sent to any callback
  const { code, state, error, ...otherParams } = req.query;
  
  const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>) || {};

  res.json({
    message: 'Callback Debug Info',
    params: {
      code: code ? `${code}`.substring(0, 20) + '...' : 'MISSING',
      state,
      error,
      otherParams
    },
    cookies: {
      tidal_code_verifier: cookies.tidal_code_verifier ? 'PRESENT' : 'MISSING',
      allCookies: Object.keys(cookies)
    },
    headers: {
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer
    }
  });
}