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

export class TidalAPI {
  private accessToken: string;
  private baseUrl = 'https://api.tidal.com/v1';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`TIDAL API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getCurrentUser(): Promise<TidalUser> {
    return this.request<TidalUser>('/users/me');
  }

  async getUserPlaylists(userId: string): Promise<TidalPlaylist[]> {
    const response = await this.request<{ items: TidalPlaylist[] }>(`/users/${userId}/playlists`);
    return response.items;
  }

  async getPlaylistTracks(playlistId: string): Promise<TidalTrack[]> {
    const response = await this.request<{ items: TidalTrack[] }>(`/playlists/${playlistId}/tracks`);
    return response.items;
  }

  async getCurrentPlayback(): Promise<TidalTrack | null> {
    try {
      return await this.request<TidalTrack>('/playback/current');
    } catch (error) {
      // User might not be currently playing anything
      return null;
    }
  }

  async getUserFavorites(userId: string): Promise<TidalTrack[]> {
    const response = await this.request<{ items: TidalTrack[] }>(`/users/${userId}/favorites/tracks`);
    return response.items;
  }

  async searchTracks(query: string, limit = 20): Promise<TidalTrack[]> {
    const response = await this.request<{ items: TidalTrack[] }>(
      `/search/tracks?query=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.items;
  }
}

// Helper function to create TidalAPI instance from session
export function createTidalAPI(accessToken: string): TidalAPI {
  return new TidalAPI(accessToken);
}
