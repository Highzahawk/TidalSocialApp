# Tidal Social Extension

A Chrome extension that integrates with the Tidal Companion app to provide real-time friend activity, playlist management, and social features.

## ✨ Features

- **Real-time Friend Activity**: See what your friends are listening to on Tidal
- **Playlist Management**: View and manage your collaborative playlists
- **Friend Management**: Search and add new friends to your network
- **Responsive Design**: Adapts to different screen sizes and viewports
- **Dark Theme**: Beautiful dark UI that matches Tidal's aesthetic

## 🚀 Setup Instructions

### 1. Start the Backend Server

First, make sure your Tidal Companion backend is running:

```bash
cd apps/web
npm run dev
# or
pnpm dev
```

The server should be running on `http://localhost:3000`

### 2. Install the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select the `extension/` folder
4. The extension should now appear in your extensions list

### 3. Authentication

1. Go to `http://localhost:3000/login` in a new tab
2. Log in with your Tidal credentials (or use the dev login)
3. Keep this tab open - the extension needs the session

### 4. Use the Extension

1. Go to `https://tidal.com` (or any Tidal page)
2. Click the extension icon in your Chrome toolbar
3. The COMPANION panel will slide in from the right
4. Navigate between tabs to see different features

## 🔧 API Endpoints

The extension connects to these backend endpoints:

- `GET /api/extension/auth` - Check authentication status
- `GET /api/extension/friends-activity` - Get friends' listening activity
- `GET /api/extension/playlists` - Get user playlists
- `GET /api/extension/search-users?query=...` - Search for users

## 🎯 How It Works

1. **Authentication Check**: Extension checks if user is logged in via `/api/extension/auth`
2. **Data Loading**: Fetches real data from Tidal APIs through your backend
3. **Real-time Updates**: UI updates with actual friend activity and playlist data
4. **Responsive Layout**: Panel width adapts to viewport, shifts main page content

## 🎨 UI Components

- **Header**: Tidal logo + COMPANION title + navigation tabs
- **Friends Tab**: Shows what friends are currently listening to
- **Playlists Tab**: Displays collaborative playlists
- **Friends List Tab**: Manage friends and search for new ones
- **User Bar**: Bottom section with user info and menu

## 🔄 Data Flow

```
Extension → Backend API → Tidal API → Database → Extension UI
```

## 🐛 Troubleshooting

### Extension not loading data?
- Make sure backend is running on `localhost:3000`
- Check if you're logged in at `localhost:3000/login`
- Check browser console for API errors

### Authentication issues?
- Clear browser cookies for `localhost:3000`
- Re-login at the backend
- Check if session is valid

### Extension not appearing?
- Make sure you're on a Tidal domain (`tidal.com`)
- Check if extension is enabled in `chrome://extensions/`
- Try refreshing the extension

## 🚧 Development Notes

- **Mock Data**: Some features use mock data for demo purposes
- **Real Integration**: Replace mock endpoints with actual Tidal API calls
- **Friend System**: Currently simulated - implement real friend connections
- **Real-time**: Add WebSocket support for live updates

## 🔮 Future Enhancements

- Real-time friend activity updates
- Push notifications for friend requests
- Collaborative playlist editing
- Music sharing and recommendations
- Integration with Tidal's social features

## 📱 Browser Support

- Chrome 88+ (Manifest V3)
- Edge 88+ (Chromium-based)
- Other Chromium browsers

## 📄 License

This extension is part of the Tidal Social App project. 