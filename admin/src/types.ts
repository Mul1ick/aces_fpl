// Core Types for Aces FPL Admin Portal

// --- NEW ---
export type GameweekStatus = 'UPCOMING' | 'LIVE' | 'FINISHED' | 'Calculating' | 'Points Calculated';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface Team {
  id: number;
  name: string;
  short_name: string;
  logo_url?: string;
  next_fixture?: string;
  primary_color?: string;
  secondary_color?: string;
  player_count?: number;
}

export type PlayerStatus = 'ACTIVE' | 'INJURED' | 'SUSPENDED' ;

export interface Player {
  id: number;
  full_name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  team_id: number;
  team: Team;
  price: number;
  status: PlayerStatus;
  total_points: number;
  games_played: number;
  minutes_played: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus_points: number;
}

export interface Fixture {
  id: string;
  gameweek_id: string;
  home_team_id: string;
  away_team_id: string;
  home_team?: Team;
  away_team?: Team;
  kickoff_time: string;
  finished: boolean;
  home_score?: number;
  away_score?: number;
  stats_entered: boolean;
}

export interface Gameweek {
  id: number;
  gw_number: number;
  name: string;
  deadline: string;
  status: GameweekStatus; // <-- MODIFIED
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
  data_checked: boolean;
  fixtures?: Fixture[];
  transfers_made?: number;
  most_selected?: string;
  most_transferred_in?: string;
  top_element?: string;
  most_captained?: string;
  most_vice_captained?: string;
}

export interface PlayerStats {
  player_id: string;
  fixture_id: string;
  minutes_played: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus_points: number;
}

export interface PlayerGameweekStats {
  played: boolean;
  goals_scored: number;
  assists: number;
  clean_sheets: boolean;
  goals_conceded: number;
  own_goals: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  bonus_points: number;
}

export interface DashboardStats {
  pending_users: number;
  total_users: number;
  total_players: number;
  current_gameweek: Gameweek | null;
  recent_activities: Activity[];
}

export interface Activity {
  id: string;
  type: 'user_registered' | 'user_approved' | 'gameweek_finalized' | 'stats_entered';
  description: string;
  timestamp: string;
  user_id?: string;
  gameweek_id?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export interface APIResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface PlayerFormData {
  full_name: string;
  position: Player['position'];
  team_id: number;
  price: number;
  status: PlayerStatus;
}

export interface UserUpdateData {
  role?: 'user' | 'admin';
  is_active?: boolean;
}
