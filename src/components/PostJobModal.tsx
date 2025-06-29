'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X, Briefcase, Building2, MapPin, ExternalLink, Tag, AlertCircle } from 'lucide-react'
import { postJob } from '@/app/actions/jobs'

interface PostJobModalProps {
  isOpen: boolean
  onClose: () => void
  allTags: string[]
  onSuccess: (message: string) => void
}

export default function PostJobModal({ isOpen, onClose, allTags, onSuccess }: PostJobModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    url: '',
    selectedTags: [] as string[]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      company: '',
      location: '',
      url: '',
      selectedTags: []
    })
    setError('')
  }, [])

  // Prevent background scrolling when modal is open and handle escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      
      // Handle escape key press
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          resetForm()
          onClose()
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.body.style.overflow = 'unset'
        document.removeEventListener('keydown', handleEscape)
      }
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, resetForm])

  if (!isOpen) return null

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking on the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('') // Clear error when user starts typing
  }

  const handleTagToggle = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagName)
        ? prev.selectedTags.filter(t => t !== tagName)
        : [...prev.selectedTags, tagName]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await postJob(formData)
      resetForm()
      onClose()
      onSuccess(result.message) // Show toast in parent component
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post job')
    } finally {
      setIsLoading(false)
    }
  }

    return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-gradient-to-br from-gray-900 via-gray-900 to-black rounded-2xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 w-full max-w-2xl mx-auto max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-900/20 to-purple-800/20 border-b border-purple-500/20">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Briefcase className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Post a Job</h2>
                <p className="text-sm text-gray-400">Share your opportunity with developers</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-all duration-200 p-2 hover:bg-gray-800/50 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-xl flex items-start gap-3 backdrop-blur-sm">
              <div className="p-1 bg-red-500/20 rounded-full">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              </div>
              <p className="text-red-300 text-sm leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Job Title */}
            <div className="group">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-400" />
                Job Title *
              </label>
              <div className="relative">
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-gray-800 transition-all duration-200 backdrop-blur-sm"
                  placeholder="e.g. Senior React Developer"
                  required
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 rounded-xl pointer-events-none" />
              </div>
            </div>

            {/* Company */}
            <div className="group">
              <label htmlFor="company" className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                Company Name *
              </label>
              <div className="relative">
                <input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="w-full px-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-gray-800 transition-all duration-200 backdrop-blur-sm"
                  placeholder="e.g. Tech Solutions Ireland"
                  required
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 rounded-xl pointer-events-none" />
              </div>
            </div>

            {/* Location */}
            <div className="group">
              <label htmlFor="location" className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-400" />
                Location *
              </label>
              <div className="relative">
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-gray-800 transition-all duration-200 backdrop-blur-sm"
                  placeholder="e.g. Dublin, Ireland"
                  required
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 rounded-xl pointer-events-none" />
              </div>
            </div>

            {/* Job URL */}
            <div className="group">
              <label htmlFor="url" className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-purple-400" />
                Job Posting URL *
              </label>
              <div className="relative">
                <input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  className="w-full px-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-gray-800 transition-all duration-200 backdrop-blur-sm"
                  placeholder="https://example.com/careers/job-posting"
                  required
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 rounded-xl pointer-events-none" />
              </div>
              <p className="mt-3 text-xs text-gray-400 flex items-center gap-2">
                <ExternalLink className="w-3 h-3" />
                Link to the full job posting where candidates can apply
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-400" />
                Technologies & Skills
                <span className="text-xs text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                <div className="flex flex-wrap gap-3">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-4 py-2 text-sm rounded-full transition-all duration-200 border ${
                        formData.selectedTags.includes(tag)
                          ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20 scale-105"
                          : "bg-gray-800/50 text-gray-300 border-gray-600/50 hover:bg-purple-600/20 hover:border-purple-500/50 hover:text-purple-300"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {formData.selectedTags.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-700/50">
                    <p className="text-xs text-gray-400 flex items-start gap-2">
                      <span className="text-purple-400 font-medium">Selected ({formData.selectedTags.length}):</span>
                      <span className="text-gray-300">{formData.selectedTags.join(', ')}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-purple-500/20 bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-xl p-6 -mx-6 -mb-6 mt-8">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-4 bg-gray-800/50 text-gray-300 rounded-xl hover:bg-gray-700/70 transition-all duration-200 font-semibold border border-gray-600/50 hover:border-gray-500/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 disabled:shadow-none relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Posting Job...
                      </>
                    ) : (
                      <>
                        <Briefcase className="w-4 h-4" />
                        Post Job
                      </>
                    )}
                  </span>
                  {!isLoading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-purple-600/20 opacity-0 hover:opacity-100 transition-opacity duration-200" />
                  )}
                </button>
              </div>
              <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <p className="text-xs text-purple-300 text-center flex items-center justify-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  Your job will be reviewed and published within 24 hours
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 