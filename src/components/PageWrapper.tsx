'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Header from './Header'
import HeroSection from './HeroSection'
import JobSearchWrapper from './JobSearchWrapper'
import Toast from './Toast'

const PostJobModal = dynamic(() => import('./PostJobModal'), {
  ssr: false,
})

const AuthModal = dynamic(() => import('./AuthModal'), {
  ssr: false,
})

export default function PageWrapper() {
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const allTags = useQuery(api.tags.getAllTags, {})
  const resolvedTags = allTags ?? []

  const handleOpenPostJobModal = () => {
    setIsPostJobModalOpen(true)
  }

  const handleClosePostJobModal = () => {
    setIsPostJobModalOpen(false)
  }

  const handleJobPostSuccess = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onPostJobClick={handleOpenPostJobModal} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <HeroSection
          onPostJobClick={handleOpenPostJobModal}
          onAuthClick={() => setIsAuthModalOpen(true)}
        />
        <div className="mt-16">
          <JobSearchWrapper allTags={resolvedTags} />
        </div>
      </div>

      {/* Post Job Modal */}
      {isPostJobModalOpen && (
        <PostJobModal
          isOpen={isPostJobModalOpen}
          onClose={handleClosePostJobModal}
          allTags={resolvedTags}
          onSuccess={handleJobPostSuccess}
        />
      )}

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={8000}
      />
    </div>
  )
} 
