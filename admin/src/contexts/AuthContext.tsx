import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
const API = import.meta.env.VITE_API_BASE_URL;
const LOGIN_URL = `${API}/auth/login`;

interface User {
  id: string;
  email: string;
  full_name?: string;
  teamName?: string;
  has_team?: boolean;
  role: string;
  is_active: boolean;
}

interface AuthResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  pendingApproval: boolean;
  setPendingApproval: (isPending: boolean) => void;
  refreshUserStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingApproval, setPendingApproval] = useState(false);
  
  const fetchAndSetUser = async (token: string) => {
    try {
        const response = await fetch(`${API.BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Token invalid");
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem("aces_fpl_user", JSON.stringify(userData));
    } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("aces_fpl_user");
        localStorage.removeItem("access_token");
        setUser(null);
    }
  };

  useEffect(() => {
  let cancelled = false;
  (async () => {
    try {
      const t = localStorage.getItem("admin_token");
      if (!t) return; // no session
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) {
        localStorage.removeItem("admin_token");
        return;
      }
      const u = await res.json();
      // hard guard: admin + active
      if (u.role !== "admin" || !u.is_active) {
        localStorage.removeItem("admin_token");
        return;
      }
      if (!cancelled) setUser(u);
    } catch {
      localStorage.removeItem("admin_token");
    } finally {
      if (!cancelled) setIsLoading(false);   // ← NEVER forget this
    }
  })();
  return () => { cancelled = true; };
}, []);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("access_token");
      if (token) {
        await fetchAndSetUser(token);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    setPendingApproval(false);
    try {
      const body = new URLSearchParams();
      body.append('username', email);
      body.append('password', password);

      const response = await fetch(LOGIN_URL, {
    method: "POST",
   headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
});

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setPendingApproval(true);
          return { success: false, message: data.detail || "Account pending approval." };
        }
        throw new Error(data.detail || "Login failed");
      }

      const loggedInUser: User = data.user;

    // ✅ CHANGE: store token under the key your admin app actually uses
    // (most of your admin code reads 'admin_token'; switch to that)
    localStorage.setItem("admin_token", data.access_token); // <-- CHANGE

    // ✅ CHANGE: hard-guard admin-only access & active status
    if (loggedInUser.role !== "admin" || !loggedInUser.is_active) {        // <-- CHANGE
      localStorage.removeItem("admin_token");                               // <-- CHANGE
      return { success: false, message: "Not authorized for admin portal." };// <-- CHANGE
    }
      setUser(loggedInUser);
      localStorage.setItem("aces_fpl_user", JSON.stringify(loggedInUser));
      return { success: true };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred." };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string
  ): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const response = await fetch(API.endpoints.signup, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Signup failed");
      }
      
      setPendingApproval(true);
      return { success: true };

    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred." };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setPendingApproval(false);
    localStorage.removeItem("aces_fpl_user");
    localStorage.removeItem("access_token");
  };

  const refreshUserStatus = async () => {
    const token = localStorage.getItem("access_token");
    if (token) {
        await fetchAndSetUser(token);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    pendingApproval,
    setPendingApproval,
    refreshUserStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};