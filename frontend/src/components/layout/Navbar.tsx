import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import acesLogo from '@/assets/aces-logo.png';
import { API } from '@/lib/api'; // Import the API helper

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // --- ADDED: State to hold the current gameweek number ---
  const [currentGameweek, setCurrentGameweek] = useState<number | null>(null);

  // --- ADDED: useEffect to fetch the current gameweek ---
  useEffect(() => {
    const fetchCurrentGameweek = async () => {
      const token = localStorage.getItem("access_token");
      if (!user?.has_team || !token) {
        // Don't fetch if user has no team or is not logged in
        setCurrentGameweek(1); // Default to 1 for display purposes
        return;
      }
      try {
        const response = await fetch(`${API.BASE_URL}/gameweeks/gameweek/current`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentGameweek(data.gw_number);
        }
      } catch (error) {
        console.error("Failed to fetch current gameweek for navbar:", error);
        setCurrentGameweek(1); // Fallback to 1 on error
      }
    };

    fetchCurrentGameweek();
  }, [user]);

  // --- MODIFIED: Added the new "Points" link ---
  const regularNavLinks = [
    { name: 'Status', path: '/dashboard' },
    { name: 'Points', path: `/gameweek/${currentGameweek || 1}` },
    { name: 'Pick Team', path: '/team' },
    { name: 'Transfers', path: '/transfers' },
    { name: 'Fixtures', path: '/fixtures' },
    { name: 'League', path: '/leaderboard' },
    { name: 'Stats', path: '/stats' },
    { name: 'Help', path: '/help' },
  ];

  // Simplified links for new users
  const newUserNavLinks = [
    { name: 'Select Team', path: '/transfers' },
    { name: 'Help', path: '/help' },
  ];

  const navLinks = user?.has_team ? regularNavLinks : newUserNavLinks;

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const activeLinkStyle = {
    color: '#00FFCC',
    fontWeight: 'bold',
  };

  return (
    <>
      <nav className="navbar">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            {/* Left Side: Logo and Brand Name */}
            <NavLink to="/dashboard" className="flex items-center space-x-3">
              <img src={acesLogo} alt="Aces Logo" className="h-8 w-auto" />
              <span className="hidden md:block font-brand text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-accent-purple">
                Fantasy
              </span>
            </NavLink>

            {/* Right Side: Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  style={({ isActive }) => (isActive ? activeLinkStyle : {})}
                  className="text-sm font-semibold text-text-white/80 hover:text-accent-teal transition-colors"
                >
                  {link.name}
                </NavLink>
              ))}
              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="text-sm font-semibold text-text-white/80 hover:text-accent-teal transition-colors"
              >
                Sign Out
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(true)}>
                <Menu className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 h-screen bg-black/80 backdrop-blur-sm md:hidden"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed top-0 right-0 z-50 h-full w-full max-w-xs bg-black"
            >
                <div className="flex justify-between items-center h-16 px-4 sm:px-6 border-b border-gray-800">
                    <NavLink to="/dashboard" className="flex items-center space-x-3" onClick={() => setIsMenuOpen(false)}>
                        <img src={acesLogo} alt="Aces Logo" className="h-8 w-auto" />
                    </NavLink>
                  <button onClick={() => setIsMenuOpen(false)}>
                        <X className="h-6 w-6 text-white" />
                    </button>
                </div>
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.name}
                      to={link.path}
                      style={({ isActive }) => (isActive ? activeLinkStyle : {})}
                      className="block px-3 py-2 rounded-md text-base font-medium text-text-white/80 hover:text-accent-teal hover:bg-gray-900"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.name}
                    </NavLink>
                  ))}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-text-white/80 hover:text-accent-teal hover:bg-gray-900"
                  >
                    Sign Out
                  </button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;