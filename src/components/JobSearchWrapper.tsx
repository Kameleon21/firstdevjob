'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import JobSearch from './JobSearch'
import JobCard from './JobCard'
import { searchJobs } from '@/app/actions/search'

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

interface JobSearchWrapperProps {
  initialJobs: Job[]
  allTags: string[]
}

export default function JobSearchWrapper({ initialJobs, allTags }: JobSearchWrapperProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Debounce search query for better performance
  const DEBOUNCE_DELAY_MS = 300;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, DEBOUNCE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Create dynamic SWR key based on search parameters
  const swrKey = ['jobs', debouncedSearchQuery, selectedTags.sort().join(',')]

  // Use SWR to fetch jobs with server-side filtering
  const { data: jobs, error, isLoading, isValidating } = useSWR(
    swrKey,
    async () => await searchJobs(debouncedSearchQuery, selectedTags),
    {
      fallbackData: initialJobs, // Use initial jobs as fallback
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true, // Keep previous data visible while fetching new data
    }
  )

  // Use SWR data if available, otherwise fall back to initial jobs
  const filteredJobs = jobs || initialJobs

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
  }

  const hasActiveFilters = searchQuery.trim() !== '' || selectedTags.length > 0
  const isSearching = searchQuery !== debouncedSearchQuery || isValidating

  return (
    <div className="space-y-12">
      <JobSearch
        searchQuery={searchQuery}
        selectedTags={selectedTags}
        allTags={allTags}
        onSearchChange={handleSearchChange}
        onTagToggle={handleTagToggle}
        onClearFilters={handleClearFilters}
      />

      {/* Results */}
      <div className="relative">
        {/* Subtle loading indicator for search */}
        {(isSearching || isLoading) && (
          <div className="absolute top-0 right-0 z-10">
            <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isLoading ? 'Loading...' : 'Searching...'}
            </div>
          </div>
        )}

        {/* Job Count and Filter Status */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold text-white">
                {hasActiveFilters ? 'Search Results' : 'Latest Jobs'}
              </h2>
              <span className="px-3 py-1 bg-purple-900 text-purple-300 rounded-full text-sm">
                {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="bg-red-900 border border-red-700 rounded-2xl shadow-xl p-12 max-w-md mx-auto">
              <div className="mb-6">
                <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.665-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                Search Error
              </h3>
              <p className="text-gray-400 text-base mb-6">
                Unable to search jobs. Please try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Jobs Grid */}
        {!error && filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-12 max-w-md mx-auto">
              <div className="mb-6">
                <svg className="w-16 h-16 text-purple-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                {hasActiveFilters ? 'No jobs found' : 'No jobs available'}
              </h3>
              <p className="text-gray-400 text-base mb-6">
                {hasActiveFilters 
                  ? 'Try adjusting your search terms or selected tags to find more opportunities.'
                  : 'There are currently no approved jobs available. Check back later for new opportunities!'
                }
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="inline-flex px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredJobs.map((job) => (
              <JobCard 
                key={job.id} 
                job={job} 
                searchQuery={debouncedSearchQuery}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 