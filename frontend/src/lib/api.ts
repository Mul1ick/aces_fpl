const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API = {
  BASE_URL: API_BASE_URL,
  endpoints: {
    login: `${API_BASE_URL}/auth/login`,
    signup: `${API_BASE_URL}/auth/signup`,
    approveUser: (userId: number) => `${API_BASE_URL}/users/approve/${userId}`,
    // Add more as needed
    team: `${API_BASE_URL}/teams`,
    gameweek: `${API_BASE_URL}/gameweeks`,
  },
};