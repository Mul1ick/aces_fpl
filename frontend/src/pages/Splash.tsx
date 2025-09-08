import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import acesLogo from "@/assets/aces-logo.png";

const Splash: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2500); // Increased delay slightly for a smoother feel

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pl-purple-900 via-pl-purple to-pl-purple-800 flex items-center justify-center relative overflow-hidden">
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {/* Logo */}
          <motion.img 
            src={acesLogo} 
            alt="Aces FPL Logo" 
            className="w-24 h-auto mx-auto mb-6 drop-shadow-lg"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          />

          {/* Brand Text */}
          <motion.h1
            className="text-5xl md:text-7xl font-brand text-transparent bg-clip-text bg-gradient-to-r from-pl-cyan to-pl-green tracking-wider"
            style={{ filter: 'drop-shadow(0 0 15px hsl(var(--pl-cyan) / 0.4))' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Aces Fantasy League
          </motion.h1>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute -bottom-24 flex items-center space-x-2"
        >
          <div className="flex space-x-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="size-2.5 bg-pl-cyan rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.25,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Splash;
