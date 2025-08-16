(function () {
  const id = 'tidal-social-overlay';
  const styleId = 'tidal-social-shift-style';
  const openClass = 'ts-panel-open';
  let panel = null;
  let isPanelOpen = false;
  let currentPanelWidth = 400;

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'togglePanel') {
      togglePanel();
    }
  });
  
  function togglePanel() {
    if (isPanelOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }

  // --- New: compute width + inject/update page shift styles ---
  function computePanelWidth() {
    // Dock at right: cap to 420px, never more than 40% of viewport
    const maxPx = 400;
    const vwCap = Math.floor(window.innerWidth * 0.4);
    return Math.min(maxPx, Math.max(280, vwCap));
  }

  function applyPageShift(widthPx) {
    let style = document.getElementById(styleId);
    const css = `
      /* While open, give the page breathing room on the right */
      body.${openClass} {
        padding-right: ${widthPx}px !important;
        box-sizing: border-box !important;
        overflow-x: hidden !important;
        transition: padding-right 150ms ease;
      }
      html.${openClass} {
        overflow-y: overlay; /* smoother scrollbars on some sites */
      }
    `;
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      style.textContent = css;
      document.head.appendChild(style);
    } else {
      style.textContent = css;
    }
    document.documentElement.classList.add(openClass);
    document.body.classList.add(openClass);
  }

  function removePageShift() {
    document.documentElement.classList.remove(openClass);
    document.body.classList.remove(openClass);
    const style = document.getElementById(styleId);
    if (style) style.remove();
  }

  function handleResize() {
    if (!isPanelOpen || !panel) return;
    currentPanelWidth = computePanelWidth();
    panel.style.width = currentPanelWidth + 'px';
    applyPageShift(currentPanelWidth);
  }
  
  function openPanel() {
    if (isPanelOpen) return;
    
    // Check if panel already exists
    if (document.getElementById(id)) return;

    // Width & page shift first so layout doesn't jump after insert
    currentPanelWidth = computePanelWidth();
    applyPageShift(currentPanelWidth);
    
    panel = document.createElement('div');
    panel.id = id;
    panel.style.position = 'fixed';
    panel.style.top = '0';
    panel.style.right = '0';
    panel.style.width = currentPanelWidth + 'px';
    panel.style.height = '100vh';
    panel.style.background = '#000000';
    panel.style.borderLeft = '1px solid rgba(255,255,255,0.08)';
    panel.style.color = '#fff';
    panel.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    panel.style.zIndex = '2147483000'; // high but below devtools
    panel.style.overflow = 'hidden';
    
    // Create the COMPANION UI
    panel.innerHTML = `
      <div class="companion-header">
        <div class="logo-container">
          <div class="tidal-logo">
            <img src="${chrome.runtime.getURL('Logo.png')}" alt="Tidal Logo" class="logo-image">
          </div>
          <img src="${chrome.runtime.getURL('COMPANION.png')}" alt="COMPANION" class="companion-title-image">
        </div>
        
        <div class="nav-tabs">
          <div class="nav-tab active" data-tab="friends">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <div class="nav-tab" data-tab="playlists">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13H5V11H3V13ZM3 17H5V15H3V17ZM3 9H5V7H3V9ZM7 13H21V11H7V13ZM7 17H21V15H7V17ZM7 7V9H21V7H7Z"/>
            </svg>
          </div>
          <div class="nav-tab" data-tab="friends-list">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div class="companion-content">
        <!-- Friends Tab Content -->
        <div class="tab-content active" id="friends-content">
          <h2 class="section-title">FRIEND ACTIVITY</h2>
          <div class="friend-activity-list">
            <div class="activity-card">
              <div class="activity-thumbnail">
                <div class="album-art-placeholder"></div>
                <div class="play-button">▶</div>
              </div>
              <div class="activity-info">
                <div class="song-title">HYAENA</div>
                <div class="artist-name">Travis Scott</div>
                <div class="timestamp">Now</div>
              </div>
              <div class="friend-info">
                <div class="friend-name">adigo</div>
                <div class="friend-avatar">
                  <div class="avatar-placeholder"></div>
                </div>
              </div>
            </div>
            
            <div class="activity-card">
              <div class="activity-thumbnail">
                <div class="album-art-placeholder"></div>
                <div class="play-button">▶</div>
              </div>
              <div class="activity-info">
                <div class="song-title">HYAENA</div>
                <div class="artist-name">Travis Scott</div>
                <div class="timestamp">10 Min Ago</div>
              </div>
              <div class="friend-info">
                <div class="friend-name">adigo</div>
                <div class="friend-avatar">
                  <div class="avatar-placeholder"></div>
                </div>
              </div>
            </div>
            
            <div class="activity-card">
              <div class="activity-thumbnail">
                <div class="album-art-placeholder"></div>
                <div class="play-button">▶</div>
              </div>
              <div class="activity-info">
                <div class="song-title">HYAENA</div>
                <div class="artist-name">Travis Scott</div>
                <div class="timestamp">10 Min Ago</div>
              </div>
              <div class="friend-info">
                <div class="friend-name">adigo</div>
                <div class="friend-avatar">
                  <div class="avatar-placeholder"></div>
                </div>
              </div>
            </div>
            
            <div class="activity-card">
              <div class="activity-thumbnail">
                <div class="album-art-placeholder"></div>
                <div class="play-button">▶</div>
              </div>
              <div class="activity-info">
                <div class="song-title">HYAENA</div>
                <div class="artist-name">Travis Scott</div>
                <div class="timestamp">10 Min Ago</div>
              </div>
              <div class="friend-info">
                <div class="friend-name">adigo</div>
                <div class="friend-avatar">
                  <div class="avatar-placeholder"></div>
                </div>
              </div>
            </div>
            
            <div class="activity-card">
              <div class="activity-thumbnail">
                <div class="album-art-placeholder"></div>
                <div class="play-button">▶</div>
              </div>
              <div class="activity-info">
                <div class="song-title">HYAENA</div>
                <div class="artist-name">Travis Scott</div>
                <div class="timestamp">10 Min Ago</div>
              </div>
              <div class="friend-info">
                <div class="friend-name">adigo</div>
                <div class="friend-avatar">
                  <div class="avatar-placeholder"></div>
                </div>
              </div>
            </div>
            
            <div class="activity-card">
              <div class="activity-thumbnail">
                <div class="album-art-placeholder"></div>
                <div class="play-button">▶</div>
              </div>
              <div class="activity-info">
                <div class="song-title">HYAENA</div>
                <div class="artist-name">Travis Scott</div>
                <div class="timestamp">10 Min Ago</div>
              </div>
              <div class="friend-info">
                <div class="friend-name">adigo</div>
                <div class="friend-avatar">
                  <div class="avatar-placeholder"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Playlists Tab Content -->
        <div class="tab-content" id="playlists-content">
          <h2 class="section-title">COLLABORATIVE PLAYLISTS</h2>
          <div class="playlist-actions">
            <button class="btn btn-secondary" id="create-playlist-btn">Create</button>
            <button class="btn btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
                <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
              </svg>
              Filter
            </button>
          </div>
          <div class="playlist-grid">
            <div class="playlist-card">
              <div class="playlist-cover"></div>
              <div class="playlist-title">Video Game Music</div>
              <div class="playlist-creator">adigo</div>
              <div class="playlist-tracks">67 TRACKS</div>
            </div>
            <div class="playlist-card">
              <div class="playlist-cover"></div>
              <div class="playlist-title">Video Game Music</div>
              <div class="playlist-creator">adigo</div>
              <div class="playlist-tracks">67 TRACKS</div>
            </div>
            <div class="playlist-card">
              <div class="playlist-cover"></div>
              <div class="playlist-title">Video Game Music</div>
              <div class="playlist-creator">adigo</div>
              <div class="playlist-tracks">67 TRACKS</div>
            </div>
            <div class="playlist-card">
              <div class="playlist-cover"></div>
              <div class="playlist-title">Video Game Music</div>
              <div class="playlist-creator">adigo</div>
              <div class="playlist-tracks">67 TRACKS</div>
            </div>
            <div class="playlist-card">
              <div class="playlist-cover"></div>
              <div class="playlist-title">Video Game Music</div>
              <div class="playlist-creator">adigo</div>
              <div class="playlist-tracks">67 TRACKS</div>
            </div>
            <div class="playlist-card">
              <div class="playlist-cover"></div>
              <div class="playlist-title">Video Game Music</div>
              <div class="playlist-creator">adigo</div>
              <div class="playlist-tracks">67 TRACKS</div>
            </div>
          </div>
        </div>
        
        <!-- Friends List Tab Content -->
        <div class="tab-content" id="friends-list-content">
          <h2 class="section-title">FRIENDS LIST</h2>
          
          <!-- Search Section -->
          <div class="search-section">
            <div class="search-input-container">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="search-icon">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input type="text" placeholder="Search for friends..." class="search-input" id="friend-search">
            </div>
            <button class="btn btn-primary" id="add-friend-btn">Add Friend</button>
          </div>
          
          <!-- Current Friends -->
          <div class="friends-section">
            <h3 class="subsection-title">Current Friends</h3>
            <div class="friends-list">
              <div class="friend-item">
                <div class="friend-avatar">
                  <div class="avatar-placeholder"></div>
                </div>
                <div class="friend-details">
                  <div class="friend-name">adigo</div>
                  <div class="friend-status">Online</div>
                </div>
                <button class="remove-friend-btn" data-username="adigo">Remove</button>
              </div>
              
              <div class="friend-item">
                <div class="friend-avatar">
                  <div class="avatar-placeholder"></div>
                </div>
                <div class="friend-details">
                  <div class="friend-name">musiclover</div>
                  <div class="friend-status">Listening to Travis Scott</div>
                </div>
                <button class="remove-friend-btn" data-username="musiclover">Remove</button>
              </div>
              
              <div class="friend-item">
                <div class="friend-avatar">
                  <div class="avatar-placeholder"></div>
                </div>
                <div class="friend-details">
                  <div class="friend-name">playlist_creator</div>
                  <div class="friend-status">Offline</div>
                </div>
                <button class="remove-friend-btn" data-username="playlist_creator">Remove</button>
              </div>
            </div>
          </div>
          
          <!-- Search Results -->
          <div class="search-results" id="search-results" style="display: none;">
            <h3 class="subsection-title">Search Results</h3>
            <div class="search-results-list" id="search-results-list">
              <!-- Search results will be populated here -->
            </div>
          </div>
        </div>
      </div>
      
      <!-- Create Playlist Modal -->
      <div class="modal-overlay" id="create-playlist-modal">
        <div class="modal">
          <div class="modal-header">
            <h3>Create playlist</h3>
            <button class="close-btn" id="close-modal">×</button>
          </div>
          <div class="modal-content">
            <div class="modal-left">
              <div class="playlist-image-placeholder"></div>
              <button class="btn btn-secondary">Change image</button>
            </div>
            <div class="modal-right">
              <input type="text" placeholder="Title" class="form-input">
              <textarea placeholder="Write a Description" class="form-textarea"></textarea>
              
              <div class="form-section">
                <div class="form-row">
                  <span>Make it public</span>
                  <label class="toggle">
                    <input type="checkbox">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <small>Your Playlist will be visible on your Profile</small>
              </div>
              
              <div class="form-section">
                <span>Invite Friends to collaborate:</span>
                <div class="invite-link">
                  <a href="#" class="link">https:tidalcompanion.com/playlistcode</a>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" id="save-playlist">Save</button>
          </div>
        </div>
      </div>
      
      <!-- Bottom User Bar -->
      <div class="user-bar">
        <div class="user-info">
          <div class="user-avatar">
            <div class="avatar-placeholder"></div>
          </div>
          <span class="user-name">adigo</span>
        </div>
        <button class="menu-btn">⋯</button>
      </div>
      
      <!-- Close Button -->
      <button class="close-overlay-btn" id="ts-close">×</button>
    `;
    
    document.body.appendChild(panel);
    isPanelOpen = true;
    
    // Add event listeners
    setupEventListeners();
    window.addEventListener('resize', handleResize);
  }
  
  function closePanel() {
    if (!isPanelOpen) return;
    
    if (panel && panel.parentNode) {
      panel.parentNode.removeChild(panel);
      panel = null;
    }
    isPanelOpen = false;

    removePageShift();
    window.removeEventListener('resize', handleResize);
  }
  
  function setupEventListeners() {
    if (!panel) return;
    
    // Tab switching
    const tabs = panel.querySelectorAll('.nav-tab');
    const contents = panel.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update active content
        contents.forEach(content => {
          content.classList.remove('active');
          if (content.id === `${targetTab}-content`) {
            content.classList.add('active');
          }
        });
      });
    });
    
    // Create playlist modal
    const createBtn = panel.querySelector('#create-playlist-btn');
    const modal = panel.querySelector('#create-playlist-modal');
    const closeModal = panel.querySelector('#close-modal');
    const saveBtn = panel.querySelector('#save-playlist');
    
    createBtn?.addEventListener('click', () => {
      modal.classList.add('active');
    });
    
    closeModal?.addEventListener('click', () => {
      modal.classList.remove('active');
    });
    
    saveBtn?.addEventListener('click', () => {
      modal.classList.remove('active');
      // Add save logic here
    });
    
    // Friends list functionality
    const friendSearch = panel.querySelector('#friend-search');
    const addFriendBtn = panel.querySelector('#add-friend-btn');
    const removeFriendBtns = panel.querySelectorAll('.remove-friend-btn');
    
    // Search functionality
    friendSearch?.addEventListener('input', (e) => {
      const searchTerm = e.target.value.trim();
      if (searchTerm.length > 0) {
        performFriendSearch(searchTerm);
      } else {
        hideSearchResults();
      }
    });
    
    // Add friend button
    addFriendBtn?.addEventListener('click', () => {
      const searchTerm = friendSearch.value.trim();
      if (searchTerm.length > 0) {
        addFriend(searchTerm);
      }
    });
    
    // Remove friend buttons
    removeFriendBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const username = e.target.dataset.username;
        removeFriend(username);
      });
    });
    
    // Close overlay
    const closeBtn = panel.querySelector('#ts-close');
    closeBtn?.addEventListener('click', () => {
      closePanel();
    });
    
    // Close modal when clicking outside
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }
  
  // Friend management functions
  function performFriendSearch(searchTerm) {
    // Simulate search results - in real app, this would call an API
    const mockResults = [
      { username: searchTerm + '_user1', status: 'Online' },
      { username: searchTerm + '_user2', status: 'Listening to music' },
      { username: searchTerm + '_user3', status: 'Offline' }
    ];
    
    displaySearchResults(mockResults);
  }
  
  function displaySearchResults(results) {
    const searchResults = panel.querySelector('#search-results');
    const searchResultsList = panel.querySelector('#search-results-list');
    
    if (!searchResults || !searchResultsList) return;
    
    searchResultsList.innerHTML = results.map(user => `
      <div class="search-result-item">
        <div class="friend-avatar">
          <div class="avatar-placeholder"></div>
        </div>
        <div class="friend-details">
          <div class="friend-name">${user.username}</div>
          <div class="friend-status">${user.status}</div>
        </div>
        <button class="add-friend-result-btn" data-username="${user.username}">Add</button>
      </div>
    `).join('');
    
    // Add event listeners to new add buttons
    const addButtons = searchResultsList.querySelectorAll('.add-friend-result-btn');
    addButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const username = e.target.dataset.username;
        addFriend(username);
      });
    });
    
    searchResults.style.display = 'block';
  }
  
  function hideSearchResults() {
    const searchResults = panel.querySelector('#search-results');
    if (searchResults) {
      searchResults.style.display = 'none';
    }
  }
  
  function addFriend(username) {
    // In real app, this would call an API to add friend
    console.log(`Adding friend: ${username}`);
    
    // Clear search
    const friendSearch = panel.querySelector('#friend-search');
    if (friendSearch) {
      friendSearch.value = '';
    }
    hideSearchResults();
    
    // Show success message (you could add a toast notification here)
    alert(`Friend request sent to ${username}!`);
  }
  
  function removeFriend(username) {
    // In real app, this would call an API to remove friend
    console.log(`Removing friend: ${username}`);
    
    // Remove from UI
    const friendItem = panel.querySelector(`[data-username="${username}"]`).closest('.friend-item');
    if (friendItem) {
      friendItem.remove();
    }
    
    // Show success message
    alert(`${username} removed from friends list!`);
  }
})();
