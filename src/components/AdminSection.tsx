'use client'

import { useState } from 'react'
import { Shield, Clock, CheckCircle } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import AdminJobCard from './AdminJobCard'

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

interface AdminSectionProps {
  pendingJobs: AdminJob[]
  userRole: {
    isAdmin: boolean
    isModerator: boolean
    userEmail?: string
    role?: string
  }
}

type AdminTab = 'pending' | 'approved'

export default function AdminSection({ pendingJobs, userRole }: AdminSectionProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('pending')
  const approvedJobs = useQuery(api.admin.getApprovedJobs, userRole.isModerator ? {} : 'skip')

  if (!userRole.isModerator) {
    return null
  }

  const approvedJobsList = approvedJobs ?? []

  return (
    <div className="mb-12">
      {/* Admin Section Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {userRole.isAdmin ? 'Admin Panel' : 'Moderator Panel'}
              </h2>
              <p className="text-muted-foreground text-sm">
                Review and manage job submissions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-warning/20 text-warning border border-warning'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending ({pendingJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'approved'
              ? 'bg-success/20 text-success border border-success'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Approved ({approvedJobsList.length})
        </button>
      </div>

      {/* Pending Jobs Tab */}
      {activeTab === 'pending' && (
        <>
          {pendingJobs.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-background border border-border rounded-xl p-8">
                <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No Pending Jobs
                </h3>
                <p className="text-muted-foreground text-sm">
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
                  mode="pending"
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Approved Jobs Tab */}
      {activeTab === 'approved' && (
        <>
          {approvedJobsList.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-background border border-border rounded-xl p-8">
                <CheckCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No Approved Jobs
                </h3>
                <p className="text-muted-foreground text-sm">
                  No jobs have been approved yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {approvedJobsList.map((job) => (
                <AdminJobCard
                  key={job.id}
                  job={job}
                  mode="approved"
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Separator */}
      <div className="border-t border-border mb-8" />
    </div>
  )
} 
