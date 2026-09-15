// src/types.ts

export interface Team {
  id: number;
  name: string;
  short_name: string;
}

export interface PlayerRawStats {
  played: boolean;
  goals_scored?: number;
  assists?: number;
  clean_sheets?: boolean;
  goals_conceded?: number;
  own_goals?: number;
  penalties_missed?: number;
  penalties_saved?: number;
  yellow_cards?: number;
  red_cards?: number;
  bonus_points?: number;
}

export interface Player {
  id: number;
  full_name: string;
  name?: string;
  position: "GK" | "DEF" | "MID" | "FWD" | string;
  pos?: string;
  price: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  is_benched: boolean;
  team: Team | string | any;
  points?: number;
  raw_stats?: PlayerRawStats | null;
  breakdown?: any[];
  status?: 'ACTIVE' | 'INJURED' | 'SUSPENDED' | 'UNAVAILABLE' | string;
  news?: string | null;
  chance_of_playing?: number | null;
  return_date?: string | null;
  recent_fixtures?: any[];
  fixture_str?: string;
}

export interface Gameweek {
  id: string;
  name: string;
  deadline_time: string;
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
  data_checked: boolean;
  transfers_made?: number;
  most_selected?: { name: string; team_name: string; };
  most_transferred_in?: { name: string; team_name: string; };
  top_element?: { name: string; team_name: string; };
  most_captained?: { name: string; team_name: string; };
  most_vice_captained?: { name: string; team_name: string; };
}

export interface TeamResponse {
  team_name: string;
  starting: Player[];
  bench: Player[];
}