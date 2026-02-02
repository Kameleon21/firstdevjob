'use client'
import { useState } from 'react'
import { Check, X, ExternalLink, Calendar, Building2, MapPin, Tag, Trash2, Clock } from 'lucide-react'
import { useMutation } from 'convex/react'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'

interface AdminJob {
  id: Id<'jobs'>
  createdAt: number
  title: string
  company: string
  location: string
  url: string
  status: 'pending' | 'approved' | 'rejected' | 'outdated'
  tags: string[]
}

interface AdminJobCardProps {
  job: AdminJob
  mode?: 'pending' | 'approved'
}

export default function AdminJobCard({ job, mode = 'pending' }: AdminJobCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const updateJobStatus = useMutation(api.admin.updateJobStatus)
  const deleteJob = useMutation(api.admin.deleteJob)
  const markJobOutdated = useMutation(api.admin.markJobOutdated)

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    setIsLoading(true)
    try {
      await updateJobStatus({ jobId: job.id, status })
    } catch (error) {
      console.error('Error updating job status:', error)
      alert('Failed to update job status. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job? This will also remove all user bookmarks for this job.')) {
      return
    }
    setIsLoading(true)
    try {
      await deleteJob({ jobId: job.id })
    } catch (error) {
      console.error('Error deleting job:', error)
      alert('Failed to delete job. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkOutdated = async () => {
    setIsLoading(true)
    try {
      await markJobOutdated({ jobId: job.id })
    } catch (error) {
      console.error('Error marking job as outdated:', error)
      alert('Failed to mark job as outdated. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background border border-border rounded-xl p-6 shadow-lg">
      {/* Header with status indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {mode === 'pending' ? (
            <span className="px-2 py-1 bg-warning-background text-warning text-xs font-medium rounded-full border border-warning">
              Pending Review
            </span>
          ) : (
            <span className="px-2 py-1 bg-success/20 text-success text-xs font-medium rounded-full border border-success">
              Approved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar size={12} />
          <span>
            {new Date(job.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Job Title */}
      <h3 className="text-xl font-semibold text-foreground mb-4">
        {job.title}
      </h3>

      {/* Company */}
      <div className="flex items-center gap-3 mb-3">
        <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-muted-foreground font-medium">{job.company}</span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-muted-foreground">{job.location}</span>
      </div>

      {/* Tags */}
      {job.tags && job.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Technologies</span>
          </div>
          <div className="flex flex-wrap gap-2">
          {job.tags.map((tag) => (
            <span
              key={tag}
              className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium border border-primary"
            >
              {tag}
            </span>
          ))}
          </div>
        </div>
      )}

      {/* Job URL */}
      <div className="mb-6">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-accent hover:opacity-80 transition-colors text-sm"
        >
          <ExternalLink size={14} />
          View Original Posting
        </a>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-border">
        {mode === 'pending' ? (
          <>
            <button
              onClick={() => handleStatusUpdate('approved')}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={16} />
              {isLoading ? 'Processing...' : 'Approve'}
            </button>
            <button
              onClick={() => handleStatusUpdate('rejected')}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-error text-error-foreground rounded-lg hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={16} />
              {isLoading ? 'Processing...' : 'Reject'}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleMarkOutdated}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-warning text-warning-foreground rounded-lg hover:bg-warning/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock size={16} />
              {isLoading ? 'Processing...' : 'Mark Outdated'}
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-error text-error-foreground rounded-lg hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} />
              {isLoading ? 'Processing...' : 'Delete'}
            </button>
          </>
        )}
      </div>

      {/* Admin Note */}
      <p className="mt-3 text-xs text-muted-foreground/80 text-center">
        {mode === 'pending'
          ? 'Approved jobs will be published immediately. Rejected jobs will be permanently hidden.'
          : 'Outdated jobs will be hidden from users. Deleted jobs are permanently removed.'}
      </p>
    </div>
  )
} 
