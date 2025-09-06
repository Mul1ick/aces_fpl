import React, { createContext, useContext, useState, useEffect } from "react";
import { API } from "../lib/api";

interface User {
  id: string;
  email: string;
  full_name?: string;
  teamName?: string;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingApproval, setPendingApproval] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (token) {
          const storedUser = localStorage.getItem("aces_fpl_user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("aces_fpl_user");
        localStorage.removeItem("access_token");
      } finally {
        setIsLoading(false);
      }
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

      const response = await fetch(API.endpoints.login, {
        method: "POST",
        body: body,
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
      localStorage.setItem("access_token", data.access_token);
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

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    pendingApproval,
    setPendingApproval
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};