'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { X, Briefcase, Building2, MapPin, ExternalLink, Tag, AlertCircle } from 'lucide-react'
import { api } from '../../convex/_generated/api'

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
  const postJob = useMutation(api.jobs.postJob)

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
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
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
      const result = await postJob({
        title: formData.title,
        company: formData.company,
        location: formData.location,
        url: formData.url,
        tags: formData.selectedTags,
      })
      resetForm()
      onClose()
      onSuccess(result.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post job')
    } finally {
      setIsLoading(false)
    }
  }

    return (
    <div 
              className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-background rounded-2xl border border-primary/20 shadow-2xl shadow-primary/10 w-full max-w-2xl mx-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-primary/10 border-b border-primary/20 p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                        <Briefcase className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Post a Job</h2>
                        <p className="text-sm text-muted-foreground">Share your opportunity with developers</p>
                    </div>
                </div>
                <button
                    onClick={handleClose}
                    className="text-muted-foreground hover:text-foreground transition-all duration-200 p-2 hover:bg-muted/50 rounded-lg"
                >
                    <X size={20} />
                </button>
            </div>
        </div>

        <div className="p-6 flex-grow overflow-y-auto">
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
              <label htmlFor="title" className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-accent" />
                Job Title *
              </label>
              <div className="relative">
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-4 bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring focus:bg-muted transition-all duration-200 backdrop-blur-sm"
                  placeholder="e.g. Senior React Developer"
                  required
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 rounded-xl pointer-events-none" />
              </div>
            </div>

            {/* Company */}
            <div className="group">
              <label htmlFor="company" className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-accent" />
                Company Name *
              </label>
              <div className="relative">
                <input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="w-full px-4 py-4 bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring focus:bg-muted transition-all duration-200 backdrop-blur-sm"
                  placeholder="e.g. Tech Solutions Ireland"
                  required
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 rounded-xl pointer-events-none" />
              </div>
            </div>

            {/* Location */}
            <div className="group">
              <label htmlFor="location" className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                Location *
              </label>
              <div className="relative">
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-4 bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring focus:bg-muted transition-all duration-200 backdrop-blur-sm"
                  placeholder="e.g. Dublin, Ireland"
                  required
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 rounded-xl pointer-events-none" />
              </div>
            </div>

            {/* Job URL */}
            <div className="group">
              <label htmlFor="url" className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-accent" />
                Job Posting URL *
              </label>
              <div className="relative">
                <input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  className="w-full px-4 py-4 bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring focus:bg-muted transition-all duration-200 backdrop-blur-sm"
                  placeholder="https://example.com/careers/job-posting"
                  required
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 rounded-xl pointer-events-none" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                <ExternalLink className="w-3 h-3" />
                Link to the full job posting where candidates can apply
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-accent" />
                Technologies & Skills
                <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
              </label>
              <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                <div className="flex flex-wrap gap-3">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-4 py-2 text-sm rounded-full transition-all duration-200 border ${
                        formData.selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                          : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-primary/20 hover:border-primary/50 hover:text-accent"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                 {formData.selectedTags.length > 0 && (
                   <div className="mt-4 pt-3 border-t border-border/50">
                     <p className="text-xs text-muted-foreground flex items-start gap-2">
                       <span className="text-accent font-medium">Selected ({formData.selectedTags.length}):</span>
                       <span className="text-muted-foreground">{formData.selectedTags.join(', ')}</span>
                     </p>
                   </div>
                 )}
              </div>
            </div>
            
             {/* Submit Button Area */}
            <div className="pt-6">
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 py-4 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-all duration-200 font-semibold border border-border/50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:shadow-none relative overflow-hidden"
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
                    </button>
                </div>
                <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-xs text-accent text-center flex items-center justify-center gap-2">
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
