// File: admin/src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI } from '@/lib/api';
import { User, AuthContextType } from '@/types';
import { useToast } from "@/hooks/use-toast";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const storedToken = localStorage.getItem("admin_token");
      if (storedToken) {
        try {
          const userData = await authAPI.getCurrentUser(storedToken);
          // Ensure the user is an active admin before setting the session
          if (userData.role === 'admin' && userData.is_active) {
            setUser(userData);
            setToken(storedToken);
          } else {
            // If not an active admin, clear the invalid session
            localStorage.removeItem("admin_token");
          }
        } catch (error) {
          console.error("Session check failed:", error);
          localStorage.removeItem("admin_token");
        }
      }
      setIsLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await authAPI.login(email, password);
      
      // Critical check to ensure only active admins can log in
      if (data.user.role !== 'admin' || !data.user.is_active) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to access the admin portal.' });
        return false;
      }
      
      localStorage.setItem("admin_token", data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      toast({ title: "Login Successful" });
      return true;
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Login Failed', description: error.message || 'An unknown error occurred.' });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("admin_token");
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>; // CORRECTED: Closing tag fixed
};