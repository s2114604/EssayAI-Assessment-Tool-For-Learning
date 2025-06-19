import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, User, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    setShowUserMenu(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/dashboard">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  EssayAI
                </h1>
              </Link>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search essays, students..."
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
            </button>

            <div className="relative" ref={userMenuRef}>
              <button 
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button 
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleSettingsClick}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};