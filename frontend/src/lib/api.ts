const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API = {
  BASE_URL: API_BASE_URL,
  endpoints: {
    login: `${API_BASE_URL}/auth/login`,
    signup: `${API_BASE_URL}/auth/signup`,
    // Add more as needed
    team: `${API_BASE_URL}/teams/team`,
    saveTeam: `${API_BASE_URL}/teams/save-team`,
    submitTeam: `${API_BASE_URL}/teams/submit-team`,
    gameweek: `${API_BASE_URL}/gameweeks`,
    leaderboard: `${API_BASE_URL}/leaderboard/`,
    chips: {
      status: (gw?: number) =>
        gw
          ? `${API_BASE_URL}/chips/status?gameweek_id=${gw}`
          : `${API_BASE_URL}/chips/status`,
      play: `${API_BASE_URL}/chips/play`,
      cancel: (gw?: number) =>
        gw
          ? `${API_BASE_URL}/chips/cancel?gameweek_id=${gw}`
          : `${API_BASE_URL}/chips/cancel`,
    },
    fixtures: `${API_BASE_URL}/fixtures`,
    transferStats: `${API_BASE_URL}/transfers/stats`,
  },
};

export type ChipName = "TRIPLE_CAPTAIN" | "WILDCARD";
export type ChipStatus = { active: ChipName | null; used: ChipName[] };
async function apiFetch(url: string, init: RequestInit, token: string) {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  if (!res.ok)
    throw new Error((await res.json()).detail || `HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}

export async function getChipStatus(
  token: string,
  gw?: number
): Promise<ChipStatus> {
  return apiFetch(API.endpoints.chips.status(gw), { method: "GET" }, token);
}
export async function playChip(token: string, chip: ChipName, gw?: number) {
  return apiFetch(
    API.endpoints.chips.play,
    { method: "POST", body: JSON.stringify({ chip, gameweek_id: gw ?? null }) },
    token
  );
}
export async function cancelChip(token: string, gw?: number) {
  return apiFetch(API.endpoints.chips.cancel(gw), { method: "DELETE" }, token);
}
