'use client'

import { useState, useCallback } from 'react'
import { Shield, Clock, RefreshCw } from 'lucide-react'
import AdminJobCard from './AdminJobCard'
import { getPendingJobs } from '@/app/actions/admin'

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

interface AdminSectionProps {
  initialPendingJobs: PendingJob[]
  userRole: {
    isAdmin: boolean
    isModerator: boolean
    userEmail?: string
    role?: string
  }
}

export default function AdminSection({ initialPendingJobs, userRole }: AdminSectionProps) {
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>(initialPendingJobs)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshPendingJobs = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const updatedJobs = await getPendingJobs()
      setPendingJobs(updatedJobs)
    } catch (error) {
      console.error('Error refreshing pending jobs:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  if (!userRole.isModerator) {
    return null
  }

  return (
    <div className="mb-12">
      {/* Admin Section Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">
                {userRole.isAdmin ? 'Admin Panel' : 'Moderator Panel'}
              </h2>
              <p className="text-gray-400 text-sm">
                Review and approve pending job submissions
              </p>
            </div>
          </div>
          <button
            onClick={refreshPendingJobs}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Pending Jobs Count */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-yellow-400" />
          <span className="text-gray-300">
            {pendingJobs.length} job{pendingJobs.length !== 1 ? 's' : ''} pending review
          </span>
        </div>
      </div>

      {/* Pending Jobs Grid */}
      {pendingJobs.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8">
            <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No Pending Jobs
            </h3>
            <p className="text-gray-400 text-sm">
              All job submissions have been reviewed. New submissions will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {pendingJobs.map((job) => (
            <AdminJobCard
              key={job.id}
              job={job}
              onJobUpdate={refreshPendingJobs}
            />
          ))}
        </div>
      )}

      {/* Separator */}
      <div className="border-t border-gray-700 mb-8" />
    </div>
  )
} 