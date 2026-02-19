'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'
import { ChevronDown, ExternalLink, Edit3, Save, X, Trash2 } from 'lucide-react'

interface Job {
  id: Id<'jobs'>
  title: string
  company: string
  location: string
  url: string
  createdAt: number
  tags: string[]
  availability: 'active' | 'closed'
  closureReason: 'outdated' | 'removed' | null
}

type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'accepted'

interface Bookmark {
  id: Id<'trackedApplications'>
  status: ApplicationStatus
  notes: string | null
  job: Job
}

interface DashboardJobCardProps {
  bookmark: Bookmark
}

const statusOptions: Array<{ value: ApplicationStatus; label: string; color: string }> = [
  { value: 'saved', label: 'Saved', color: 'bg-muted text-muted-foreground' },
  { value: 'applied', label: 'Applied', color: 'bg-blue-700 text-blue-300' },
  { value: 'interviewing', label: 'Interviewing', color: 'bg-yellow-700 text-yellow-300' },
  { value: 'offer', label: 'Offer', color: 'bg-green-700 text-green-300' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-700 text-red-300' },
  { value: 'accepted', label: 'Accepted', color: 'bg-primary text-primary-foreground' }
]

export default function DashboardJobCard({ bookmark }: DashboardJobCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState(bookmark.notes || '')
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>(bookmark.status)
  const updateBookmarkStatus = useMutation(api.bookmarks.updateBookmarkStatus)
  const removeTrackedApplication = useMutation(api.bookmarks.removeTrackedApplication)

  const currentStatusOption = statusOptions.find(option => option.value === currentStatus)
  const isClosed = bookmark.job.availability === 'closed'

  const handleStatusUpdate = async (newStatus: ApplicationStatus) => {
    setIsUpdating(true)
    try {
      await updateBookmarkStatus({
        bookmarkId: bookmark.id,
        status: newStatus,
      })
      setCurrentStatus(newStatus)
      setShowDropdown(false)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleNotesUpdate = async () => {
    setIsUpdating(true)
    try {
      await updateBookmarkStatus({
        bookmarkId: bookmark.id,
        status: currentStatus,
        notes,
      })
      setIsEditingNotes(false)
    } catch (error) {
      console.error('Error updating notes:', error)
      alert('Failed to update notes. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const cancelNotesEdit = () => {
    setNotes(bookmark.notes || '')
    setIsEditingNotes(false)
  }

  const handleRemoveTrackedApplication = async () => {
    setIsRemoving(true)
    try {
      await removeTrackedApplication({ bookmarkId: bookmark.id })
    } catch (error) {
      console.error('Error removing tracked application:', error)
      alert('Failed to remove tracked application. Please try again.')
    } finally {
      setIsRemoving(false)
    }
  }

  const closureReasonText =
    bookmark.job.closureReason === 'outdated'
      ? 'This posting has closed and is no longer accepting applications.'
      : 'The original posting was removed, but you can keep tracking your progress.'

  return (
    <div className="bg-background border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
      {/* Header with title and status */}
      <div className="flex justify-between items-start mb-4">
        <div className="pr-4 flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {bookmark.job.title}
          </h3>
          {isClosed && (
            <div className="inline-flex flex-col gap-1">
              <span className="inline-flex items-center px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-warning-background text-warning border border-warning">
                Job closed
              </span>
              <p className="text-xs text-muted-foreground break-words">
                {closureReasonText}
              </p>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isUpdating}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              currentStatusOption?.color || 'bg-muted text-muted-foreground'
            } border-border hover:border-primary disabled:opacity-50`}
          >
            {currentStatusOption?.label || 'Unknown'}
            <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-muted border border-border rounded-lg shadow-xl z-10">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusUpdate(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-background/50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    option.value === currentStatus ? 'bg-background/50' : ''
                  }`}
                >
                  <span className={`inline-block w-3 h-3 rounded-full mr-3 ${option.color.split(' ')[0]}`}></span>
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Company and Location */}
      <div className="flex items-center gap-3 mb-3">
        <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-muted-foreground font-medium">{bookmark.job.company}</span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-muted-foreground">{bookmark.job.location}</span>
      </div>

      {/* Date */}
      <div className="flex items-center gap-3 mb-4">
        <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-muted-foreground text-sm">
          Posted {new Date(bookmark.job.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </span>
      </div>

      {/* Tags */}
      {bookmark.job.tags && bookmark.job.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {bookmark.job.tags.map((tag) => (
            <span
              key={tag}
              className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium border border-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Notes Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              title="Edit notes"
            >
              <Edit3 size={14} />
            </button>
          )}
        </div>
        
        {isEditingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes about this job application..."
              className="w-full p-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleNotesUpdate}
                disabled={isUpdating}
                className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                <Save size={14} />
                Save
              </button>
              <button
                onClick={cancelNotesEdit}
                disabled={isUpdating}
                className="flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground rounded text-sm hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setIsEditingNotes(true)}
            className="text-sm text-muted-foreground min-h-[2rem] p-2 bg-muted rounded border border-border cursor-pointer hover:bg-background/50 hover:border-border/80 transition-colors"
            title="Click to edit notes"
          >
            {notes || 'No notes added yet. Click here or the edit icon to add notes.'}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-2">
        {isClosed ? (
          <span className="inline-flex items-center justify-center gap-2 text-muted-foreground text-sm px-3 py-2 border border-border rounded-lg bg-muted/50 cursor-not-allowed w-full sm:w-auto">
            <ExternalLink size={16} />
            Posting no longer available
          </span>
        ) : (
          <a
            href={bookmark.job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-accent hover:opacity-80 transition-colors text-sm px-3 py-2 border border-accent/30 rounded-lg w-full sm:w-auto sm:border-0 sm:px-0 sm:py-0"
          >
            <ExternalLink size={16} />
            View Job Posting
          </a>
        )}
        <button
          type="button"
          onClick={handleRemoveTrackedApplication}
          disabled={isRemoving}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm text-error border border-error/40 rounded-lg hover:bg-error-background/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          <Trash2 size={14} />
          {isRemoving ? 'Removing...' : 'Remove from tracker'}
        </button>
      </div>
    </div>
  )
}
