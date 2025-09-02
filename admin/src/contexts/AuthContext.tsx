import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';
import type { AuthContextType, User } from '@/types';
import { useToast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('admin_token');
    if (storedToken) {
      setToken(storedToken);
      // Verify token and get user data
      authAPI.getCurrentUser(storedToken)
        .then((userData) => {
          if (userData.role !== 'admin') {
            throw new Error('Insufficient permissions');
          }
          setUser(userData);
        })
        .catch(() => {
          // Token is invalid or user is not admin
          localStorage.removeItem('admin_token');
          setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(email, password);
      
      // Check if user is admin
      if (response.user.role !== 'admin') {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have admin permissions to access this portal.",
        });
        return false;
      }

      const accessToken = response.access_token;
      setToken(accessToken);
      setUser(response.user);
      localStorage.setItem('admin_token', accessToken);

      toast({
        title: "Login Successful",
        description: `Welcome back, ${response.user.full_name}!`,
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('admin_token');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}