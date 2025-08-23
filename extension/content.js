// Tidal Social Content Script
(function () {
  let currentTrack = null;
  let lastSentTrack = null;
  let isInitialized = false;
  let overlayVisible = false;
  
  console.log('[TidalSocial] Content script loaded');
  
  // TIDAL DOM selectors (focused on footer player area)
  const SELECTORS = {
    // Track title selectors - focus on footer player
    title: [
      '#footerPlayer [class*="trackHeader"]',
      '#footerPlayer [class*="title"]',
      '[data-test="footer-track-title"]',
      '.playingTrackTitle'
    ],
    
    // Artist name selectors - focus on footer player area  
    artist: [
      '#footerPlayer [class*="artist"]',
      '#footerPlayer a[class*="link"]',
      '#footerPlayer [class*="subtitle"]',
      '[data-test="footer-track-artist"]',
      '.playingArtistName'
    ],
    
    // Album name selectors
    album: [
      '#footerPlayer [class*="album"]',
      '.playingAlbumName'
    ],
    
    // Play/pause button selectors
    playButton: [
      '#footerPlayer button[class*="playButton"]',
      '[data-test="play"]',
      'button[class*="playButton"]',
      '[class*="footer"] button[aria-label*="Play"]',
      '[class*="footer"] button[aria-label*="Pause"]'
    ]
  };
  
  // Try multiple selectors to find element
  function findElement(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  }
  
  // Helper function to get element's CSS selector path
  function getElementSelector(element) {
    if (!element) return '';
    
    const names = [];
    while (element.parentNode) {
      if (element.id) {
        names.unshift('#' + element.id);
        break;
      } else {
        let c = 1;
        let e = element;
        for (; e.previousElementSibling; e = e.previousElementSibling, c++);
        names.unshift(element.tagName.toLowerCase() + ':nth-child(' + c + ')');
      }
      element = element.parentNode;
    }
    return names.join(' > ');
  }
  
  // Extract current track data from TIDAL DOM
  function extractCurrentTrack() {
    try {
      console.log('[TidalSocial] Trying to extract current track...');
      
      // Clear any previous cached elements and get fresh ones
      const titleElement = findElement(SELECTORS.title);
      const artistElement = findElement(SELECTORS.artist);
      const albumElement = findElement(SELECTORS.album);
      const playButton = findElement(SELECTORS.playButton);
      
      // Get fresh text content
      const titleText = titleElement ? titleElement.textContent?.trim() : null;
      const artistText = artistElement ? artistElement.textContent?.trim() : null;
      const albumText = albumElement ? albumElement.textContent?.trim() : null;
      
      console.log('[TidalSocial] Found elements:', {
        title: titleText || 'NOT FOUND',
        artist: artistText || 'NOT FOUND', 
        album: albumText || 'NOT FOUND',
        playButton: playButton ? 'FOUND' : 'NOT FOUND'
      });
      
      // Debug: Show which exact elements we're using
      if (titleElement) {
        console.log('[TidalSocial] Title element:', {
          tagName: titleElement.tagName,
          className: titleElement.className,
          selector: getElementSelector(titleElement),
          text: titleElement.textContent?.trim()
        });
      }
      
      if (artistElement) {
        console.log('[TidalSocial] Artist element:', {
          tagName: artistElement.tagName,
          className: artistElement.className,
          selector: getElementSelector(artistElement),
          text: artistElement.textContent?.trim()
        });
      }
      
      // Check if music is playing - TIDAL shows "Play" button when music is actually playing
      // We need to look for other indicators of playing state
      let isPlaying = false;
      
      if (playButton) {
        // Method 1: Check if button has playing/active state classes
        const hasPlayingClass = playButton.classList.toString().includes('active') || 
                                playButton.classList.toString().includes('playing');
        
        // Method 2: Look for pause icon inside the button
        const hasPauseIcon = playButton.querySelector('svg path[d*="M6"]') || // Common pause icon path
                            playButton.querySelector('[class*="pause"]') ||
                            playButton.innerHTML.includes('pause');
        
        // Method 3: Check parent container for playing state
        const playerContainer = playButton.closest('[class*="player"]') || 
                               playButton.closest('[class*="footer"]');
        const containerHasPlayingState = playerContainer && (
          playerContainer.querySelector('[class*="playing"]') ||
          playerContainer.classList.toString().includes('playing')
        );
        
        // Method 4: If we have track title and artist, assume it's playing if the button exists
        const hasTrackInfo = titleText && artistText;
        
        isPlaying = hasPlayingClass || hasPauseIcon || containerHasPlayingState || hasTrackInfo;
        
        console.log('[TidalSocial] Playing detection details:', {
          hasPlayingClass,
          hasPauseIcon,
          containerHasPlayingState,
          hasTrackInfo,
          finalDecision: isPlaying
        });
      }
      
      console.log('[TidalSocial] Is playing?', isPlaying);
      if (playButton) {
        console.log('[TidalSocial] Play button aria-label:', playButton.getAttribute('aria-label'));
        console.log('[TidalSocial] Play button classes:', playButton.className);
      }
      
      if (!titleText || !artistText) {
        console.log('[TidalSocial] Missing title or artist text');
        return null;
      }
      
      if (!isPlaying) {
        console.log('[TidalSocial] Music not playing');
        return null;
      }
      
      const trackData = {
        artist: artistText,
        track: titleText,
        album: albumText,
        timestamp: new Date().toISOString(),
        isPlaying: true
      };
      
      console.log('[TidalSocial] Extracted track data:', trackData);
      return trackData;
      
    } catch (error) {
      console.log('[TidalSocial] Error extracting track:', error);
      return null;
    }
  }
  
  // Check if track data has changed
  function trackChanged(newTrack, oldTrack) {
    if (!newTrack && !oldTrack) return false;
    if (!newTrack || !oldTrack) return true;
    
    return (
      newTrack.artist !== oldTrack.artist ||
      newTrack.track !== oldTrack.track ||
      newTrack.album !== oldTrack.album
    );
  }
  
  // Send track data to background script
  function sendTrackData(trackData) {
    chrome.runtime.sendMessage({
      type: 'SEND_LISTENING_DATA',
      data: trackData
    }).catch(error => {
      console.log('[TidalSocial] Failed to send track data:', error);
    });
  }
  
  // Debug function to explore DOM
  function debugDOM() {
    console.log('[TidalSocial] === DOM DEBUG ===');
    
    // Look for any elements that might contain track info
    const potentialTitleElements = [
      ...document.querySelectorAll('*[class*="title"]'),
      ...document.querySelectorAll('*[class*="track"]'),
      ...document.querySelectorAll('*[class*="song"]'),
      ...document.querySelectorAll('*[class*="playing"]'),
      ...document.querySelectorAll('*[data-test*="title"]'),
      ...document.querySelectorAll('*[data-test*="track"]')
    ];
    
    console.log('[TidalSocial] Potential title elements found:', potentialTitleElements.length);
    potentialTitleElements.slice(0, 10).forEach((el, i) => {
      console.log(`[TidalSocial] Title candidate ${i}:`, {
        element: el.tagName,
        classes: el.className,
        text: el.textContent?.trim()?.slice(0, 50),
        dataTest: el.getAttribute('data-test')
      });
    });
    
    // Look for play buttons
    const potentialPlayButtons = [
      ...document.querySelectorAll('button'),
      ...document.querySelectorAll('*[role="button"]')
    ].filter(el => {
      const text = el.textContent?.toLowerCase() || '';
      const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
      return text.includes('play') || text.includes('pause') || 
             ariaLabel.includes('play') || ariaLabel.includes('pause');
    });
    
    console.log('[TidalSocial] Potential play buttons found:', potentialPlayButtons.length);
    potentialPlayButtons.slice(0, 5).forEach((el, i) => {
      console.log(`[TidalSocial] Play button candidate ${i}:`, {
        element: el.tagName,
        classes: el.className,
        text: el.textContent?.trim(),
        ariaLabel: el.getAttribute('aria-label')
      });
    });
    
    // Look at footer/player area specifically
    const footer = document.querySelector('footer');
    const playerAreas = [
      ...document.querySelectorAll('*[class*="player"]'),
      ...document.querySelectorAll('*[class*="footer"]'),
      ...document.querySelectorAll('*[class*="controls"]')
    ];
    
    console.log('[TidalSocial] Footer element:', footer ? 'FOUND' : 'NOT FOUND');
    console.log('[TidalSocial] Player areas found:', playerAreas.length);
    
    if (footer) {
      console.log('[TidalSocial] Footer HTML:', footer.innerHTML.slice(0, 500));
    }
  }

  // Monitor current track
  function monitorCurrentTrack() {
    const track = extractCurrentTrack();
    
    // Run DOM debug more frequently to help troubleshoot
    if (!track) {
      // Run debug every 3rd call (every 9 seconds) when no track found
      if (Math.random() < 0.33) {
        debugDOM();
      }
    }
    
    if (track && trackChanged(track, lastSentTrack)) {
      console.log('[TidalSocial] New track detected:', track.artist, '-', track.track);
      currentTrack = track;
      lastSentTrack = track;
      sendTrackData(track);
      updateOverlayNowPlaying(track);
      
    } else if (!track && currentTrack) {
      // Music stopped
      console.log('[TidalSocial] Music stopped');
      currentTrack = null;
      updateOverlayNowPlaying(null);
    }
  }
  
  // Create floating overlay widget
  function createOverlay() {
    if (document.getElementById('tidal-social-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'tidal-social-overlay';
    overlay.className = 'tidal-social-overlay';
    
    overlay.innerHTML = `
      <div class="ts-header">
        <div class="ts-status-dot"></div>
        <span class="ts-title">Tidal Social</span>
        <button class="ts-debug" title="Debug DOM">🔍</button>
        <button class="ts-toggle" title="Toggle friends feed">👥</button>
        <button class="ts-close" title="Close">×</button>
      </div>
      
      <div class="ts-now-playing">
        <div class="ts-track-info">
          <span class="ts-track">Waiting for music...</span>
          <span class="ts-artist"></span>
        </div>
      </div>
      
      <div class="ts-friends-panel" style="display: none;">
        <div class="ts-friends-header">
          <span>Friends Activity</span>
          <button class="ts-refresh" title="Refresh">⟳</button>
        </div>
        <div class="ts-friends-list">
          <div class="ts-loading">Loading friends...</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Event listeners
    overlay.querySelector('.ts-close').addEventListener('click', () => {
      overlay.remove();
      overlayVisible = false;
    });
    
    overlay.querySelector('.ts-toggle').addEventListener('click', () => {
      const panel = overlay.querySelector('.ts-friends-panel');
      const isVisible = panel.style.display !== 'none';
      panel.style.display = isVisible ? 'none' : 'block';
      
      if (!isVisible) {
        loadFriendsActivity();
      }
    });
    
    overlay.querySelector('.ts-refresh').addEventListener('click', () => {
      loadFriendsActivity();
    });
    
    const debugButton = overlay.querySelector('.ts-debug');
    if (debugButton) {
      debugButton.addEventListener('click', () => {
        console.log('[TidalSocial] Manual debug triggered');
        debugDOM();
        extractCurrentTrack(); // This will show the detailed logs
      });
    }
    
    overlayVisible = true;
    console.log('[TidalSocial] Overlay created');
  }
  
  // Update now playing display
  function updateOverlayNowPlaying(track) {
    const overlay = document.getElementById('tidal-social-overlay');
    if (!overlay) return;
    
    const trackElement = overlay.querySelector('.ts-track');
    const artistElement = overlay.querySelector('.ts-artist');
    const statusDot = overlay.querySelector('.ts-status-dot');
    
    if (track) {
      trackElement.textContent = track.track;
      artistElement.textContent = `by ${track.artist}`;
      statusDot.className = 'ts-status-dot ts-playing';
    } else {
      trackElement.textContent = 'Not playing';
      artistElement.textContent = '';
      statusDot.className = 'ts-status-dot ts-idle';
    }
  }
  
  // Load friends activity
  async function loadFriendsActivity() {
    const friendsList = document.querySelector('.ts-friends-list');
    if (!friendsList) return;
    
    friendsList.innerHTML = '<div class="ts-loading">Loading...</div>';
    
    try {
      const response = await fetch('http://localhost:3000/api/feed', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        displayFriendsActivity(data.items || []);
      } else {
        friendsList.innerHTML = '<div class="ts-error">Failed to load friends</div>';
      }
    } catch (error) {
      console.log('[TidalSocial] Failed to load friends activity:', error);
      friendsList.innerHTML = '<div class="ts-error">Connection failed</div>';
    }
  }
  
  // Display friends activity
  function displayFriendsActivity(activities) {
    const friendsList = document.querySelector('.ts-friends-list');
    if (!friendsList) return;
    
    if (activities.length === 0) {
      friendsList.innerHTML = '<div class="ts-empty">No recent activity</div>';
      return;
    }
    
    const html = activities.slice(0, 10).map(activity => `
      <div class="ts-activity-item">
        <div class="ts-activity-track">${activity.track}</div>
        <div class="ts-activity-artist">${activity.artist}</div>
        <div class="ts-activity-time">${formatTime(activity.playedAtUtc)}</div>
      </div>
    `).join('');
    
    friendsList.innerHTML = html;
  }
  
  // Format time ago
  function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
  
  // Initialize when page is ready
  function initialize() {
    if (isInitialized) return;
    
    console.log('[TidalSocial] Initializing content script');
    
    // Wait for TIDAL to load
    setTimeout(() => {
      createOverlay();
      
      // Start monitoring
      monitorCurrentTrack();
      setInterval(monitorCurrentTrack, 3000);
      
      isInitialized = true;
      console.log('[TidalSocial] Content script initialized');
    }, 2000);
  }
  
  // Start when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // Handle messages from background script and popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'WEBSOCKET_MESSAGE':
        handleWebSocketMessage(message.data);
        break;
        
      case 'CONNECTION_STATUS':
        updateConnectionStatus(message.connected);
        break;
        
      case 'GET_AUTH_STATUS':
        // Check if we can successfully make API calls (indicates auth is working)
        fetch('http://localhost:3000/api/feed', { credentials: 'include' })
          .then(response => {
            if (response.ok) {
              sendResponse({ 
                authenticated: true,
                user: { name: 'Azhan Zaheer' } // You could get this from API
              });
            } else {
              sendResponse({ authenticated: false });
            }
          })
          .catch(() => {
            sendResponse({ authenticated: false });
          });
        return true; // Keep message channel open for async response
        
      case 'TOGGLE_OVERLAY':
        const overlay = document.getElementById('tidal-social-overlay');
        if (overlay) {
          overlay.style.display = message.enabled ? 'block' : 'none';
        }
        break;
    }
  });
  
  // Handle WebSocket messages
  function handleWebSocketMessage(data) {
    console.log('[TidalSocial] WebSocket message received:', data);
    
    switch (data.type) {
      case 'FRIEND_NOW_PLAYING':
        // Could show a toast notification or update friends list
        break;
        
      case 'FRIENDS_ACTIVITY_UPDATE':
        if (document.querySelector('.ts-friends-panel').style.display !== 'none') {
          loadFriendsActivity();
        }
        break;
    }
  }
  
  // Update connection status
  function updateConnectionStatus(connected) {
    const statusDot = document.querySelector('.ts-status-dot');
    if (statusDot) {
      if (connected) {
        statusDot.classList.add('ts-connected');
      } else {
        statusDot.classList.remove('ts-connected');
      }
    }
  }
})();
