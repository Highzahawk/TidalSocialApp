// Tidal Social Extension Popup Logic
class TidalSocialPopup {
  constructor() {
    this.isAuthenticated = false;
    this.currentTab = 'activity';
    this.friendsData = [];
    this.activityData = [];
    
    this.init();
  }

  async init() {
    console.log('[TidalSocial] Popup initializing...');
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Check authentication status
    await this.checkAuthStatus();
    
    // Setup tab navigation
    this.setupTabs();
    
    // Start periodic updates if authenticated
    if (this.isAuthenticated) {
      this.startPeriodicUpdates();
    }
    
    // Connect to background script
    this.connectToBackground();
  }

  setupEventListeners() {
    // Auth button
    const authButton = document.getElementById('auth-button');
    if (authButton) {
      authButton.addEventListener('click', () => this.handleAuth());
    }

    // Tab navigation
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Refresh button
    const refreshButton = document.getElementById('refresh-activity');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.refreshActivity());
    }

    // Add friend button
    const addFriendButton = document.getElementById('add-friend-button');
    if (addFriendButton) {
      addFriendButton.addEventListener('click', () => this.showAddFriendModal());
    }

    // Modal controls
    const closeModal = document.getElementById('close-modal');
    const cancelAdd = document.getElementById('cancel-add');
    const confirmAdd = document.getElementById('confirm-add');
    
    if (closeModal) closeModal.addEventListener('click', () => this.hideAddFriendModal());
    if (cancelAdd) cancelAdd.addEventListener('click', () => this.hideAddFriendModal());
    if (confirmAdd) confirmAdd.addEventListener('click', () => this.addFriend());

    // Settings checkboxes
    const settingCheckboxes = document.querySelectorAll('#settings-tab input[type="checkbox"]');
    settingCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => this.updateSetting(e.target.id, e.target.checked));
    });

    // Sign out button
    const signOutButton = document.getElementById('sign-out-button');
    if (signOutButton) {
      signOutButton.addEventListener('click', () => this.handleSignOut());
    }
  }

  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        
        // Update button states
        tabButtons.forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        
        // Update content visibility
        tabContents.forEach(content => {
          content.classList.remove('active');
          if (content.id === `${tab}-tab`) {
            content.classList.add('active');
          }
        });
        
        this.currentTab = tab;
        
        // Load tab-specific data
        this.loadTabData(tab);
      });
    });
  }

  async checkAuthStatus() {
    console.log('[TidalSocial] Checking auth status...');
    
    // First try to get auth status from content script on TIDAL page
    try {
      const tabs = await chrome.tabs.query({ url: 'https://listen.tidal.com/*' });
      if (tabs.length > 0) {
        console.log('[TidalSocial] Found TIDAL tab, asking content script for auth status');
        
        const response = await new Promise((resolve) => {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_AUTH_STATUS' }, (response) => {
            resolve(response);
          });
        });
        
        if (response && response.authenticated) {
          console.log('[TidalSocial] Authenticated via content script');
          this.isAuthenticated = true;
          this.showMainContent();
          this.updateConnectionStatus(true);
          this.updatePlayingStatus(true); // Also update playing status
          if (response.user) this.updateAccountInfo(response.user);
          return;
        }
      }
    } catch (error) {
      console.log('[TidalSocial] Could not check auth via content script:', error);
    }
    
    // Fallback: try direct API call (won't work due to CORS but we try anyway)
    try {
      const response = await fetch('http://localhost:3000/api/debug/session', {
        credentials: 'include'
      });
      
      console.log('[TidalSocial] Auth response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[TidalSocial] Auth response data:', data);
        
        if (data.session && data.session.user) {
          console.log('[TidalSocial] User authenticated via direct API:', data.session.user);
          this.isAuthenticated = true;
          this.showMainContent();
          this.updateAccountInfo(data.session.user);
          this.updateConnectionStatus(true);
          this.updatePlayingStatus(true); // Also update playing status
          return;
        }
      }
    } catch (error) {
      console.log('[TidalSocial] Direct auth check failed:', error);
    }
    
    // If we get here, we're not authenticated
    console.log('[TidalSocial] No authentication found, showing auth section');
    this.isAuthenticated = false;
    this.showAuthSection();
    this.updateConnectionStatus(false);
  }

  showAuthSection() {
    document.getElementById('auth-section').style.display = 'flex';
    document.getElementById('main-content').style.display = 'none';
  }

  showMainContent() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'flex';
    
    // Load initial data
    this.loadTabData(this.currentTab);
  }

  async handleAuth() {
    try {
      // Open authentication in new tab
      const authUrl = 'http://localhost:3000/api/auth/signin-tidal';
      await chrome.tabs.create({ url: authUrl });
      
      // Close popup after opening auth
      window.close();
    } catch (error) {
      console.error('[TidalSocial] Auth error:', error);
    }
  }

  switchTab(tab) {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.tab === tab);
    });
    
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tab}-tab`);
    });
    
    this.currentTab = tab;
    this.loadTabData(tab);
  }

  async loadTabData(tab) {
    switch (tab) {
      case 'activity':
        await this.loadActivity();
        await this.loadNowPlaying();
        break;
      case 'friends':
        await this.loadFriends();
        break;
      case 'settings':
        await this.loadSettings();
        break;
    }
  }

  async loadActivity() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    activityList.innerHTML = '<div class="loading">Loading activity...</div>';
    
    try {
      const response = await fetch('http://localhost:3000/api/feed', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.activityData = data.items || [];
        this.renderActivity();
      } else {
        activityList.innerHTML = '<div class="error">Failed to load activity</div>';
      }
    } catch (error) {
      console.log('[TidalSocial] Failed to load activity:', error);
      activityList.innerHTML = '<div class="error">Connection failed</div>';
    }
  }

  renderActivity() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    if (this.activityData.length === 0) {
      activityList.innerHTML = '<div class="empty-state"><div class="empty-icon">🎵</div><p>No recent activity</p><p class="empty-subtitle">Activity will appear when friends listen to music</p></div>';
      return;
    }
    
    const html = this.activityData.slice(0, 20).map(activity => `
      <div class="activity-item">
        <div class="activity-track">${this.escapeHtml(activity.track)}</div>
        <div class="activity-artist">by ${this.escapeHtml(activity.artist)}</div>
        <div class="activity-time">${this.formatTime(activity.playedAtUtc)}</div>
      </div>
    `).join('');
    
    activityList.innerHTML = html;
  }

  async loadNowPlaying() {
    // This will be updated by the content script
    // For now, we'll try to get the current track from background
    try {
      const tabs = await chrome.tabs.query({ url: 'https://listen.tidal.com/*' });
      if (tabs.length > 0) {
        // TIDAL is open, content script should be providing data
        this.updatePlayingStatus(true);
      } else {
        this.updateNowPlaying(null);
      }
    } catch (error) {
      console.log('[TidalSocial] Error checking TIDAL tabs:', error);
    }
  }

  updateNowPlaying(track) {
    const currentTrack = document.getElementById('current-track');
    const currentArtist = document.getElementById('current-artist');
    const currentAlbum = document.getElementById('current-album');
    const playingIndicator = document.getElementById('playing-indicator');
    
    if (track) {
      currentTrack.textContent = track.track;
      currentArtist.textContent = `by ${track.artist}`;
      currentAlbum.textContent = track.album || '';
      playingIndicator.classList.add('active');
    } else {
      currentTrack.textContent = 'Not playing';
      currentArtist.textContent = '';
      currentAlbum.textContent = '';
      playingIndicator.classList.remove('active');
    }
  }

  async loadFriends() {
    const friendsList = document.getElementById('friends-list');
    if (!friendsList) return;
    
    // For now, show empty state since friends system isn't implemented yet
    friendsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <p>No friends yet</p>
        <p class="empty-subtitle">Add friends to see their music activity</p>
      </div>
    `;
  }

  async loadSettings() {
    // Load settings from storage
    try {
      const settings = await chrome.storage.sync.get([
        'notifications-enabled',
        'sharing-enabled',
        'overlay-enabled'
      ]);
      
      Object.keys(settings).forEach(key => {
        const checkbox = document.getElementById(key);
        if (checkbox) {
          checkbox.checked = settings[key] !== false; // default to true
        }
      });
    } catch (error) {
      console.log('[TidalSocial] Failed to load settings:', error);
    }
  }

  async updateSetting(settingId, value) {
    try {
      await chrome.storage.sync.set({ [settingId]: value });
      
      // Handle specific settings
      switch (settingId) {
        case 'overlay-enabled':
          // Send message to content script to show/hide overlay
          const tabs = await chrome.tabs.query({ url: 'https://listen.tidal.com/*' });
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
              type: 'TOGGLE_OVERLAY',
              enabled: value
            }).catch(() => {}); // Ignore if content script not loaded
          });
          break;
      }
    } catch (error) {
      console.log('[TidalSocial] Failed to update setting:', error);
    }
  }

  showAddFriendModal() {
    document.getElementById('add-friend-modal').style.display = 'flex';
    document.getElementById('friend-username').focus();
  }

  hideAddFriendModal() {
    document.getElementById('add-friend-modal').style.display = 'none';
    document.getElementById('friend-username').value = '';
  }

  async addFriend() {
    const username = document.getElementById('friend-username').value.trim();
    if (!username) return;
    
    try {
      // This would make an API call to add friend
      console.log('[TidalSocial] Adding friend:', username);
      
      // For now, just close the modal
      this.hideAddFriendModal();
      
      // Show success feedback
      // TODO: Implement actual friend adding
      
    } catch (error) {
      console.log('[TidalSocial] Failed to add friend:', error);
    }
  }

  async refreshActivity() {
    await this.loadActivity();
  }

  updateConnectionStatus(connected) {
    console.log('[TidalSocial] Updating connection status:', connected);
    
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    
    console.log('[TidalSocial] Status elements:', { 
      statusDot: statusDot ? 'FOUND' : 'NOT FOUND', 
      statusText: statusText ? 'FOUND' : 'NOT FOUND' 
    });
    
    if (statusDot && statusText) {
      if (connected) {
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';
        console.log('[TidalSocial] Set status to Connected');
      } else {
        statusDot.classList.remove('connected');
        statusText.textContent = 'Disconnected';
        console.log('[TidalSocial] Set status to Disconnected');
      }
    }
  }

  updatePlayingStatus(playing) {
    const statusDot = document.getElementById('status-dot');
    
    if (playing) {
      statusDot.classList.add('playing');
    } else {
      statusDot.classList.remove('playing');
    }
  }

  updateAccountInfo(user) {
    const accountName = document.getElementById('account-name');
    const accountId = document.getElementById('account-id');
    
    if (accountName) accountName.textContent = user.name || 'User';
    if (accountId) accountId.textContent = user.email || '';
  }

  async handleSignOut() {
    try {
      // Open sign out page
      await chrome.tabs.create({ url: 'http://localhost:3000/api/auth/signout' });
      window.close();
    } catch (error) {
      console.error('[TidalSocial] Sign out error:', error);
    }
  }

  connectToBackground() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'CONNECTION_STATUS':
          this.updateConnectionStatus(message.connected);
          break;
          
        case 'WEBSOCKET_MESSAGE':
          this.handleWebSocketMessage(message.data);
          break;
          
        case 'NOW_PLAYING_UPDATE':
          this.updateNowPlaying(message.track);
          this.updatePlayingStatus(!!message.track);
          break;
      }
    });
    
    // Request initial connection status
    chrome.runtime.sendMessage({ type: 'GET_CONNECTION_STATUS' }, (response) => {
      if (response) {
        this.updateConnectionStatus(response.connected);
      }
    });
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'FRIEND_NOW_PLAYING':
        // Refresh activity when friend starts playing
        if (this.currentTab === 'activity') {
          this.loadActivity();
        }
        break;
        
      case 'FRIENDS_ACTIVITY_UPDATE':
        if (this.currentTab === 'activity') {
          this.loadActivity();
        }
        break;
    }
  }

  startPeriodicUpdates() {
    // Refresh activity every 30 seconds
    setInterval(() => {
      if (this.currentTab === 'activity') {
        this.loadActivity();
      }
    }, 30000);
    
    // Check now playing every 5 seconds
    setInterval(() => {
      if (this.currentTab === 'activity') {
        this.loadNowPlaying();
      }
    }, 5000);
  }

  formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TidalSocialPopup();
});