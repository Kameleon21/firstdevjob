'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, Plus, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import AuthModal from './AuthModal';
import NotificationBadge from './NotificationBadge';

interface HeaderProps {
  onPostJobClick?: () => void
}

const Header: React.FC<HeaderProps> = ({ onPostJobClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, isAuthenticated, loading } = useAuth();
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Refresh the page to update the auth state
    window.location.href = '/';
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold text-purple-400 hover:text-purple-300 transition-colors"
            >
              FirstDevJob
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                pathname === '/' 
                  ? 'bg-purple-900 text-purple-300' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Home size={20} className="mr-2" />
              Jobs
            </Link>

            {!loading && isAuthenticated && (
              <NotificationBadge>
                <Link
                  href="/dashboard"
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    pathname === '/dashboard' 
                      ? 'bg-purple-900 text-purple-300' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <BarChart3 size={20} className="mr-2" />
                  Dashboard
                </Link>
              </NotificationBadge>
            )}

            <button
              onClick={onPostJobClick}
              className="flex items-center px-3 py-2 text-gray-300 hover:text-white rounded-lg transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Post Job
            </button>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="hidden md:block w-20 h-10 bg-gray-800 rounded-lg animate-pulse"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block">
                  <span className="text-sm text-gray-400">Welcome, </span>
                  <span className="text-sm font-medium text-white">
                    {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="hidden md:inline-flex px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900">
          <nav className="px-4 py-4 space-y-2">
            <Link
              href="/"
              onClick={toggleMobileMenu}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                pathname === '/' 
                  ? 'bg-purple-900 text-purple-300' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Home size={20} className="mr-3" />
              Jobs
            </Link>

            {!loading && isAuthenticated && (
              <NotificationBadge>
                <Link
                  href="/dashboard"
                  onClick={toggleMobileMenu}
                  className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                    pathname === '/dashboard' 
                      ? 'bg-purple-900 text-purple-300' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <BarChart3 size={20} className="mr-3" />
                  Dashboard
                </Link>
              </NotificationBadge>
            )}

            <button
              onClick={() => {
                onPostJobClick?.();
                toggleMobileMenu();
              }}
              className="flex items-center w-full px-3 py-2 text-gray-300 rounded-lg transition-colors hover:text-white"
            >
              <Plus size={20} className="mr-3" />
              Post Job
            </button>

            {loading ? (
              <div className="w-full h-12 bg-gray-800 rounded-lg animate-pulse"></div>
            ) : !isAuthenticated ? (
              <button
                onClick={() => {
                  setAuthModalOpen(true);
                  toggleMobileMenu();
                }}
                className="flex items-center w-full px-3 py-2 text-gray-300 rounded-lg transition-colors hover:text-white"
              >
                <User size={20} className="mr-3" />
                Sign In
              </button>
            ) : (
              <button
                onClick={() => {
                  handleSignOut();
                  toggleMobileMenu();
                }}
                className="flex items-center w-full px-3 py-2 text-gray-300 rounded-lg transition-colors hover:text-white"
              >
                <LogOut size={20} className="mr-3" />
                Sign Out
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
    </header>
  );
};

export default Header; 