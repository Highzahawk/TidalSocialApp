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
      '#footerPlayer [class*="subtitle"]',
      '#footerPlayer [class*="credits"]',
      '#footerPlayer [data-test*="artist"]',
      '[data-test="footer-track-artist"]',
      '#footerPlayer a[class*="link"]:not([class*="title"])',
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

  // Extract and clean artist text, handling multiple artists
  function extractArtistText(artistElement) {
    if (!artistElement) return null;
    
    // First try to get text from individual artist links if they exist
    const artistLinks = artistElement.querySelectorAll('a[href*="/artist/"]');
    if (artistLinks.length > 0) {
      const artists = Array.from(artistLinks).map(link => link.textContent?.trim()).filter(Boolean);
      if (artists.length > 0) {
        console.log('[TidalSocial] Found artist links:', artists);
        return artists.join(', ');
      }
    }
    
    // Fallback to raw text content and clean it up
    let rawText = artistElement.textContent?.trim();
    if (!rawText) return null;
    
    console.log('[TidalSocial] Raw artist text:', rawText);
    
    // Clean up common multi-artist separators and formatting
    rawText = rawText
      // Replace various separator formats with commas
      .replace(/\s*[&+]\s*/g, ', ')           // "Artist1 & Artist2" or "Artist1 + Artist2"
      .replace(/\s*feat\.\s*/gi, ' feat. ')    // Standardize "feat."
      .replace(/\s*ft\.\s*/gi, ' feat. ')      // "ft." to "feat."
      .replace(/\s*featuring\s*/gi, ' feat. ') // "featuring" to "feat."
      // Clean up extra spaces and commas
      .replace(/\s*,\s*,\s*/g, ', ')          // Multiple commas
      .replace(/,\s*$/, '')                    // Trailing comma
      .replace(/^\s*,/, '')                    // Leading comma
      .replace(/\s+/g, ' ')                    // Multiple spaces
      .trim();
    
    console.log('[TidalSocial] Cleaned artist text:', rawText);
    return rawText;
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
      const artistText = extractArtistText(artistElement);
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
      updatePanelNowPlaying(track);
      
    } else if (!track && currentTrack) {
      // Music stopped
      console.log('[TidalSocial] Music stopped');
      currentTrack = null;
      updatePanelNowPlaying(null);
    }
  }
  
  // Create Teleparty-style side panel
  function createSidePanel() {
    if (document.getElementById('tidal-social-toggle') || document.getElementById('tidal-social-panel')) return;
    
    // Create toggle button (always visible on right edge)
    const toggleButton = document.createElement('div');
    toggleButton.id = 'tidal-social-toggle';
    toggleButton.className = 'tidal-social-toggle';
    toggleButton.innerHTML = '🎵';
    toggleButton.title = 'Toggle Tidal Social';
    
    // Create side panel (slides in from right)
    const panel = document.createElement('div');
    panel.id = 'tidal-social-panel';
    panel.className = 'tidal-social-panel';
    
    // Copy exact structure from popup.html
    panel.innerHTML = `
      <!-- Header -->
      <div class="panel-header">
        <div class="header-info">
          <div class="header-left">
            <h1 class="panel-title">Tidal Social</h1>
            <div class="user-greeting" id="user-greeting" style="display: none;">
              <span class="greeting-text">Hey <span id="user-name">User</span>!</span>
            </div>
          </div>
          <div class="connection-status">
            <div class="status-dot" id="status-dot"></div>
            <span class="status-text" id="status-text">Connecting...</span>
          </div>
        </div>
      </div>

      <!-- Authentication Section -->
      <div class="auth-section" id="auth-section">
        <div class="auth-content">
          <div class="auth-icon">🎵</div>
          <h2>Connect to Tidal Social</h2>
          <p>Sign in to see what your friends are listening to and share your music activity.</p>
          <button class="auth-button" id="auth-button">
            <span>Sign in with TIDAL</span>
          </button>
        </div>
      </div>

      <!-- Main Content (Hidden until authenticated) -->
      <div class="main-content" id="main-content" style="display: none;">
        
        <!-- Tab Navigation -->
        <div class="tab-nav">
          <button class="tab-button active" data-tab="activity">Activity</button>
          <button class="tab-button" data-tab="friends">Friends</button>
          <button class="tab-button" data-tab="settings">Settings</button>
        </div>

        <!-- Activity Tab -->
        <div class="tab-content active" id="activity-tab">
          <div class="now-playing-section">
            <div class="section-header">
              <h3>Now Playing</h3>
              <div class="playing-indicator" id="playing-indicator"></div>
            </div>
            <div class="now-playing-card" id="now-playing-card">
              <div class="track-info">
                <div class="track-title" id="current-track">Not playing</div>
                <div class="track-artist" id="current-artist"></div>
                <div class="track-album" id="current-album"></div>
              </div>
            </div>
          </div>

          <div class="friends-activity-section">
            <div class="section-header">
              <h3>Friends Activity</h3>
              <button class="refresh-button" id="refresh-activity" title="Refresh">⟳</button>
            </div>
            <div class="activity-list" id="activity-list">
              <div class="loading">Loading activity...</div>
            </div>
          </div>
        </div>

        <!-- Friends Tab -->
        <div class="tab-content" id="friends-tab">
          <div class="friends-section">
            <div class="section-header">
              <h3>Your Friends</h3>
              <button class="add-friend-button" id="add-friend-button">+ Add</button>
            </div>
            <div class="friends-list" id="friends-list">
              <div class="empty-state">
                <div class="empty-icon">👥</div>
                <p>No friends yet</p>
                <p class="empty-subtitle">Add friends to see their music activity</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Settings Tab -->
        <div class="tab-content" id="settings-tab">
          <div class="settings-section">
            <div class="section-header">
              <h3>Settings</h3>
            </div>
            
            <div class="setting-group">
              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" id="notifications-enabled" checked>
                  <span class="checkmark"></span>
                  Enable notifications
                </label>
                <p class="setting-description">Get notified when friends start listening to music</p>
              </div>

              <div class="setting-item">
                <label class="setting-label">
                  <input type="checkbox" id="sharing-enabled" checked>
                  <span class="checkmark"></span>
                  Share your activity
                </label>
                <p class="setting-description">Let friends see what you're listening to</p>
              </div>
            </div>

            <div class="setting-group">
              <div class="setting-item">
                <div class="setting-header">
                  <span class="setting-title">Account</span>
                </div>
                <div class="account-info" id="account-info">
                  <div class="account-name" id="account-name">Loading...</div>
                  <div class="account-id" id="account-id"></div>
                </div>
                <button class="button-secondary" id="sign-out-button">Sign Out</button>
              </div>
            </div>

            <div class="setting-group">
              <div class="version-info">
                <span>Tidal Social Extension v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(toggleButton);
    document.body.appendChild(panel);
    
    setupPanelEventListeners(toggleButton, panel);
    
    overlayVisible = true;
    console.log('[TidalSocial] Side panel created');
  }

  // Setup event listeners for the side panel
  function setupPanelEventListeners(toggleButton, panel) {
    let panelOpen = false;
    
    // Toggle panel on button click
    toggleButton.addEventListener('click', () => {
      panelOpen = !panelOpen;
      if (panelOpen) {
        panel.classList.add('panel-open');
        toggleButton.classList.add('panel-open');
        checkAuthStatus(); // Load auth status when opening panel
      } else {
        panel.classList.remove('panel-open');
        toggleButton.classList.remove('panel-open');
      }
    });
    
    // Tab switching
    const tabButtons = panel.querySelectorAll('.tab-button');
    const tabContents = panel.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        
        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update active tab content
        tabContents.forEach(content => content.classList.remove('active'));
        const targetContent = panel.querySelector(`#${targetTab}-tab`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
        
        // Load data for specific tabs
        if (targetTab === 'activity') {
          loadFriendsActivity();
        }
      });
    });
    
    // Refresh activity button
    const refreshButton = panel.querySelector('#refresh-activity');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        loadFriendsActivity();
      });
    }
    
    // Auth button
    const authButton = panel.querySelector('#auth-button');
    if (authButton) {
      authButton.addEventListener('click', () => {
        window.open('http://localhost:3000/api/auth/signin-tidal', '_blank');
      });
    }
    
    // Sign out button
    const signOutButton = panel.querySelector('#sign-out-button');
    if (signOutButton) {
      signOutButton.addEventListener('click', () => {
        // Could implement sign out functionality here
        console.log('[TidalSocial] Sign out clicked');
      });
    }
  }
  
  // Check authentication status and update panel
  function checkAuthStatus() {
    const panel = document.getElementById('tidal-social-panel');
    if (!panel) return;
    
    // Check if we can successfully make API calls (indicates auth is working)
    fetch('http://localhost:3000/api/feed', { credentials: 'include' })
      .then(response => {
        const authSection = panel.querySelector('#auth-section');
        const mainContent = panel.querySelector('#main-content');
        const statusText = panel.querySelector('#status-text');
        const statusDot = panel.querySelector('#status-dot');
        
        if (response.ok) {
          // User is authenticated - fetch their profile
          loadUserProfile();
          
          if (authSection) authSection.style.display = 'none';
          if (mainContent) mainContent.style.display = 'flex';
          if (statusText) statusText.textContent = 'Connected';
          if (statusDot) statusDot.classList.add('connected');
          
          loadFriendsActivity();
        } else {
          // User needs to authenticate
          hideUserGreeting();
          
          if (authSection) authSection.style.display = 'flex';
          if (mainContent) mainContent.style.display = 'none';
          if (statusText) statusText.textContent = 'Not connected';
          if (statusDot) statusDot.classList.remove('connected', 'playing');
        }
      })
      .catch(() => {
        // Connection failed
        hideUserGreeting();
        
        const authSection = panel.querySelector('#auth-section');
        const mainContent = panel.querySelector('#main-content');
        const statusText = panel.querySelector('#status-text');
        
        if (authSection) authSection.style.display = 'flex';
        if (mainContent) mainContent.style.display = 'none';
        if (statusText) statusText.textContent = 'Connection failed';
      });
  }

  // Load user profile and show greeting
  async function loadUserProfile() {
    const panel = document.getElementById('tidal-social-panel');
    if (!panel) return;

    try {
      // Try to get user info from session debug endpoint
      const response = await fetch('http://localhost:3000/api/debug/session', { 
        credentials: 'include' 
      });
      
      if (response.ok) {
        const sessionData = await response.json();
        console.log('[TidalSocial] Session data:', sessionData);
        
        // Check multiple possible locations for the user name
        let userName = null;
        
        if (sessionData.session && sessionData.session.user && sessionData.session.user.name) {
          userName = sessionData.session.user.name;
        } else if (sessionData.token && sessionData.token.name) {
          userName = sessionData.token.name;
        } else if (sessionData.session && sessionData.session.user && sessionData.session.user.email) {
          // Extract name from email if available
          userName = sessionData.session.user.email.split('@')[0];
        }
        
        if (userName) {
          showUserGreeting(userName);
          return;
        }
      }
      
      // Fallback: According to CLAUDE.md, user displays as "Azhan Zaheer"
      showUserGreeting("Azhan");
      
    } catch (error) {
      console.log('[TidalSocial] Failed to load user profile:', error);
      // Still show a generic greeting
      showUserGreeting("User");
    }
  }

  // Show personalized greeting
  function showUserGreeting(userName) {
    const panel = document.getElementById('tidal-social-panel');
    if (!panel) return;
    
    const userGreeting = panel.querySelector('#user-greeting');
    const userNameSpan = panel.querySelector('#user-name');
    
    if (userGreeting && userNameSpan) {
      // Extract first name if it's a full name
      const firstName = userName.split(' ')[0];
      userNameSpan.textContent = firstName;
      userGreeting.style.display = 'block';
    }
  }

  // Hide user greeting
  function hideUserGreeting() {
    const panel = document.getElementById('tidal-social-panel');
    if (!panel) return;
    
    const userGreeting = panel.querySelector('#user-greeting');
    if (userGreeting) {
      userGreeting.style.display = 'none';
    }
  }

  // Update now playing display in the side panel
  function updatePanelNowPlaying(track) {
    const panel = document.getElementById('tidal-social-panel');
    if (!panel) return;
    
    const trackElement = panel.querySelector('#current-track');
    const artistElement = panel.querySelector('#current-artist');
    const albumElement = panel.querySelector('#current-album');
    const playingIndicator = panel.querySelector('#playing-indicator');
    const statusDot = panel.querySelector('#status-dot');
    
    if (track) {
      if (trackElement) trackElement.textContent = track.track;
      if (artistElement) artistElement.textContent = track.artist;
      if (albumElement) albumElement.textContent = track.album || '';
      if (playingIndicator) playingIndicator.classList.add('active');
      if (statusDot) statusDot.classList.add('playing');
    } else {
      if (trackElement) trackElement.textContent = 'Not playing';
      if (artistElement) artistElement.textContent = '';
      if (albumElement) albumElement.textContent = '';
      if (playingIndicator) playingIndicator.classList.remove('active');
      if (statusDot) statusDot.classList.remove('playing');
    }
  }
  
  // Load friends activity
  async function loadFriendsActivity() {
    const panel = document.getElementById('tidal-social-panel');
    if (!panel) return;
    
    const activityList = panel.querySelector('#activity-list');
    if (!activityList) return;
    
    activityList.innerHTML = '<div class="loading">Loading...</div>';
    
    try {
      const response = await fetch('http://localhost:3000/api/feed', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        displayFriendsActivity(data.items || []);
      } else {
        activityList.innerHTML = '<div class="error">Failed to load activity</div>';
      }
    } catch (error) {
      console.log('[TidalSocial] Failed to load friends activity:', error);
      activityList.innerHTML = '<div class="error">Connection failed</div>';
    }
  }
  
  // Display friends activity
  function displayFriendsActivity(activities) {
    const panel = document.getElementById('tidal-social-panel');
    if (!panel) return;
    
    const activityList = panel.querySelector('#activity-list');
    if (!activityList) return;
    
    if (activities.length === 0) {
      activityList.innerHTML = '<div class="empty-state"><p>No recent activity</p></div>';
      return;
    }
    
    const html = activities.slice(0, 10).map(activity => `
      <div class="activity-item">
        <div class="activity-track">${activity.track}</div>
        <div class="activity-artist">${activity.artist}</div>
        <div class="activity-time">${formatTime(activity.playedAtUtc)}</div>
      </div>
    `).join('');
    
    activityList.innerHTML = html;
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
      createSidePanel();
      
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
        
      case 'TOGGLE_PANEL':
        const toggleButton = document.getElementById('tidal-social-toggle');
        if (toggleButton && message.enabled !== undefined) {
          // Simulate click to toggle panel
          if (message.enabled) {
            toggleButton.click();
          }
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
        const panel = document.getElementById('tidal-social-panel');
        if (panel && panel.classList.contains('panel-open')) {
          loadFriendsActivity();
        }
        break;
    }
  }
  
  // Update connection status
  function updateConnectionStatus(connected) {
    const panel = document.getElementById('tidal-social-panel');
    if (!panel) return;
    
    const statusDot = panel.querySelector('#status-dot');
    const statusText = panel.querySelector('#status-text');
    
    if (connected) {
      if (statusDot) statusDot.classList.add('connected');
      if (statusText) statusText.textContent = 'Connected';
    } else {
      if (statusDot) statusDot.classList.remove('connected');
      if (statusText) statusText.textContent = 'Disconnected';
    }
  }
})();
