# Tidal Social (Starter)

A companion app + Chrome extension adding friends feed and collaborative playlists to TIDAL (via Last.fm + TIDAL APIs).

## Quick start
1. **Clone** and create envs
   ```bash
   pnpm i
   cp .env.example .env
   docker-compose up -d
   pnpm --filter ./apps/web prisma db push
   ```
2. **Run**
   ```bash
   pnpm dev
   ```
3. Visit **http://localhost:3000**. The API stubs and Prisma are ready; NextAuth uses a temporary dev login (replace with real OAuth later).

## Next steps
- Implement TIDAL OAuth + Last.fm auth providers.
- Build worker jobs: scrobble ingest, track resolution, playlist writer.
- Flesh out API endpoints with auth + RLS checks.
- Wire the Chrome extension to your backend and render the real feed.
