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
  
  console.log('=== TESTING WHAT TIDAL DATA WE CAN ACCESS ===');
  
  // Try common country codes - TIDAL requires this for licensing
  const countryCodes = ['US', 'CA', 'GB', 'DE', 'NO']; // US, Canada, UK, Germany, Norway
  
  const endpointsToTry = [
    `/users/${userId}/playlists?limit=5&countryCode=US`,
    `/users/${userId}/favorites/albums?limit=5&countryCode=US`,
    `/users/${userId}/favorites/tracks?limit=5&countryCode=US`,
    `/users/${userId}/favorites/artists?limit=5&countryCode=US`,
    `/playlists/featured?limit=5&countryCode=US`,
    `/albums/top?limit=5&countryCode=US`,
    `/search/tracks?query=popular&limit=3&countryCode=US`
  ];
  
  const results = {};
  
  for (const endpoint of endpointsToTry) {
    const fullUrl = `${env.TIDAL_API_BASE}${endpoint}`;
    console.log(`\n--- Trying: ${endpoint} ---`);
    
    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'X-Tidal-Token': accessToken
        },
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS - Found items:', data.items?.length || 'N/A');
        console.log('Sample:', JSON.stringify(data.items?.[0] || data, null, 2).substring(0, 200) + '...');
        results[endpoint] = { 
          success: true, 
          count: data.items?.length || 0,
          sample: data.items?.[0] || data 
        };
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
  
  res.json({ 
    message: "This shows what TIDAL data we can actually access with your login",
    userId,
    results 
  });
}