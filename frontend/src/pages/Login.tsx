// import React, { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import { useNavigate } from "react-router-dom";
// import { Mail, Lock, User } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/fpl-button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/fpl-card";
// import { PillToggle } from "@/components/ui/pill-toggle";
// import acesLogo from "@/assets/aces-logo-black.png";
// import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
// import { API } from "@/lib/api";


// const Login: React.FC = () => {
//   const navigate = useNavigate();
//   const { login, signup, isAuthenticated, pendingApproval,refreshUserStatus, setPendingApproval } = useAuth();
//   const [authMode, setAuthMode] = useState<"login" | "signup">("login");
//   const [loading, setLoading] = useState(false);

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const [errors, setErrors] = useState<Record<string, string>>({});

//   useEffect(() => {
//     if (isAuthenticated) {
//       navigate("/dashboard");
//     }
//   }, [isAuthenticated, navigate]);

//   const authOptions = [
//     { value: "login", label: "Login" },
//     { value: "signup", label: "Sign Up" },
//   ];

//   const handleInputChange = (field: string, value: string) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//     if (errors[field] || errors.general) {
//       setErrors(prev => ({ ...prev, [field]: "", general: "" }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors: Record<string, string> = {};

//     if (authMode === "signup" && !formData.name.trim()) newErrors.name = "Name is required";
//     if (!formData.email.trim()) newErrors.email = "Email is required";
//     else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
//     if (!formData.password) newErrors.password = "Password is required";
//     else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
//     if (authMode === "signup" && formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!validateForm()) return;

//     setLoading(true);
//     setErrors({});
    
//     let result;
//     if (authMode === "signup") {
//       result = await signup(formData.name, formData.email, formData.password);
//     } else {
//       result = await login(formData.email, formData.password);
//     }

//     if (result.success) {
//       if (authMode === "login") {
//         navigate("/dashboard");
//       }
//     } else {
//       setErrors({ general: result.message || "An error occurred. Please try again." });
//     }
    
//     setLoading(false);
//   };

//   const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
//     setLoading(true);
//     setErrors({});
    
//     try {
//       const response = await fetch(`${API.BASE_URL}/auth/google`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ credential: credentialResponse.credential }),
//       });
      
//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.detail || 'Google Sign-In failed.');
//       }

//       // If successful, the backend returns our own app's JWT and user data.
//       localStorage.setItem("access_token", data.access_token);
//       localStorage.setItem("aces_fpl_user", JSON.stringify(data.user));
      
//       // Tell the AuthContext to refresh its state from localStorage
//       await refreshUserStatus();

//       navigate("/dashboard");

//     } catch (error) {
//       setErrors({ general: error instanceof Error ? error.message : "An unknown error occurred." });
//     } finally {
//       setLoading(false);
//     }
//   };


//   if (pendingApproval) {
//     return (
//       <div className="min-h-screen bg-pl-purple flex items-center justify-center p-6">
//         <motion.div
//           initial={{ opacity: 0, scale: 0.9 }}
//           animate={{ opacity: 1, scale: 1 }}
//           className="w-full max-w-md"
//         >
//           <Card variant="glass" className="text-center">
//             <CardHeader>
//               <motion.div
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 24 }}
//                 className="size-16 bg-gradient-to-r from-pl-cyan to-pl-green rounded-full flex items-center justify-center mx-auto mb-4"
//               >
//                 <Mail className="size-8 text-pl-purple" />
//               </motion.div>
//               <CardTitle className="text-pl-white">Account Created!</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <p className="text-pl-white/80">
//                 Your account is pending admin approval. You will be able to log in once your account has been activated.
//               </p>
//               <Button variant="hero" onClick={() => setPendingApproval(false)}>
//                 Back to Login
//               </Button>
//             </CardContent>
//           </Card>
//         </motion.div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-pl-purple-900 via-pl-purple to-pl-purple-800 flex flex-col items-center justify-center p-6">
//       <motion.div
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//         className="w-full max-w-md"
//       >
//         <img src={acesLogo} alt="Aces FPL Logo" className="w-36 sm:w-80 h-auto mx-auto mb-8" />
        
//         <Card variant="glass" className="shadow-card">
//           <CardHeader className="text-center">
//             <div className="flex justify-center mb-6">
//               <PillToggle
//                 options={authOptions}
//                 value={authMode}
//                 onValueChange={(value) => {
//                   setAuthMode(value as "login" | "signup");
//                   setErrors({});
//                 }}
//               />
//             </div>
//             <CardTitle className="text-pl-white">
//               {authMode === "login" ? "Welcome Back" : "Join Aces FPL"}
//             </CardTitle>
//           </CardHeader>
          
//           <CardContent>
//             {authMode === 'login' && (
//               <>
//                 <div className="flex justify-center mb-6">
//                   <GoogleLogin
//                     onSuccess={handleGoogleSuccess}
//                     onError={() => {
//                       setErrors({ general: 'Google login failed. Please try again.' });
//                     }}
//                     useOneTap
//                     theme="filled_black"
//                     shape="pill"
//                   />
//                 </div>
//                 <div className="flex items-center my-6">
//                   <div className="flex-grow border-t border-pl-border"></div>
//                   <span className="mx-4 text-caption text-pl-white/60">OR</span>
//                   <div className="flex-grow border-t border-pl-border"></div>
//                 </div>
//               </>
//             )}
//             <form onSubmit={handleSubmit} className="space-y-4">
//               {authMode === "signup" && (
//                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
//                   <div className="space-y-2">
//                     <label className="text-caption text-pl-white/80">Full Name</label>
//                      <div className="relative">
//                        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-pl-white/40" />
//                        <input type="text" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} className="w-full h-12 pl-10 pr-4 glass rounded-xl border border-pl-border text-pl-white placeholder:text-pl-white/40 focus:border-pl-green focus:ring-2 focus:ring-pl-green/20 transition-all" placeholder="Enter your full name" />
//                     </div>
//                     {errors.name && <p className="text-caption text-accent-pink">{errors.name}</p>}
//                   </div>
//                 </motion.div>
//               )}

//               <div className="space-y-2">
//                 <label className="text-caption text-pl-white/80">Email</label>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-pl-white/40" />
//                   <input type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className="w-full h-12 pl-10 pr-4 glass rounded-xl border border-pl-border text-pl-white placeholder:text-pl-white/40 focus:border-pl-green focus:ring-2 focus:ring-pl-green/20 transition-all" placeholder="Enter your email" />
//                 </div>
//                 {errors.email && <p className="text-caption text-accent-pink">{errors.email}</p>}
//               </div>

//               <div className="space-y-2">
//                 <label className="text-caption text-pl-white/80">Password</label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-pl-white/40" />
//                   <input type="password" value={formData.password} onChange={(e) => handleInputChange("password", e.target.value)} className="w-full h-12 pl-10 pr-4 glass rounded-xl border border-pl-border text-pl-white placeholder:text-pl-white/40 focus:border-pl-green focus:ring-2 focus:ring-pl-green/20 transition-all" placeholder="Enter your password" />
//                 </div>
//                 {errors.password && <p className="text-caption text-accent-pink">{errors.password}</p>}
//               </div>

//               {authMode === "signup" && (
//                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
//                   <div className="space-y-2">
//                     <label className="text-caption text-pl-white/80">Confirm Password</label>
//                     <div className="relative">
//                       <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-pl-white/40" />
//                       <input type="password" value={formData.confirmPassword} onChange={(e) => handleInputChange("confirmPassword", e.target.value)} className="w-full h-12 pl-10 pr-4 glass rounded-xl border border-pl-border text-pl-white placeholder:text-pl-white/40 focus:border-pl-green focus:ring-2 focus:ring-pl-green/20 transition-all" placeholder="Confirm your password" />
//                     </div>
//                     {errors.confirmPassword && <p className="text-caption text-accent-pink">{errors.confirmPassword}</p>}
//                   </div>
//                 </motion.div>
//               )}
              
//               {authMode === 'login' && (
//                  <div className="text-center pt-1">
//                    <button
//                      type="button"
//                      onClick={() => alert('Forgot password functionality coming soon!')}
//                      className="text-caption font-semibold text-pl-white/60 transition-colors hover:text-pl-white"
//                    >
//                      Forgot Password?
//                    </button>
//                  </div>
//               )}

//               {errors.general && 
//                 <div className="text-center p-2 bg-accent-pink rounded-xl">
//                     <p className="text-caption text-text-white font-semibold">{errors.general}</p>
//                 </div>
//               }

//               <Button type="submit" variant="hero" size="lg" fullWidth pill loading={loading} className="!mt-8">
//                 {authMode === "login" ? "Sign In" : "Create Account"}
//               </Button>
//             </form>
//           </CardContent>
//         </Card>
//       </motion.div>
//     </div>
//   );
// };

// export default Login;

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/fpl-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/fpl-card";
import { PillToggle } from "@/components/ui/pill-toggle";
import acesLogo from "@/assets/aces-logo-black.png";
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { API } from "@/lib/api";


const Login: React.FC = () => {
  const navigate = useNavigate();
  // Ensure all functions from the context are destructured here
  const { login, signup, isAuthenticated, pendingApproval, setPendingApproval, refreshUserStatus } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const authOptions = [
    { value: "login", label: "Login" },
    { value: "signup", label: "Sign Up" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field] || errors.general) {
      setErrors(prev => ({ ...prev, [field]: "", general: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (authMode === "signup" && !formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (authMode === "signup" && formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    
    let result;
    if (authMode === "signup") {
      result = await signup(formData.name, formData.email, formData.password);
    } else {
      result = await login(formData.email, formData.password);
    }

    if (result.success) {
      if (authMode === "login") {
        navigate("/dashboard");
      }
    } else {
      setErrors({ general: result.message || "An error occurred. Please try again." });
    }
    
    setLoading(false);
  };

  // frontend/src/pages/Login.tsx

const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setLoading(true);
    setErrors({});
    
    try {
      const response = await fetch(`${API.BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        // This is the new, important part!
        // We check if the status is 403, which means "pending approval".
        if (response.status === 403) {
            setPendingApproval(true); // This will show the "pending" screen
            return; // Stop the function here
        }
        throw new Error(data.detail || 'Google Sign-In failed.');
      }

      // This part only runs if the login was fully successful (status 200)
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("aces_fpl_user", JSON.stringify(data.user));
      
      await refreshUserStatus();
      navigate("/dashboard");

    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : "An unknown error occurred." });
    } finally {
      setLoading(false);
    }
  };


  if (pendingApproval) {
    return (
      <div className="min-h-screen bg-pl-purple flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card variant="glass" className="text-center">
            <CardHeader>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 24 }}
                className="size-16 bg-gradient-to-r from-pl-cyan to-pl-green rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Mail className="size-8 text-pl-purple" />
              </motion.div>
              <CardTitle className="text-pl-white">Account Created!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-pl-white/80">
                Your account is pending admin approval. You will be able to log in once your account has been activated.
              </p>
              <Button variant="hero" onClick={() => setPendingApproval(false)}>
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pl-purple-900 via-pl-purple to-pl-purple-800 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <img src={acesLogo} alt="Aces FPL Logo" className="w-36 sm:w-80 h-auto mx-auto mb-8" />
        
        <Card variant="glass" className="shadow-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <PillToggle
                options={authOptions}
                value={authMode}
                onValueChange={(value) => {
                  setAuthMode(value as "login" | "signup");
                  setErrors({});
                }}
              />
            </div>
            <CardTitle className="text-pl-white">
              {authMode === "login" ? "Welcome Back" : "Join Aces FPL"}
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {authMode === 'login' && (
              <>
                <div className="flex justify-center mb-6">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      setErrors({ general: 'Google login failed. Please try again.' });
                    }}
                    useOneTap
                    theme="filled_black"
                    shape="pill"
                  />
                </div>
                <div className="flex items-center my-6">
                  <div className="flex-grow border-t border-pl-border"></div>
                  <span className="mx-4 text-caption text-pl-white/60">OR</span>
                  <div className="flex-grow border-t border-pl-border"></div>
                </div>
              </>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === "signup" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                  <div className="space-y-2">
                    <label className="text-caption text-pl-white/80">Full Name</label>
                     <div className="relative">
                       <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-pl-white/40" />
                       <input type="text" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} className="w-full h-12 pl-10 pr-4 glass rounded-xl border border-pl-border text-pl-white placeholder:text-pl-white/40 focus:border-pl-green focus:ring-2 focus:ring-pl-green/20 transition-all" placeholder="Enter your full name" />
                    </div>
                    {errors.name && <p className="text-caption text-accent-pink">{errors.name}</p>}
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-caption text-pl-white/80">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-pl-white/40" />
                  <input type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className="w-full h-12 pl-10 pr-4 glass rounded-xl border border-pl-border text-pl-white placeholder:text-pl-white/40 focus:border-pl-green focus:ring-2 focus:ring-pl-green/20 transition-all" placeholder="Enter your email" />
                </div>
                {errors.email && <p className="text-caption text-accent-pink">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-caption text-pl-white/80">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-pl-white/40" />
                  <input type="password" value={formData.password} onChange={(e) => handleInputChange("password", e.target.value)} className="w-full h-12 pl-10 pr-4 glass rounded-xl border border-pl-border text-pl-white placeholder:text-pl-white/40 focus:border-pl-green focus:ring-2 focus:ring-pl-green/20 transition-all" placeholder="Enter your password" />
                </div>
                {errors.password && <p className="text-caption text-accent-pink">{errors.password}</p>}
              </div>

              {authMode === "signup" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                  <div className="space-y-2">
                    <label className="text-caption text-pl-white/80">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-pl-white/40" />
                      <input type="password" value={formData.confirmPassword} onChange={(e) => handleInputChange("confirmPassword", e.target.value)} className="w-full h-12 pl-10 pr-4 glass rounded-xl border border-pl-border text-pl-white placeholder:text-pl-white/40 focus:border-pl-green focus:ring-2 focus:ring-pl-green/20 transition-all" placeholder="Confirm your password" />
                    </div>
                    {errors.confirmPassword && <p className="text-caption text-accent-pink">{errors.confirmPassword}</p>}
                  </div>
                </motion.div>
              )}
              
              {authMode === 'login' && (
                 <div className="text-center pt-1">
                   <button
                     type="button"
                     onClick={() => alert('Forgot password functionality coming soon!')}
                     className="text-caption font-semibold text-pl-white/60 transition-colors hover:text-pl-white"
                   >
                     Forgot Password?
                   </button>
                 </div>
              )}

              {errors.general && 
                <div className="text-center p-2 bg-accent-pink rounded-xl">
                    <p className="text-caption text-text-white font-semibold">{errors.general}</p>
                </div>
              }

              <Button type="submit" variant="hero" size="lg" fullWidth pill loading={loading} className="!mt-8">
                {authMode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;