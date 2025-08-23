// Background service worker for Tidal Social Extension
let isConnected = false;
let socket = null;
let reconnectTimeout = null;
const SERVER_URL = 'http://localhost:3000';

// WebSocket connection management
function connectWebSocket() {
  try {
    socket = new WebSocket(`ws://localhost:3000/api/socket`);
    
    socket.onopen = () => {
      console.log('[TidalSocial] WebSocket connected');
      isConnected = true;
      clearTimeout(reconnectTimeout);
      
      // Notify popup if it's open
      chrome.runtime.sendMessage({
        type: 'CONNECTION_STATUS',
        connected: true
      }).catch(() => {}); // Ignore if popup not open
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[TidalSocial] WebSocket message:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'FRIEND_NOW_PLAYING':
            showFriendNotification(data.payload);
            break;
          case 'FRIEND_ONLINE':
            updateFriendStatus(data.payload);
            break;
          default:
            console.log('[TidalSocial] Unknown message type:', data.type);
        }
        
        // Forward to popup if open
        chrome.runtime.sendMessage({
          type: 'WEBSOCKET_MESSAGE',
          data: data
        }).catch(() => {}); // Ignore if popup not open
        
      } catch (error) {
        console.error('[TidalSocial] Failed to parse WebSocket message:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('[TidalSocial] WebSocket disconnected');
      isConnected = false;
      socket = null;
      
      // Notify popup
      chrome.runtime.sendMessage({
        type: 'CONNECTION_STATUS',
        connected: false
      }).catch(() => {});
      
      // Reconnect after delay
      reconnectTimeout = setTimeout(connectWebSocket, 5000);
    };
    
    socket.onerror = (error) => {
      console.error('[TidalSocial] WebSocket error:', error);
    };
    
  } catch (error) {
    console.error('[TidalSocial] Failed to create WebSocket:', error);
    reconnectTimeout = setTimeout(connectWebSocket, 5000);
  }
}

// Show notification for friend activity
function showFriendNotification(data) {
  const { friendName, artist, track } = data;
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Friend Now Playing',
    message: `${friendName} is listening to ${track} by ${artist}`
  });
}

// Update friend online status
function updateFriendStatus(data) {
  // Store friend status in storage
  chrome.storage.local.get(['friendsStatus'], (result) => {
    const friendsStatus = result.friendsStatus || {};
    friendsStatus[data.userId] = {
      online: data.online,
      lastSeen: new Date().toISOString()
    };
    
    chrome.storage.local.set({ friendsStatus });
  });
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[TidalSocial] Background received message:', message);
  
  switch (message.type) {
    case 'SEND_LISTENING_DATA':
      sendListeningData(message.data);
      break;
      
    case 'CONNECT_WEBSOCKET':
      if (!isConnected) {
        connectWebSocket();
      }
      sendResponse({ connected: isConnected });
      break;
      
    case 'GET_CONNECTION_STATUS':
      sendResponse({ connected: isConnected });
      break;
      
    case 'SEND_WEBSOCKET_MESSAGE':
      if (socket && isConnected) {
        socket.send(JSON.stringify(message.data));
      }
      break;
      
    default:
      console.log('[TidalSocial] Unknown message type:', message.type);
  }
  
  return true; // Keep message channel open for async responses
});

// Send listening data to server
async function sendListeningData(trackData) {
  try {
    const response = await fetch(`${SERVER_URL}/api/listening-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        artist: trackData.artist,
        track: trackData.track,
        album: trackData.album,
        playedAtUtc: trackData.timestamp,
        nowPlaying: true,
        source: 'tidal_extension'
      })
    });
    
    if (response.ok) {
      console.log('[TidalSocial] Successfully sent listening data');
      
      // Also send via WebSocket for real-time updates
      if (socket && isConnected) {
        socket.send(JSON.stringify({
          type: 'NOW_PLAYING',
          payload: trackData
        }));
      }
    } else {
      console.error('[TidalSocial] Failed to send listening data:', response.status);
    }
    
  } catch (error) {
    console.error('[TidalSocial] Error sending listening data:', error);
  }
}

// Initialize connection when extension loads
chrome.runtime.onStartup.addListener(() => {
  connectWebSocket();
});

chrome.runtime.onInstalled.addListener(() => {
  connectWebSocket();
});

// Keep service worker alive
setInterval(() => {
  // Ping to prevent service worker from sleeping
  chrome.storage.local.get(['keepAlive'], () => {
    chrome.storage.local.set({ keepAlive: Date.now() });
  });
}, 20000);