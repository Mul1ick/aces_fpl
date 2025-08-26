import React, { createContext, useContext, useState, useEffect } from "react";
import { API } from "../lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  teamName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  pendingApproval: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingApproval, setPendingApproval] = useState(false);

  useEffect(() => {
    // Check for existing session on app load
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem("aces_fpl_user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("aces_fpl_user");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
  try {
    setIsLoading(true);

    const response = await fetch(API.endpoints.login, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.status === 403) {
      setPendingApproval(true);
      return false;
    }

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const data = await response.json();

    const loggedInUser: User = {
      id: data.id ?? "unknown", // expects `id` in backend response
      email: data.email ?? email,
      name: data.name ?? "User", // optional
      teamName: data.teamName ?? "",
    };

    setUser(loggedInUser);
    localStorage.setItem("aces_fpl_user", JSON.stringify(loggedInUser));
    return true;
  } catch (error) {
    console.error("Login failed:", error);
    return false;
  } finally {
    setIsLoading(false);
  }
};

const signup = async (name: string, email: string, password: string): Promise<boolean> => {
  try {
    setIsLoading(true);

    const response = await fetch(API.endpoints.signup, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      // Add `name` to backend schema later if needed
    });

    if (response.ok) {
      setPendingApproval(true);
      return true;
    } else {
      throw new Error("Signup failed");
    }
  } catch (error) {
    console.error("Signup failed:", error);
    return false;
  } finally {
    setIsLoading(false);
  }
};
  const logout = () => {
    setUser(null);
    setPendingApproval(false);
    localStorage.removeItem("aces_fpl_user");
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    pendingApproval
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};