'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const [feedData, setFeedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [oauthUser, setOauthUser] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for OAuth callback parameters
    const success = searchParams.get('success');
    const user = searchParams.get('user');
    const error = searchParams.get('error');
    
    if (success && user) {
      setOauthUser(user);
      // Clear URL parameters
      window.history.replaceState({}, '', '/');
    }
    
    if (error) {
      console.error('OAuth error:', error);
      // Clear URL parameters
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'loading') return;
    
    fetch("/api/feed")
      .then(res => res.json())
      .then(data => {
        setFeedData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch feed:', err);
        setLoading(false);
      });
  }, [status]);

  if (status === 'loading') {
    return (
      <main className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Tidal Social</h1>
          <p className="opacity-80 mt-2">Your music social network</p>
        </div>
        
        <div className="flex items-center gap-4">
          {session || oauthUser ? (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm opacity-80">Welcome back</p>
                <p className="font-medium">{oauthUser || session?.user?.name}</p>
              </div>
              <button
                onClick={() => {
                  signOut();
                  setOauthUser(null);
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => window.location.href = '/api/auth/tidal/authorize-pkce'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Connect TIDAL (PKCE)
            </button>
          )}
        </div>
      </div>

      {session || oauthUser ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Friends Feed</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
              <p className="mt-2">Loading feed...</p>
            </div>
          ) : feedData ? (
            <ul className="space-y-2">
              {feedData.items.map((it: any) => (
                <li key={it.id} className="opacity-90 p-3 bg-neutral-900 rounded-lg">
                  <strong>{it.artist}</strong> — {it.track} 
                  <span className="opacity-60 ml-2">({new Date(it.playedAtUtc).toLocaleString()})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center py-8 opacity-60">No activity yet</p>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Get Started</h2>
          <p className="opacity-80 mb-6">Connect your TIDAL account to see your friends' music activity</p>
          <button
            onClick={() => window.location.href = '/api/auth/tidal/authorize'}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Connect with TIDAL
          </button>
        </div>
      )}
    </main>
  );
}
