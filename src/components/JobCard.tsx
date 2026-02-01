'use client'

import { useState } from 'react'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { useRouter } from 'next/navigation'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'
import { highlightText } from '@/lib/textHighlight'

interface Job {
  _id: Id<'jobs'>;
  _creationTime: number;
  title: string;
  company: string;
  location?: string;
  url?: string;
  status: 'pending' | 'approved' | 'rejected';
  tags?: string[];
}

interface JobCardProps {
  job: Job;
  searchQuery?: string;
}

export default function JobCard({ job, searchQuery = '' }: JobCardProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const bookmarkStatus = useQuery(
    api.bookmarks.getBookmarkStatus,
    isAuthenticated ? { jobId: job._id } : 'skip'
  )
  const toggleBookmark = useMutation(api.bookmarks.toggleBookmark)
  const [isToggling, setIsToggling] = useState(false)
  const jobTags = job.tags ?? []
  const jobLocation = job.location ?? ''
  const jobUrl = job.url ?? '#'
  const isBookmarked = bookmarkStatus?.bookmarked ?? false

  return (
    <div className="bg-background border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-primary">
      {/* Header with title and bookmark */}
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-xl font-semibold text-foreground pr-4">
          {highlightText(job.title, searchQuery, '', 'var(--highlight-background)', 'var(--highlight-foreground)')}
        </h3>
        <button
          type="button"
          disabled={isLoading || isToggling}
          onClick={async () => {
            if (!isAuthenticated) {
              router.push('/auth/login?message=Please sign in to bookmark jobs')
              return
            }

            setIsToggling(true)
            try {
              await toggleBookmark({ jobId: job._id })
            } catch (error) {
              console.error('Error toggling bookmark:', error)
            } finally {
              setIsToggling(false)
            }
          }}
          className={`transition-colors ${
            isBookmarked ? 'text-accent' : 'text-muted-foreground'
          } ${isLoading || isToggling ? 'opacity-50 cursor-not-allowed' : 'hover:text-accent'}`}
          title={isBookmarked ? 'Remove bookmark' : 'Save job'}
        >
          <svg
            className="w-5 h-5"
            fill={isBookmarked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>
      
      {/* Company with building icon */}
      <div className="flex items-center gap-3 mb-4">
        <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-muted-foreground font-medium">
          {highlightText(job.company, searchQuery, '', 'var(--highlight-background)', 'var(--highlight-foreground)')}
        </span>
      </div>

      {/* Location with location icon */}
      <div className="flex items-center gap-3 mb-4">
        <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-muted-foreground">
          {highlightText(jobLocation, searchQuery, '', 'var(--highlight-background)', 'var(--highlight-foreground)')}
        </span>
      </div>

      {/* Date with calendar icon */}
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-muted-foreground">
          {new Date(job._creationTime).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </span>
      </div>

      {/* Tags */}
      {jobTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {jobTags.map((tag) => (
            <span
              key={tag}
              className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium border border-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {/* Apply button */}
      <div className="pt-2 flex justify-start">
        <a
          href={jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200 inline-block text-center"
        >
          Apply Now
        </a>
      </div>
    </div>
  );
}
