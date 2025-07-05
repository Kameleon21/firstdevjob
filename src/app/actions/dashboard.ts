'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserBookmarks } from './bookmarks'
import { checkUserRole, getPendingJobs } from './admin'
import { getAllTags } from './search'

export async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      bookmarks: [],
      userRole: { isAdmin: false, isModerator: false },
      pendingJobs: [],
      allTags: [],
    }
  }

  const [bookmarks, userRole, allTags] = await Promise.all([
    getUserBookmarks(),
    checkUserRole(),
    getAllTags(),
  ])

  let pendingJobs = []
  if (userRole.isModerator) {
    pendingJobs = await getPendingJobs()
  }

  return {
    user,
    bookmarks,
    userRole,
    pendingJobs,
    allTags,
  }
} 