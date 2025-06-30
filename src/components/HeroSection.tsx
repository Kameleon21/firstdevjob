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
      <div className="text-center py-8 sm:py-12 px-4 bg-gradient-to-br from-gray-900 via-black to-black rounded-2xl border border-gray-800">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 leading-tight">
          Find Your <span className="text-purple-600">Tech</span> Job in <span className="text-purple-600">Ireland</span>
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4 sm:px-0">
          The job board for students, graduates, and junior developers. Find opportunities and track your applications.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
          <button
            onClick={onPostJobClick}
            className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center font-semibold text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post a Job
          </button>
          {!loading && !isAuthenticated && (
            <button
              onClick={() => console.log('Sign Up to Track Jobs clicked')}
              className="w-full sm:w-auto px-6 py-3 border border-purple-600 text-purple-400 rounded-xl hover:bg-purple-900 transition-colors font-semibold text-sm sm:text-base"
            >
              Sign Up to Track
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 