'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Header from './Header'
import HeroSection from './HeroSection'
import JobSearchWrapper from './JobSearchWrapper'
import Toast from './Toast'
import SiteFooter from './SiteFooter'

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
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success')

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
    setToastType('success')
    setShowToast(true)
  }

  useEffect(() => {
    const pendingToast = sessionStorage.getItem('pendingToast')
    if (!pendingToast) {
      return
    }

    sessionStorage.removeItem('pendingToast')

    try {
      const parsed = JSON.parse(pendingToast) as {
        message?: string
        type?: 'success' | 'error' | 'info'
      }

      if (!parsed.message) {
        return
      }

      const parsedType =
        parsed.type === 'success' || parsed.type === 'error' || parsed.type === 'info'
          ? parsed.type
          : 'success'

      setToastMessage(parsed.message)
      setToastType(parsedType)
      setShowToast(true)
    } catch (error) {
      console.error('Failed to parse pending toast payload:', error)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header onPostJobClick={handleOpenPostJobModal} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <HeroSection
          onPostJobClick={handleOpenPostJobModal}
          onAuthClick={() => setIsAuthModalOpen(true)}
        />
        <div className="mt-16">
          <JobSearchWrapper />
        </div>
      </div>
      <SiteFooter />

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
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={8000}
      />
    </div>
  )
} 
