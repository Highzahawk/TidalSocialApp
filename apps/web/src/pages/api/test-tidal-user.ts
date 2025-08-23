import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { env } from '../../env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !(session as any).accessToken) {
    return res.status(401).json({ error: 'No session or access token' });
  }

  const accessToken = (session as any).accessToken;
  const userId = (session as any).tidalUserId;
  
  console.log('=== TESTING TIDAL USER API ENDPOINTS ===');
  console.log('User ID:', userId);
  console.log('Access token (first 20 chars):', accessToken?.substring(0, 20) + '...');
  
  const endpointsToTry = [
    `/users/me`,
    `/users/${userId}`,
    `/user`,
    `/me`,
    `/users/current`
  ];
  
  const results = {};
  
  for (const endpoint of endpointsToTry) {
    const fullUrl = `${env.TIDAL_API_BASE}${endpoint}`;
    console.log(`\n--- Trying: ${fullUrl} ---`);
    
    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS:');
        console.log(JSON.stringify(data, null, 2));
        results[endpoint] = { success: true, data };
      } else {
        const errorText = await response.text();
        console.log('❌ FAILED:', errorText);
        results[endpoint] = { success: false, status: response.status, error: errorText };
      }
    } catch (error) {
      console.log('❌ EXCEPTION:', error.message);
      results[endpoint] = { success: false, error: error.message };
    }
  }
  
  res.json({ results });
}