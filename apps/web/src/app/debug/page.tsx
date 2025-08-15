'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function DebugPage() {
  const { data: session, status } = useSession();
  const [envCheck, setEnvCheck] = useState<any>(null);
  const [dbCheck, setDbCheck] = useState<any>(null);

  useEffect(() => {
    // Check environment variables
    fetch('/api/debug/env')
      .then(res => res.json())
      .then(data => setEnvCheck(data))
      .catch(err => setEnvCheck({ error: err.message }));

    // Check database connection
    fetch('/api/debug/db')
      .then(res => res.json())
      .then(data => setDbCheck(data))
      .catch(err => setDbCheck({ error: err.message }));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-neutral-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Session Status</h2>
          <pre className="text-sm">{JSON.stringify({ status, session }, null, 2)}</pre>
        </div>

        <div className="bg-neutral-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Environment Check</h2>
          <pre className="text-sm">{JSON.stringify(envCheck, null, 2)}</pre>
        </div>

        <div className="bg-neutral-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Database Check</h2>
          <pre className="text-sm">{JSON.stringify(dbCheck, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
