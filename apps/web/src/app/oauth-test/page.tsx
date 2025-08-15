'use client';

import { useEffect, useState } from 'react';

export default function OAuthTestPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/tidal/debug-oauth')
      .then(res => res.json())
      .then(data => {
        setDebugInfo(data);
        setLoading(false);
      })
      .catch(err => {
        setDebugInfo({ error: err.message });
        setLoading(false);
      });
  }, []);

  const testTokenEndpoint = async () => {
    const response = await fetch('/api/auth/tidal/debug-oauth?test=token');
    const result = await response.json();
    setDebugInfo(prev => ({ ...prev, tokenTest: result }));
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">TIDAL OAuth Debug</h1>
      
      <div className="space-y-6">
        <div className="bg-neutral-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Configuration</h2>
          <pre className="text-sm">{JSON.stringify(debugInfo?.config, null, 2)}</pre>
        </div>

        <div className="bg-neutral-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Test URLs</h2>
          <div className="space-y-2">
            {debugInfo?.testUrls?.map((url: any, index: number) => (
              <div key={index} className="border border-neutral-700 p-3 rounded">
                <h3 className="font-medium">{url.name}</h3>
                <p className="text-sm text-neutral-400 mb-2">{url.description}</p>
                <a 
                  href={url.authUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm break-all"
                >
                  {url.authUrl}
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Token Endpoint Test</h2>
          <button 
            onClick={testTokenEndpoint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Test Token Endpoint
          </button>
          {debugInfo?.tokenTest && (
            <pre className="text-sm mt-2">{JSON.stringify(debugInfo.tokenTest, null, 2)}</pre>
          )}
        </div>

        <div className="bg-neutral-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Instructions</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {debugInfo?.instructions?.map((instruction: string, index: number) => (
              <li key={index}>{instruction}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
