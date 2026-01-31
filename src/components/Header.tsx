"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BarChart3,
  Plus,
  Menu,
  X,
  User,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "./AuthModal";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "./ThemeProvider";
import { useClerk } from "@clerk/nextjs";

interface HeaderProps {
  onPostJobClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onPostJobClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const { signOut } = useClerk();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    // Refresh the page to update the auth state
    window.location.href = "/";
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold text-accent hover:text-secondary-foreground transition-colors"
            >
              FirstDevJob
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                pathname === "/"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Home size={20} className="mr-2" />
              Jobs
            </Link>

            {!isLoading && isAuthenticated && (
              <Link
                href="/dashboard"
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  pathname === "/dashboard"
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 size={20} className="mr-2" />
                Dashboard
              </Link>
            )}

            <button
              onClick={onPostJobClick}
              className="flex items-center px-3 py-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Post Job
            </button>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="hidden md:block w-20 h-10 bg-muted rounded-lg animate-pulse"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block">
                  <span className="text-sm text-muted-foreground">
                    Welcome,{" "}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {user?.profile?.fullName || user?.email?.split("@")[0]}
                  </span>
                </div>
                <div className="hidden md:flex items-center space-x-2">
                  <Link
                    href="/profile"
                    className={`p-2 rounded-lg transition-colors ${
                      pathname === "/profile"
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Profile"
                  >
                    <User size={20} />
                  </Link>
                  <ThemeToggle />
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="hidden md:inline-flex px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="py-4 space-y-2">
            <Link
              href="/"
              onClick={toggleMobileMenu}
              className={`flex items-center w-full px-4 py-2 transition-colors ${
                pathname === "/"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Home size={20} className="mr-3" />
              Jobs
            </Link>

            {!isLoading && isAuthenticated && (
              <Link
                href="/dashboard"
                onClick={toggleMobileMenu}
                className={`flex items-center w-full px-4 py-2 transition-colors ${
                  pathname === "/dashboard"
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <BarChart3 size={20} className="mr-3" />
                Dashboard
              </Link>
            )}

            <button
              onClick={() => {
                onPostJobClick?.();
                toggleMobileMenu();
              }}
              className="flex items-center w-full px-4 py-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
            >
              <Plus size={20} className="mr-3" />
              Post Job
            </button>

            {!isLoading && isAuthenticated && (
              <Link
                href="/profile"
                onClick={toggleMobileMenu}
                className={`flex items-center w-full px-4 py-2 transition-colors ${
                  pathname === "/profile"
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <User size={20} className="mr-3" />
                Profile
              </Link>
            )}

            <button
              onClick={() => {
                toggleTheme();
                toggleMobileMenu();
              }}
              className="flex items-center w-full px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <div className="mr-3">
                {/* Show theme icon directly aligned with other icons */}
                <div className="relative">
                  <Sun
                    className={`h-5 w-5 transition-all duration-300 ease-in-out ${
                      theme === "dark"
                        ? "rotate-90 scale-0"
                        : "rotate-0 scale-100"
                    }`}
                  />
                  <Moon
                    className={`absolute top-0 left-0 h-5 w-5 transition-all duration-300 ease-in-out ${
                      theme === "dark"
                        ? "rotate-0 scale-100"
                        : "-rotate-90 scale-0"
                    }`}
                  />
                </div>
              </div>
              <span>Theme</span>
            </button>

            {isLoading ? (
              <div className="mx-4 h-12 bg-muted rounded-lg animate-pulse"></div>
            ) : !isAuthenticated ? (
              <button
                onClick={() => {
                  setAuthModalOpen(true);
                  toggleMobileMenu();
                }}
                className="flex items-center w-full px-4 py-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
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
                className="flex items-center w-full px-4 py-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
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
