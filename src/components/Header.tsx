'use client'

import React, { useState } from 'react';
import { Home, BarChart3, Plus, Menu, X, User } from 'lucide-react';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => console.log('Navigate to home')}
              className="text-2xl font-bold text-purple-400 hover:text-purple-300 transition-colors"
            >
              FirstDevJob
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => console.log('Navigate to jobs')}
              className="flex items-center px-3 py-2 rounded-lg transition-colors bg-purple-900 text-purple-300"
            >
              <Home size={20} className="mr-2" />
              Jobs
            </button>

            <button
              onClick={() => console.log('Show post job form')}
              className="flex items-center px-3 py-2 text-gray-300 hover:text-white rounded-lg transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Post Job
            </button>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => console.log('Show sign in modal')}
              className="hidden md:inline-flex px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Sign In
            </button>

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
            <button
              onClick={() => {
                console.log('Navigate to jobs');
                toggleMobileMenu();
              }}
              className="flex items-center w-full px-3 py-2 rounded-lg transition-colors bg-purple-900 text-purple-300"
            >
              <Home size={20} className="mr-3" />
              Jobs
            </button>

            <button
              onClick={() => {
                console.log('Navigate to dashboard');
                toggleMobileMenu();
              }}
              className="flex items-center w-full px-3 py-2 rounded-lg transition-colors text-gray-300 hover:text-white"
            >
              <BarChart3 size={20} className="mr-3" />
              Dashboard
            </button>

            <button
              onClick={() => {
                console.log('Show post job form');
                toggleMobileMenu();
              }}
              className="flex items-center w-full px-3 py-2 text-gray-300 rounded-lg transition-colors hover:text-white"
            >
              <Plus size={20} className="mr-3" />
              Post Job
            </button>

            <button
              onClick={() => {
                console.log('Show sign in modal');
                toggleMobileMenu();
              }}
              className="flex items-center w-full px-3 py-2 text-gray-300 rounded-lg transition-colors hover:text-white"
            >
              <User size={20} className="mr-3" />
              Sign In
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header; 