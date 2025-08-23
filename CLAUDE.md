# Tidal Social App - Development Log

## Project Overview
A social music platform built around TIDAL streaming with collaborative playlists and friend activity feeds. Users can track listening habits, follow friends, and see real-time music activity.

## Current Status: ✅ TIDAL OAuth Working!

### What's Implemented & Working:
- ✅ **TIDAL OAuth with PKCE flow** - Full authentication working
- ✅ **User management** - Login/logout, database storage
- ✅ **Database schema** - PostgreSQL with Prisma (Users, ListeningEvents, Follows, CollabRooms)
- ✅ **Basic web app** - Next.js frontend with friend feed (sample data)
- ✅ **Environment setup** - All TIDAL credentials configured

### Key Technical Decisions Made:
- **Authentication**: TIDAL OAuth 2.1 with PKCE (not standard OAuth)
- **Authorization URL**: `https://login.tidal.com/authorize` (not auth.tidal.com)
- **Token URL**: `https://auth.tidal.com/v1/oauth2/token`
- **Scopes**: `user.read collection.read playlists.read`
- **Database**: tidalUserId stored as String (TIDAL returns number, converted)

### Working Endpoints:
- `/api/auth/tidal/authorize-pkce` - PKCE OAuth initiation
- `/api/auth/callback/tidal-pkce` - OAuth callback handler
- `/api/feed` - Friend activity feed (sample data)
- `/api/auth/tidal/test-credentials` - Credential validation

## Major Problems Solved:

### 1. "Tomcat Error" (403 Forbidden)
**Problem**: Original OAuth endpoints were wrong
**Solution**: 
- Changed from `https://auth.tidal.com/v1/oauth2/authorize` 
- To `https://login.tidal.com/authorize`
- Implemented PKCE flow (required by TIDAL)

### 2. "Bearer token missing" Error
**Problem**: TIDAL expects PKCE, not standard OAuth
**Solution**: Added code_challenge/code_verifier generation and exchange

### 3. Database Type Mismatch  
**Problem**: TIDAL returns user_id as number, schema expects string
**Solution**: Added String() conversion in callback

## Current Environment (.env):
```
TIDAL_CLIENT_ID=Y7zLc6Mj5CW9OMlS
TIDAL_CLIENT_SECRET=sHXVQ9vWtqwhDx4cM4JjgJvJEvosUjKiARNZ9ScX814=
TIDAL_REDIRECT_URI=http://localhost:3000/api/auth/callback/tidal-pkce
TIDAL_AUTH_URL=https://login.tidal.com/authorize
TIDAL_TOKEN_URL=https://auth.tidal.com/v1/oauth2/token
TIDAL_API_BASE=https://api.tidal.com/v1
```

## Next Phase: Chrome Extension for Real Listening Data

### Why Extension is Needed:
- **TIDAL API limitation**: No "now playing" or listening history endpoints
- **Social features require real data**: Current feed shows sample data only
- **Extension can monitor TIDAL web player**: Extract real-time listening activity

### Planned Extension Features:
1. **Personal Tracker** (Phase 1)
   - Monitor TIDAL web player DOM
   - Extract current song data  
   - Send to server via WebSocket
   - Store in ListeningEvent table

2. **Social Features** (Phase 2)
   - Friend search/add system
   - Real-time friend presence ("brayden online - listening to John Mayer")
   - Activity feed with real data
   - Extension popup with social tabs

### Technical Architecture:
- **Content Script**: Monitor TIDAL web player
- **Background Script**: Handle WebSocket connections
- **Popup UI**: Social interface (friends, activity)
- **WebSocket Server**: Real-time updates (needs to be built)
- **Database**: Use existing schema (ListeningEvent.nowPlaying = true)

## File Structure:
```
apps/web/
├── src/
│   ├── pages/api/
│   │   ├── auth/tidal/authorize-pkce.ts ✅
│   │   └── auth/callback/tidal-pkce.ts ✅
│   ├── app/page.tsx ✅ (Connect TIDAL button)
│   └── lib/tidal-api.ts ✅ (API wrapper)
├── prisma/schema.prisma ✅ (Social features ready)
└── package.json ✅ (needs @tidal-music packages)

extension/ 📁 (exists but empty - ready for development)
```

## Package Issues:
- Original `@tidal-music/sdk@1.0.0` doesn't exist
- Need to install: `@tidal-music/auth@1.4.0` and `@tidal-music/api@0.5.0`
- npm install errors encountered (user should handle)

## Development Workflow Established:
- User handles: npm installs, browser testing, environment setup
- Claude handles: Code writing, architecture, debugging complex auth flows
- Partnership works well for full-stack development

## Commands to Resume Development:
```bash
cd apps/web
npm run dev  # Start development server
# Visit http://localhost:3000
# Click "Connect TIDAL (PKCE)" to test auth
```

## Next Session Goals:
1. Start Chrome extension development
2. Implement TIDAL web player monitoring
3. Build WebSocket real-time system
4. Create basic friend system

## Resources:
- TIDAL Developer Portal: developer.tidal.com
- Extension already scoped in /extension folder
- Database models support all planned features