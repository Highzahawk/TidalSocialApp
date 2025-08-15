export default async function Home() {
  const res = await fetch("http://localhost:3000/api/feed", { cache: "no-store" });
  const data = await res.json();
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Tidal Social</h1>
      <p className="opacity-80 mt-2">Friends feed (sample data):</p>
      <ul className="mt-4 space-y-2">
        {data.items.map((it: any) => (
          <li key={it.id} className="opacity-90">
            <strong>{it.artist}</strong> — {it.track} <span className="opacity-60">({new Date(it.playedAtUtc).toLocaleString()})</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
