// src/types.ts

export interface Team {
  id: number;
  name: string;
  short_name: string;
}

export interface Player {
  id: number;
  full_name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  price: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  is_benched:boolean;
  team: Team;
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
  // --- MODIFIED: These fields now expect an object instead of a string ---
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