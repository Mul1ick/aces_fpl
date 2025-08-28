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
  team: Team;
}

export interface TeamResponse {
  team_name: string;
  starting: Player[];
  bench: Player[];
}