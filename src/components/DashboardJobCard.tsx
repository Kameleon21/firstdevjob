'use client'

import { useState } from 'react'
import { updateBookmarkStatus } from '@/app/actions/bookmarks'
import { ChevronDown, ExternalLink, Edit3, Save, X } from 'lucide-react'

interface Job {
  id: number
  title: string
  company: string
  location: string
  url: string
  created_at: string
  tags: { id: number; name: string }[]
}

interface Bookmark {
  id: number
  status: string
  notes: string | null
  job: Job
}

interface DashboardJobCardProps {
  bookmark: Bookmark
}

const statusOptions = [
  { value: 'saved', label: 'Saved', color: 'bg-gray-700 text-gray-300' },
  { value: 'applied', label: 'Applied', color: 'bg-blue-700 text-blue-300' },
  { value: 'interviewing', label: 'Interviewing', color: 'bg-yellow-700 text-yellow-300' },
  { value: 'offer', label: 'Offer', color: 'bg-green-700 text-green-300' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-700 text-red-300' },
  { value: 'accepted', label: 'Accepted', color: 'bg-purple-700 text-purple-300' }
]

export default function DashboardJobCard({ bookmark }: DashboardJobCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState(bookmark.notes || '')
  const [currentStatus, setCurrentStatus] = useState(bookmark.status)

  const currentStatusOption = statusOptions.find(option => option.value === currentStatus)

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      await updateBookmarkStatus(bookmark.id, newStatus)
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
      await updateBookmarkStatus(bookmark.id, currentStatus, notes)
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

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
      {/* Header with title and status */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-white pr-4 flex-1">
          {bookmark.job.title}
        </h3>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isUpdating}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              currentStatusOption?.color || 'bg-gray-700 text-gray-300'
            } border-gray-600 hover:border-gray-500 disabled:opacity-50`}
          >
            {currentStatusOption?.label || 'Unknown'}
            <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-10">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusUpdate(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    option.value === currentStatus ? 'bg-gray-700' : ''
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
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-gray-300 font-medium">{bookmark.job.company}</span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-gray-300">{bookmark.job.location}</span>
      </div>

      {/* Date */}
      <div className="flex items-center gap-3 mb-4">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-gray-300 text-sm">
          Posted {new Date(bookmark.job.created_at).toLocaleDateString('en-US', { 
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
              key={tag.id}
              className="bg-purple-900 text-purple-300 px-2 py-1 rounded text-xs font-medium border border-purple-700"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Notes Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-300">Notes</h4>
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-gray-400 hover:text-white transition-colors p-1"
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
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleNotesUpdate}
                disabled={isUpdating}
                className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Save size={14} />
                Save
              </button>
              <button
                onClick={cancelNotesEdit}
                disabled={isUpdating}
                className="flex items-center gap-1 px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-400 min-h-[2rem] p-2 bg-gray-800 rounded border border-gray-700">
            {notes || 'No notes added yet. Click the edit icon to add notes.'}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="flex justify-between items-center pt-2">
        <a
          href={bookmark.job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm"
        >
          <ExternalLink size={16} />
          View Job Posting
        </a>
      </div>
    </div>
  )
} 