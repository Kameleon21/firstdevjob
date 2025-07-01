'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { toggleBookmark, getBookmarkStatus } from '@/app/actions/bookmarks'
import AuthModal from './AuthModal'
import { highlightText } from '@/lib/textHighlight'

interface Job {
  id: number;
  created_at: string;
  title: string;
  company: string;
  location: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  tags: { id: number; name: string }[];
}

interface JobCardProps {
  job: Job;
  searchQuery?: string;
}

export default function JobCard({ job, searchQuery = '' }: JobCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { isAuthenticated, loading: authLoading } = useAuth()

  // Check bookmark status on mount and when auth state changes
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const checkBookmarkStatus = async () => {
        try {
          const { bookmarked } = await getBookmarkStatus(job.id)
          setIsBookmarked(bookmarked)
        } catch (error) {
          console.error('Error checking bookmark status:', error)
        }
      }
      checkBookmarkStatus()
    } else if (!authLoading && !isAuthenticated) {
      setIsBookmarked(false)
    }
  }, [job.id, isAuthenticated, authLoading])

  const handleBookmarkClick = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    setIsLoading(true)
    try {
      const result = await toggleBookmark(job.id)
      setIsBookmarked(result.bookmarked)
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      alert('Failed to update bookmark. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-purple-600">
      {/* Header with title and bookmark */}
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-xl font-semibold text-white pr-4">
          {highlightText(job.title, searchQuery, '', 'rgba(255, 235, 59, 0.3)', '#1f2937')}
        </h3>
        <button 
          onClick={handleBookmarkClick}
          disabled={isLoading || authLoading}
          className={`transition-colors duration-200 ${
            isLoading || authLoading 
              ? 'text-gray-500 cursor-not-allowed' 
              : isBookmarked 
                ? 'text-yellow-400 hover:text-yellow-300' 
                : 'text-gray-400 hover:text-white'
          }`}
          title={isAuthenticated ? (isBookmarked ? 'Remove bookmark' : 'Bookmark job') : 'Sign in to bookmark'}
        >
          <svg className="w-5 h-5" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>
      
      {/* Company with building icon */}
      <div className="flex items-center gap-3 mb-4">
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-gray-300 font-medium">
          {highlightText(job.company, searchQuery, '', 'rgba(255, 235, 59, 0.3)', '#1f2937')}
        </span>
      </div>

      {/* Location with location icon */}
      <div className="flex items-center gap-3 mb-4">
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-gray-300">
          {highlightText(job.location, searchQuery, '', 'rgba(255, 235, 59, 0.3)', '#1f2937')}
        </span>
      </div>

      {/* Date with calendar icon */}
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-gray-300">
          {new Date(job.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </span>
      </div>

      {/* Tags */}
      {job.tags && job.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {job.tags.map((tag) => (
            <span
              key={tag.id}
              className="bg-purple-900 text-purple-300 px-3 py-1 rounded-full text-sm font-medium border border-purple-700"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
      
      {/* Apply button */}
      <div className="pt-2 flex justify-start">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200 inline-block text-center"
        >
          Apply Now
        </a>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
} 