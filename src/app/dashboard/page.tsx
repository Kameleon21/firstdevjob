'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getUserBookmarks } from '@/app/actions/bookmarks'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import DashboardJobCard from '@/components/DashboardJobCard'
import { checkUserRole, getPendingJobs } from '@/app/actions/admin'
import AdminSection from '@/components/AdminSection'
import PostJobModal from '@/components/PostJobModal'
import Toast from '@/components/Toast'
import { getAllTags } from '@/app/actions/search'

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  url: string;
  created_at: string;
  tags: { id: number; name: string }[];
}

interface Bookmark {
  id: number;
  status: string;
  notes: string | null;
  job: Job;
}

interface UserRole {
  isAdmin: boolean;
  isModerator: boolean;
  userEmail?: string;
  role?: string;
}

interface PendingJob {
  id: number;
  created_at: string;
  title: string;
  company: string;
  location: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  tags: { id: number; name: string }[];
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [userRole, setUserRole] = useState<UserRole>({ isAdmin: false, isModerator: false })
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
  
        if (authError || !user) {
          router.push('/auth/login?message=Please sign in to view your dashboard')
          return
  }

        // Load data in parallel
        const [bookmarksData, userRoleData, tagsData] = await Promise.all([
    getUserBookmarks(),
          checkUserRole(),
          getAllTags()
  ])

        setBookmarks(bookmarksData)
        setUserRole(userRoleData)
        setAllTags(tagsData)

  // Fetch pending jobs if user is admin/moderator
        if (userRoleData.isModerator) {
    try {
            const pendingJobsData = await getPendingJobs()
            setPendingJobs(pendingJobsData)
    } catch (error) {
      console.error('Error fetching pending jobs:', error)
    }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-800 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-800 rounded-xl"></div>
              <div className="h-64 bg-gray-800 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header onPostJobClick={handleOpenPostJobModal} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Dashboard</h1>
          <p className="text-gray-400">
            Track your job applications and update their status as you progress through the hiring process.
          </p>
        </div>

        {/* Admin Section for moderators/admins */}
        <AdminSection initialPendingJobs={pendingJobs} userRole={userRole} />

        {bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-12 max-w-md mx-auto">
              <div className="mb-6">
                <svg className="w-16 h-16 text-purple-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                No Bookmarked Jobs
              </h3>
              <p className="text-gray-400 text-base mb-6">
                Start bookmarking jobs you&apos;re interested in to track your application progress here.
              </p>
              <Link
                href="/"
                className="inline-flex px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Browse Jobs
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                Tracked Applications
              </h2>
              <p className="text-gray-400 text-sm">
                You have {bookmarks.length} job{bookmarks.length !== 1 ? 's' : ''} in your tracker
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {bookmarks.map((bookmark) => (
                <DashboardJobCard 
                  key={bookmark.id} 
                  bookmark={bookmark} 
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Post Job Modal */}
      <PostJobModal
        isOpen={isPostJobModalOpen}
        onClose={handleClosePostJobModal}
        allTags={allTags}
        onSuccess={handleJobPostSuccess}
      />

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