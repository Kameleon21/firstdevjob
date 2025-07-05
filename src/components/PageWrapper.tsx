'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Header from './Header'
import HeroSection from './HeroSection'
import JobSearchWrapper from './JobSearchWrapper'
import Toast from './Toast'

const PostJobModal = dynamic(() => import('./PostJobModal'), {
  ssr: false,
})

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

interface PageWrapperProps {
  initialJobs: Job[]
  allTags: string[]
}

export default function PageWrapper({ initialJobs, allTags }: PageWrapperProps) {
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

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
    <div className="min-h-screen bg-black">
      <Header onPostJobClick={handleOpenPostJobModal} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <HeroSection 
          onPostJobClick={handleOpenPostJobModal}
        />
        <div className="mt-16">
          <JobSearchWrapper 
            initialJobs={initialJobs} 
            allTags={allTags} 
          />
        </div>
      </div>

      {/* Post Job Modal */}
      {isPostJobModalOpen && (
        <PostJobModal
          isOpen={isPostJobModalOpen}
          onClose={handleClosePostJobModal}
          allTags={allTags}
          onSuccess={handleJobPostSuccess}
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