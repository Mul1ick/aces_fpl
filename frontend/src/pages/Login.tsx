import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PillToggle } from "@/components/ui/pill-toggle";
import acesLogo from "@/assets/aces-logo-black.png";
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { API } from "@/lib/api";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, pendingApproval, setPendingApproval, refreshUserStatus } = useAuth();
  
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API.BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
            setPendingApproval(true);
            return;
        }
        throw new Error(data.detail || 'Google Sign-In failed.');
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("aces_fpl_user", JSON.stringify(data.user));
      
      await refreshUserStatus();
      navigate("/dashboard");

    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (pendingApproval) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="text-center border-gray-200 shadow-lg">
            <CardHeader>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 24 }}
                className="size-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Mail className="size-8" />
              </motion.div>
              <CardTitle>Account Pending Approval</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Your registration was successful! Your account will be usable once an administrator has approved it.
              </p>
              <Button variant="outline" onClick={() => setPendingApproval(false)}>
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <img src={acesLogo} alt="Aces FPL Logo" className="w-64 sm:w-80 h-auto mx-auto mb-8" />
        
        <Card className="shadow-lg border-gray-200">
          <CardHeader className="text-center space-y-2 pt-8">
            <div className="flex justify-center mb-6">
              <PillToggle
                options={[
                  { value: "login", label: "Login" },
                  { value: "signup", label: "Sign Up" },
                ]}
                value={authMode}
                onValueChange={(value) => setAuthMode(value as "login" | "signup")}
              />
            </div>
            
            <CardTitle className="text-2xl font-bold">
              {authMode === 'login' ? 'Welcome Back!' : 'Create Your Account'}
            </CardTitle>
            <CardDescription className="text-gray-700 font-medium px-4 !mt-4">
              {authMode === 'login'
                ? "Sign in with your Google account to manage your team."
                : "Join the league by signing up with Google. Once you register, an admin will review your request. You'll be able to log in as soon as it's approved!"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center space-y-4 pb-10 pt-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError('Google login failed. Please try again.');
              }}
              theme="filled_black"
              shape="pill"
              width="300px"
              // --- MODIFICATION: Dynamically change button text ---
              text={authMode === 'signup' ? 'signup_with' : 'signin_with'}
            />

            {error && 
              <div className="text-center p-2 bg-red-100 text-red-700 rounded-lg max-w-xs">
                <p className="text-sm font-semibold">{error}</p>
              </div>
            }
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;