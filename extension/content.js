(function () {
  const id = 'tidal-social-overlay';
  if (document.getElementById(id)) return;
  
  const panel = document.createElement('div');
  panel.id = id;
  panel.style.position = 'fixed';
  panel.style.top = '0';
  panel.style.right = '0';
  panel.style.width = '400px';
  panel.style.height = '100vh';
  panel.style.background = '#000000';
  panel.style.borderLeft = '1px solid rgba(255,255,255,0.08)';
  panel.style.color = '#fff';
  panel.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  panel.style.zIndex = '999999';
  panel.style.overflow = 'hidden';
  
  // Create the COMPANION UI
  panel.innerHTML = `
    <div class="companion-header">
      <div class="logo-container">
        <div class="tidal-logo">
          <div class="logo-circle">
            <div class="diamond diamond-1"></div>
            <div class="diamond diamond-2"></div>
            <div class="diamond diamond-3"></div>
          </div>
        </div>
        <span class="companion-text">COMPANION</span>
      </div>
      
      <div class="nav-tabs">
        <div class="nav-tab active" data-tab="friends">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 4C16 5.1 15.1 6 14 6C12.9 6 12 5.1 12 4C12 2.9 12.9 2 14 2C15.1 2 16 2.9 16 4ZM20 22V20C20 18.9 19.1 18 18 18H10C8.9 18 8 18.9 8 20V22H6V20C6 17.8 7.8 16 10 16H18C20.2 16 22 17.8 22 20V22H20ZM8 12C8 13.1 7.1 14 6 14C4.9 14 4 13.1 4 12C4 10.9 4.9 10 6 10C7.1 10 8 10.9 8 12ZM10 10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12C10.9 12 10 11.1 10 10ZM16 12C16 13.1 15.1 14 14 14C12.9 14 12 13.1 12 12C12 10.9 12.9 10 14 10C15.1 10 16 10.9 16 12Z"/>
          </svg>
        </div>
        <div class="nav-tab" data-tab="playlists">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13H5V11H3V13ZM3 17H5V15H3V17ZM3 9H5V7H3V9ZM7 13H21V11H7V13ZM7 17H21V15H7V17ZM7 7V9H21V7H7Z"/>
          </svg>
        </div>
        <div class="nav-tab" data-tab="groups">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 4C16 5.1 15.1 6 14 6C12.9 6 12 5.1 12 4C12 2.9 12.9 2 14 2C15.1 2 16 2.9 16 4ZM20 22V20C20 18.9 19.1 18 18 18H10C8.9 18 8 18.9 8 20V22H6V20C6 17.8 7.8 16 10 16H18C20.2 16 22 17.8 22 20V22H20ZM8 12C8 13.1 7.1 14 6 14C4.9 14 4 13.1 4 12C4 10.9 4.9 10 6 10C7.1 10 8 10.9 8 12ZM10 10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12C10.9 12 10 11.1 10 10ZM16 12C16 13.1 15.1 14 14 14C12.9 14 12 13.1 12 12C12 10.9 12.9 10 14 10C15.1 10 16 10.9 16 12Z"/>
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
      
      <!-- Groups Tab Content -->
      <div class="tab-content" id="groups-content">
        <h2 class="section-title">GROUPS</h2>
        <div class="groups-list">
          <div class="group-item">
            <div class="group-icon">👥</div>
            <div class="group-name">Music Lovers</div>
            <div class="group-members">12 members</div>
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
  
  // Add event listeners
  setupEventListeners();
  
  function setupEventListeners() {
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
    
    // Close overlay
    const closeBtn = panel.querySelector('#ts-close');
    closeBtn?.addEventListener('click', () => panel.remove());
    
    // Close modal when clicking outside
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }
})();
