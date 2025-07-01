'use client'

import { useState, useMemo, useEffect } from 'react'
import JobSearch from './JobSearch'
import JobCard from './JobCard'

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
  const DEBOUNCE_DELAY_MS = 150;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, DEBOUNCE_DELAY_MS) // Shorter debounce for better responsiveness
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Optimized filtering with useMemo
  const filteredJobs = useMemo(() => {
    let filtered = initialJobs

    // Filter by search query (debounced)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      // Pre-compile search terms for better performance
      const searchTerms = query.split(' ').filter(term => term.length > 0)
      
      filtered = filtered.filter(job => {
        const searchableText = `${job.title} ${job.company} ${job.location}`.toLowerCase()
        return searchTerms.every(term => searchableText.includes(term))
      })
    }

    // Filter by selected tags (instant)
    if (selectedTags.length > 0) {
      filtered = filtered.filter(job => 
        job.tags.some(tag => selectedTags.includes(tag.name))
      )
    }

    return filtered
  }, [initialJobs, debouncedSearchQuery, selectedTags])

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
  const isSearching = searchQuery !== debouncedSearchQuery

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
        {isSearching && (
          <div className="absolute top-0 right-0 z-10">
            <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
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

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
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
        ) : (
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