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
  async getTeams(token: string) {
    return apiRequest<Team[]>('/admin/teams', { method: 'GET' }, token);
  },

  async createTeam(team: Omit<Team, 'id' | 'player_count'>, token: string) {
    return apiRequest<Team>('/admin/teams', {
      method: 'POST',
      body: JSON.stringify(team),
    }, token);
  },

  async updateTeam(teamId: number, team: Partial<Omit<Team, 'id' | 'player_count'>>, token: string) {
    return apiRequest<Team>(`/admin/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(team),
    }, token);
  },

  async deleteTeam(teamId: string, token: string) {
    return apiRequest<void>(`/admin/teams/${teamId}`, { method: 'DELETE' }, token);
  },
};

// Player Management API calls
export const playerAPI = {
  async getPlayers(
  token: string, search = '', team = '', position = ''
): Promise<PaginatedResponse<Player>> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (team) params.append('team', team);
  if (position) params.append('position', position);

  return apiRequest(`/admin/players?${params}`, { method: 'GET' }, token);
},

  async createPlayer(player: PlayerFormData, token: string) {
    return apiRequest('/admin/players', {
      method: 'POST',
      body: JSON.stringify(player),  // player already has team_id
    }, token);
  },

  async updatePlayer(playerId: string, player: Partial<PlayerFormData>, token: string) {
    return apiRequest(`/admin/players/${playerId}`, {
      method: 'PUT',
      body: JSON.stringify(player),  // partial, but same keys
    }, token);
  },

  async deletePlayer(playerId: string, token: string) {
    return apiRequest(`/admin/players/${playerId}`, { method: 'DELETE' }, token);
  },
  async getByTeam(token: string, teamId: number) {
    const params = new URLSearchParams({ team: String(teamId) });
    return apiRequest(`/admin/players?${params}`, { method: 'GET' }, token) as Promise<Player[]>;
  },

};

// Gameweek Management API calls
export const gameweekAPI = {
  async getGameweeks(token: string): Promise<Gameweek[]> {
    return apiRequest('/gameweeks', { method: 'GET' }, token); // CORRECTED Path
  },

  async getCurrentGameweek(token: string): Promise<Gameweek> {
    return apiRequest('/admin/gameweeks/current', { method: 'GET' }, token);
  },

  async getGameweekById(gameweekId: number, token: string): Promise<Gameweek> {
    return apiRequest(`/admin/gameweeks/${gameweekId}`, { method: 'GET' }, token);
  },

  async getFixtures(gameweekId: string, token: string): Promise<Fixture[]> {
    return apiRequest(`/admin/gameweeks/${gameweekId}/fixtures`, { method: 'GET' }, token);
  },
  async calculatePoints(gameweekId: number, token: string): Promise<{ message: string }> {
    return apiRequest(`/admin/gameweeks/${gameweekId}/calculate-points`, {
      method: 'POST',
    }, token);
  },
  async finalizeGameweek(gameweekId: number, token: string): Promise<{ message: string }> {
      return apiRequest(`/admin/gameweeks/${gameweekId}/finalize`, {
        method: 'POST',
      }, token);
    },

  async submitPlayerStats(
    gameweekId: string | number,
    fixtureId: string | number,
    stats: {
      home_score: number;
      away_score: number;
      player_stats: Array<{
        player_id: number;
        goals_scored: number;
        assists: number;
        yellow_cards: number;
        red_cards: number;
        bonus_points: number;
        minutes?: number;
      }>;
    },
    token: string,
  ) {
    return apiRequest(`/admin/gameweeks/${gameweekId}/stats`, {
      method: 'POST',
      body: JSON.stringify({
        fixture_id: Number(fixtureId),
        home_score: stats.home_score,
        away_score: stats.away_score,
        player_stats: stats.player_stats,
      }),
    }, token);
  },

  async getFixtureStats(fixtureId: string, token: string) {
    return apiRequest(`/admin/fixtures/${fixtureId}/stats`, { method: 'GET' }, token);
  },

  async getGameweekStatus(gameweekId: string, token: string): Promise<{ stats_complete: boolean; ready_to_finalize: boolean }> {
    return apiRequest(`/admin/gameweeks/${gameweekId}/status`, { method: 'GET' }, token);
  },
};

export { APIError };