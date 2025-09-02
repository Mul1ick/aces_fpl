import React, { createContext, useContext, useState, useEffect } from "react";
import { API } from "../lib/api";

interface User {
  id: string;
  email: string;
  full_name?: string; // Align with backend schema
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingApproval, setPendingApproval] = useState(false);

  useEffect(() => {
    // --- UPDATED --- Check for token first, then fetch user data
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (token) {
          // You should have a /users/me endpoint to verify the token and get user data
          // For now, we'll rely on the stored user, but a "me" endpoint is best practice.
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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setPendingApproval(false); // Reset pending approval state on new login attempt

      // --- UPDATED --- Switched to URLSearchParams to send as form data
      const body = new URLSearchParams();
      body.append('username', email); // FastAPI's form expects 'username'
      body.append('password', password);

      const response = await fetch(API.endpoints.login, {
        method: "POST",
        // Headers are set automatically by the browser for URLSearchParams
        body: body,
      });

      if (response.status === 403) {
        setPendingApproval(true);
        return false;
      }

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();

      // --- UPDATED --- Use the user object directly from the API response
      const loggedInUser: User = data.user; 
      
      localStorage.setItem("access_token", data.access_token);
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

  const signup = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await fetch(API.endpoints.signup, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, full_name: name }), // Add full_name
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
    localStorage.removeItem("access_token"); // Also remove the token
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    pendingApproval,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
