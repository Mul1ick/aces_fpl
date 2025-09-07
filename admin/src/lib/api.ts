// Centralized API functions for Aces FPL Admin Portal

import type { 
  User, 
  Player, 
  Team, 
  Fixture, 
  Gameweek, 
  DashboardStats, 
  PlayerStats, 
  APIResponse, 
  PaginatedResponse,
  PlayerFormData,
  UserUpdateData
} from '@/types';

// Configurable API base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class APIError extends Error {
  constructor(message: string, public status: number, public response?: Response) {
    super(message);
    this.name = 'APIError';
  }
}

// Generic API request function with authentication
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    // Default to JSON, but can be overridden
    'Content-Type': 'application/json',
  };

  // Merge additional headers from options, allowing override
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // If body is FormData, let the browser set the Content-Type header
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Try to parse JSON for a more detailed error message
      try {
        const errorJson = JSON.parse(errorText);
        throw new APIError(errorJson.detail || `API Error: ${response.status}`, response.status, response);
      } catch {
        throw new APIError(`API Error: ${response.status} - ${errorText}`, response.status, response);
      }
    }

    // Handle cases with no JSON response body (e.g., 204 No Content)
    if (response.status === 204) {
      return null as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
  }
}

// Authentication API calls
export const authAPI = {
  async login(email: string, password: string): Promise<{ access_token: string; token_type: string; user: User }> {
    // --- UPDATED --- Use URLSearchParams for x-www-form-urlencoded
    const body = new URLSearchParams();
    body.append('username', email);
    body.append('password', password);

    return apiRequest('/auth/login', {
      method: 'POST',
      // --- UPDATED --- Explicitly set the correct Content-Type header
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
  },

  async getCurrentUser(token: string): Promise<User> {
    return apiRequest('/auth/me', { method: 'GET' }, token);
  },
};

// Dashboard API calls
export const dashboardAPI = {
  async getStats(token: string) {
    const url = `${API_BASE_URL}/admin/dashboard/stats`;
    console.log("[dashboardAPI] Fetching:", url);

    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch dashboard stats (${res.status})`);
    }
    return res.json();
  },
};

// User Management API calls
export const userAPI = {
  async getPendingUsers(token: string): Promise<User[]> {
    return apiRequest('/admin/users/pending', { method: 'GET' }, token);
  },

  async getAllUsers(token: string, page = 1, search = ''): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams({ page: page.toString() });
    if (search) params.append('search', search);
    
    return apiRequest(`/admin/users?${params}`, { method: 'GET' }, token);
  },

  async approveUser(userId: string, token: string): Promise<APIResponse<User>> {
    return apiRequest(`/admin/users/${userId}/approve`, { method: 'POST' }, token);
  },

  async updateUserRole(userId: string, data: UserUpdateData, token: string): Promise<APIResponse<User>> {
    return apiRequest(`/admin/users/${userId}/update-role`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  async bulkApproveUsers(userIds: string[], token: string): Promise<APIResponse<User[]>> {
    return apiRequest('/admin/users/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ user_ids: userIds }),
    }, token);
  },
};

// Team Management API calls
export const teamAPI = {
  async getTeams(token: string): Promise<Team[]> {
    return apiRequest('/admin/teams', { method: 'GET' }, token);
  },

  async createTeam(team: Omit<Team, 'id'>, token: string): Promise<APIResponse<Team>> {
    return apiRequest('/admin/teams', {
      method: 'POST',
      body: JSON.stringify(team),
    }, token);
  },

  async updateTeam(teamId: string, team: Partial<Team>, token: string): Promise<APIResponse<Team>> {
    return apiRequest(`/admin/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(team),
    }, token);
  },

  async deleteTeam(teamId: string, token: string): Promise<APIResponse<void>> {
    return apiRequest(`/admin/teams/${teamId}`, { method: 'DELETE' }, token);
  },
};

// Player Management API calls
export const playerAPI = {
  async getPlayers(token: string, search = '', team = '', position = ''): Promise<Player[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (team) params.append('team', team);
    if (position) params.append('position', position);
    
    return apiRequest(`/admin/players?${params}`, { method: 'GET' }, token);
  },

  async createPlayer(player: PlayerFormData, token: string): Promise<APIResponse<Player>> {
    return apiRequest('/admin/players', {
      method: 'POST',
      body: JSON.stringify(player),
    }, token);
  },

  async updatePlayer(playerId: string, player: Partial<PlayerFormData>, token: string): Promise<APIResponse<Player>> {
    return apiRequest(`/admin/players/${playerId}`, {
      method: 'PUT',
      body: JSON.stringify(player),
    }, token);
  },

  async deletePlayer(playerId: string, token: string): Promise<APIResponse<void>> {
    return apiRequest(`/admin/players/${playerId}`, { method: 'DELETE' }, token);
  },
};

// Gameweek Management API calls
export const gameweekAPI = {
  async getGameweeks(token: string): Promise<Gameweek[]> {
    return apiRequest('/admin/gameweeks', { method: 'GET' }, token);
  },

  async getCurrentGameweek(token: string): Promise<Gameweek> {
    return apiRequest('/admin/gameweeks/current', { method: 'GET' }, token);
  },

  async getFixtures(gameweekId: string, token: string): Promise<Fixture[]> {
    return apiRequest(`/admin/gameweeks/${gameweekId}/fixtures`, { method: 'GET' }, token);
  },

  async submitPlayerStats(gameweekId: string, fixtureId: string, stats: PlayerStats[], token: string): Promise<APIResponse<void>> {
    return apiRequest(`/admin/gameweeks/${gameweekId}/stats`, {
      method: 'POST',
      body: JSON.stringify({ fixture_id: fixtureId, player_stats: stats }),
    }, token);
  },

  async calculatePoints(gameweekId: string, token: string): Promise<APIResponse<void>> {
    return apiRequest(`/admin/gameweeks/${gameweekId}/calculate-points`, {
      method: 'POST',
    }, token);
  },

  async getGameweekStatus(gameweekId: string, token: string): Promise<{ stats_complete: boolean; ready_to_finalize: boolean }> {
    return apiRequest(`/admin/gameweeks/${gameweekId}/status`, { method: 'GET' }, token);
  },
};

export { APIError };

