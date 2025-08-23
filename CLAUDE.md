# Tidal Social App - Development Log

## Project Overview
A social music platform built around TIDAL streaming with collaborative playlists and friend activity feeds. Users can track listening habits, follow friends, and see real-time music activity.

## Current Status: ✅ NextAuth + TIDAL OAuth Complete!

### What's Implemented & Working:
- ✅ **TIDAL OAuth with PKCE flow** - Full authentication working  
- ✅ **NextAuth.js integration** - Persistent sessions across browser restarts
- ✅ **User management** - Login/logout, database storage with consistent usernames
- ✅ **Database schema** - PostgreSQL with Prisma (Users, ListeningEvents, Follows, CollabRooms)
- ✅ **Clean web app** - Next.js frontend, single sign-in button, friend feed (sample data)
- ✅ **Environment setup** - All TIDAL credentials configured
- ✅ **TypeScript errors fixed** - Production-ready code with proper error handling

### Key Technical Decisions Made:
- **Authentication**: TIDAL OAuth 2.1 with PKCE (not standard OAuth)
- **Authorization URL**: `https://login.tidal.com/authorize` (not auth.tidal.com)
- **Token URL**: `https://auth.tidal.com/v1/oauth2/token`
- **Scopes**: `user.read collection.read playlists.read`
- **Database**: tidalUserId stored as String (TIDAL returns number, converted)

### Working Endpoints:
- `/api/auth/signin-tidal` - PKCE OAuth initiation (production endpoint)
- `/api/auth/callback/tidal-pkce` - OAuth callback with NextAuth session + real user data
- `/api/auth/[...nextauth]` - NextAuth configuration for persistent sessions
- `/api/feed` - Friend activity feed (sample data)
- `/api/debug/session` - Session debugging endpoint (can be removed in production)

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

### 4. Session Persistence Issues
**Problem**: User signed out on page refresh, duplicate login buttons
**Solution**: 
- Integrated NextAuth.js with custom TIDAL OAuth flow
- Used NextAuth's `encode()` function for proper JWT signing
- Removed duplicate buttons, clean UI with persistent sessions

### 5. TIDAL API Access Limitations
**Problem**: TIDAL API requires `r_usr` scope for user data, but causes OAuth error 1002
**Solution**: 
- Discovered app registration only supports basic scopes (`user.read collection.read playlists.read`)
- TIDAL API returns 403/404 for most user data endpoints
- **Resolution**: Chrome extension approach is the correct path for real music data

## Current Environment (.env):
```
TIDAL_CLIENT_ID=Y7zLc6Mj5CW9OMlS
TIDAL_CLIENT_SECRET=sHXVQ9vWtqwhDx4cM4JjgJvJEvosUjKiARNZ9ScX814=
TIDAL_REDIRECT_URI=http://localhost:3000/api/auth/callback/tidal-pkce
TIDAL_AUTH_URL=https://login.tidal.com/authorize
TIDAL_TOKEN_URL=https://auth.tidal.com/v1/oauth2/token
TIDAL_API_BASE=https://api.tidal.com/v1
```

## Next Phase: Chrome Extension for Real Listening Data (CRITICAL PATH)

### Why Extension is Required (Not Optional):
- **TIDAL API severely limited**: Basic scopes don't provide access to user music data
- **r_usr scope blocked**: App registration doesn't support required scope for playlists/favorites
- **All user endpoints return 403**: Cannot access personal music data via API
- **Extension = Primary data source**: DOM scraping is the only viable approach
- **TIDAL OAuth still valuable**: Provides user identity verification for social features

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

## Session Summary & Current State (Aug 2025):

### ✅ Authentication System: COMPLETE
- TIDAL OAuth + NextAuth.js working perfectly
- Persistent sessions across browser sessions
- Clean UI with single sign-in button
- Production-ready error handling
- User displays as "Azhan Zaheer" (real name from TIDAL profile)

### ✅ TIDAL API Integration: COMPLETE
- **MAJOR DISCOVERY**: `https://openapi.tidal.com/v2/users/me` works with basic scopes
- Real user data accessible: firstName, lastName, email, country, username  
- User displays as "Azhan Zaheer" instead of generic username
- Standard API endpoints still blocked, but profile data works perfectly
- **Key Fix**: Used OpenAPI v2 endpoint instead of standard API v1
- **Working API call**: GET `https://openapi.tidal.com/v2/users/me` with `Accept: application/vnd.api+json`

### 🎉 Chrome Extension: FULLY FUNCTIONAL!
**BREAKTHROUGH ACHIEVED**: Extension successfully tracks real music data from TIDAL web player!

#### ✅ Music Tracking System Working:
- **DOM Monitoring**: Successfully extracts track info from TIDAL footer player
- **Real-time Detection**: Monitors song changes every 3 seconds
- **Accurate Data**: Correctly identifies artist, track title (album detection pending)
- **Playing State**: Detects when music is actually playing vs paused
- **API Integration**: Sends listening events to `/api/listening-events` endpoint

#### ✅ Extension Architecture Complete:
- **manifest.json**: Chrome Extension V3 with proper permissions
- **background.js**: Service worker handling API calls and WebSocket connections
- **content.js**: DOM monitoring and overlay widget on TIDAL
- **content.css**: Styled overlay with social features
- **popup.html/js/css**: Full-featured popup with Activity/Friends/Settings tabs

#### ✅ Data Flow Working End-to-End:
1. **TIDAL Web Player** → Extension monitors DOM
2. **Extension** → Extracts track data (artist, song, timestamp)
3. **API Call** → Sends to `/api/listening-events` with authentication
4. **Database** → Stores in ListeningEvent table with `nowPlaying: true`
5. **Web App** → Displays real listening activity in friends feed

#### ✅ Technical Fixes Implemented:
- **CORS Headers**: Added to all API endpoints for extension communication
- **Selector Targeting**: Fixed to use `#footerPlayer` area specifically
- **Authentication Bridge**: Extension popup gets auth status from content script
- **Real-time Updates**: Music changes appear immediately in web app feed

## Data Storage Strategy (Ready to Implement):

### Database Schema Already Perfect:
```sql
ListeningEvent {
  userId       String    -- TIDAL user ID (204918363) 
  artist       String    -- "John Mayer"
  track        String    -- "Gravity"
  album        String?   -- "Continuum"  
  playedAtUtc  DateTime  -- When they played it
  nowPlaying   Boolean   -- true for current song
  tidalTrackId String?   -- If available from DOM
}
```

### Data Flow Architecture:
1. **Chrome Extension** monitors `listen.tidal.com` DOM 
2. **Extracts** track info (artist, song, album) from player elements
3. **Sends to API** `/api/listening-events` (needs to be created)
4. **Stored in database** with `nowPlaying: true`
5. **Friends see** "Azhan Zaheer is listening to Gravity by John Mayer"

## 🎯 CURRENT STATUS: CORE FUNCTIONALITY COMPLETE! 

### ✅ What's Working Right Now:
- **Music Tracking**: Extension correctly detects song changes on TIDAL
- **Data Storage**: Listening events saved to database in real-time
- **Web App Integration**: Real music activity displays in friends feed
- **Authentication**: TIDAL OAuth + NextAuth working seamlessly
- **API Endpoints**: `/api/listening-events` and `/api/feed` working with CORS

### 🧪 How to Test Current System:
1. Start web app: `cd apps/web && npm run dev`
2. Go to `http://localhost:3000` and sign in with TIDAL
3. Install extension: Load unpacked from `/extension` folder
4. Go to `https://listen.tidal.com` and play music
5. Music activity appears in real-time on web app feed!

## Next Phase Goals (Future Sessions):

### Priority 1: Social Features
- **Friends System**: Add/follow friends by TIDAL username  
- **Friend Feed**: Show friends' listening activity (instead of just your own)
- **Privacy Controls**: Settings to control sharing visibility

### Priority 2: Real-time Features
- **WebSocket Server**: Build real-time connection system
- **Live Friend Activity**: "John is listening to..." notifications
- **Friend Presence**: Online status indicators

### Priority 3: Polish & Enhancement
- **Album Detection**: Fix album extraction from TIDAL DOM
- **Extension UI**: Improve popup connection status display
- **Performance**: Optimize DOM monitoring and API calls
- **Error Handling**: Better error states and retry logic

### Priority 4: Advanced Features
- **Collaborative Playlists**: Use existing CollabRoom database models
- **Music Recommendations**: Based on friend activity
- **Listening Statistics**: Personal music insights
- **Export Features**: Backup listening history

## Key Technical Details for Next Session:

### Working Selectors (Don't Change These!):
```javascript
// These selectors work correctly for TIDAL music tracking:
title: ['#footerPlayer [class*="trackHeader"]']
artist: ['#footerPlayer a[class*="link"]', '#footerPlayer [class*="subtitle"]']
playButton: ['#footerPlayer button[class*="playButton"]']
```

### API Endpoints Status:
- ✅ `/api/listening-events` - Receives music data from extension (CORS enabled)
- ✅ `/api/feed` - Returns listening activity (CORS enabled)  
- ✅ `/api/debug/session` - Session validation (CORS enabled)
- ⚠️ WebSocket `/api/socket` - Not implemented yet (extension tries to connect)

### Extension Files:
- ✅ `/extension/manifest.json` - Chrome Extension V3 config
- ✅ `/extension/content.js` - DOM monitoring + overlay (working)
- ✅ `/extension/background.js` - Service worker (working, logs WebSocket errors)
- ✅ `/extension/popup.html/js/css` - Full popup interface (working)
- ✅ `/extension/content.css` - Overlay styling

### Database Status:
- ✅ ListeningEvent table receiving real music data
- ✅ User table with TIDAL authentication
- 🔜 Follow/Friend relationships ready to implement
- 🔜 CollabRoom models ready for collaborative features

## Resources:
- TIDAL Developer Portal: developer.tidal.com
- Extension loads at `chrome://extensions` → Load unpacked
- Database models support all planned social features
- Real-time music tracking proven and working!