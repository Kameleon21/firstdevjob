'use client'

import { useAuth } from '@/hooks/useAuth'

interface HeroSectionProps {
  onPostJobClick: () => void
}

export default function HeroSection({ onPostJobClick }: HeroSectionProps) {
  const { isAuthenticated, loading } = useAuth()
  
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8 sm:py-12 px-4 bg-gradient-to-br from-[var(--hero-gradient-from)] via-[var(--hero-gradient-via)] to-[var(--hero-gradient-to)] rounded-2xl border border-border">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
          Find Your <span className="text-primary">Tech</span> Job in <span className="text-primary">Ireland</span>
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4 sm:px-0">
          The job board for students, graduates, and junior developers. Find opportunities and track your applications.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
          <button
            onClick={onPostJobClick}
            className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-colors flex items-center justify-center font-semibold text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post a Job
          </button>
          {!loading && !isAuthenticated && (
            <button
              onClick={() => console.log('Sign Up to Track Jobs clicked')}
              className="w-full sm:w-auto px-6 py-3 border border-primary text-accent rounded-xl hover:bg-secondary transition-colors font-semibold text-sm sm:text-base"
            >
              Sign Up to Track
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 