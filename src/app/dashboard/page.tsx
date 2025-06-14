import Link from 'next/link'
import { getUserBookmarks } from '@/app/actions/bookmarks'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import DashboardJobCard from '@/components/DashboardJobCard'

export default async function DashboardPage() {
  // Check if user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login?message=Please sign in to view your dashboard')
  }

  const bookmarks = await getUserBookmarks()

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Dashboard</h1>
          <p className="text-gray-400">
            Track your job applications and update their status as you progress through the hiring process.
          </p>
        </div>

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
    </div>
  )
} 