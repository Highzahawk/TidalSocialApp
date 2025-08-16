import { env } from '../env';

export interface TidalUser {
  id: string;
  username: string;
  email?: string;
  picture?: string;
}

export interface TidalTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  url?: string;
}

export interface TidalPlaylist {
  id: string;
  title: string;
  description?: string;
  trackCount: number;
  picture?: string;
}

export class TidalAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public subStatus?: number,
    public errorDescription?: string
  ) {
    super(message);
    this.name = 'TidalAPIError';
  }
}

export class TidalAPI {
  private accessToken: string;
  private refreshToken?: string;
  private baseUrl = 'https://api.tidal.com/v1';

  constructor(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific Tidal API errors
        if (response.status === 403) {
          if (errorData.sub_status === 1005) {
            throw new TidalAPIError(
              'Request not allowed - check permissions and token validity',
              response.status,
              errorData.sub_status,
              errorData.error_description
            );
          }
          throw new TidalAPIError(
            'Access forbidden - token may be expired or invalid',
            response.status,
            errorData.sub_status,
            errorData.error_description
          );
        }
        
        if (response.status === 401) {
          throw new TidalAPIError(
            'Unauthorized - token expired or invalid',
            response.status,
            errorData.sub_status,
            errorData.error_description
          );
        }

        throw new TidalAPIError(
          `TIDAL API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData.sub_status,
          errorData.error_description
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof TidalAPIError) {
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new TidalAPIError(
          'Network error - check your internet connection',
          0
        );
      }
      
      throw new TidalAPIError(
        `Unexpected error: ${error.message}`,
        0
      );
    }
  }

  async getCurrentUser(): Promise<TidalUser> {
    return this.request<TidalUser>('/users/me');
  }

  async getUserPlaylists(userId: string): Promise<TidalPlaylist[]> {
    try {
      const response = await this.request<{ items: TidalPlaylist[] }>(`/users/${userId}/playlists`);
      return response.items;
    } catch (error) {
      if (error instanceof TidalAPIError && error.status === 403) {
        // Return empty array if user doesn't have permission to view playlists
        console.warn('No permission to view playlists:', error.message);
        return [];
      }
      throw error;
    }
  }

  async getPlaylistTracks(playlistId: string): Promise<TidalTrack[]> {
    try {
      const response = await this.request<{ items: TidalTrack[] }>(`/playlists/${playlistId}/tracks`);
      return response.items;
    } catch (error) {
      if (error instanceof TidalAPIError && error.status === 403) {
        // Return empty array if playlist is private or no access
        console.warn('No permission to view playlist tracks:', error.message);
        return [];
      }
      throw error;
    }
  }

  async getCurrentPlayback(): Promise<TidalTrack | null> {
    try {
      return await this.request<TidalTrack>('/playback/current');
    } catch (error) {
      if (error instanceof TidalAPIError && error.status === 403) {
        // User might not be currently playing anything or no permission
        console.warn('No current playback or permission denied:', error.message);
        return null;
      }
      throw error;
    }
  }

  async getUserFavorites(userId: string): Promise<TidalTrack[]> {
    try {
      const response = await this.request<{ items: TidalTrack[] }>(`/users/${userId}/favorites/tracks`);
      return response.items;
    } catch (error) {
      if (error instanceof TidalAPIError && error.status === 403) {
        // Return empty array if favorites are private
        console.warn('No permission to view favorites:', error.message);
        return [];
      }
      throw error;
    }
  }

  async searchTracks(query: string, limit = 20): Promise<TidalTrack[]> {
    try {
      const response = await this.request<{ items: TidalTrack[] }>(
        `/search/tracks?query=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response.items;
    } catch (error) {
      if (error instanceof TidalAPIError && error.status === 403) {
        // Return empty array if search is not allowed
        console.warn('Search not allowed:', error.message);
        return [];
      }
      throw error;
    }
  }

  // Method to refresh access token
  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new TidalAPIError('No refresh token available', 0);
    }

    try {
      const response = await fetch('https://auth.tidal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new TidalAPIError(
          'Failed to refresh access token',
          response.status
        );
      }

      const tokenData = await response.json();
      this.accessToken = tokenData.access_token;
      
      if (tokenData.refresh_token) {
        this.refreshToken = tokenData.refresh_token;
      }

      return this.accessToken;
    } catch (error) {
      throw new TidalAPIError(
        `Token refresh failed: ${error.message}`,
        0
      );
    }
  }
}

// Helper function to create TidalAPI instance from session
export function createTidalAPI(accessToken: string, refreshToken?: string): TidalAPI {
  return new TidalAPI(accessToken, refreshToken);
}
