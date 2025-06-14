'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function toggleBookmark(jobId: number) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/login?message=Please sign in to bookmark jobs')
  }

  try {
    // Check if bookmark already exists
    const { data: existingBookmark, error: checkError } = await supabase
      .from('tracked_applications')
      .select('id')
      .eq('user_id', user.id)
      .eq('job_id', Number(jobId))
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected if no bookmark exists
      throw checkError
    }

    if (existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from('tracked_applications')
        .delete()
        .eq('id', existingBookmark.id)

      if (deleteError) throw deleteError
      
      revalidatePath('/')
      revalidatePath('/dashboard')
      return { bookmarked: false }
    } else {
      // Add bookmark
      const { error: insertError } = await supabase
        .from('tracked_applications')
        .insert({
          user_id: user.id,
          job_id: Number(jobId),
          status: 'saved'
        })

      if (insertError) throw insertError
      
      revalidatePath('/')
      revalidatePath('/dashboard')
      return { bookmarked: true }
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error)
    console.error('Error details:', {
      jobId,
      userId: user.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    })
    throw new Error(`Failed to update bookmark: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function updateBookmarkStatus(bookmarkId: number, status: string, notes?: string) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/auth/login?message=Please sign in to update bookmarks')
  }

  try {
    const updateData: { status: string; notes?: string } = { status }
    if (notes !== undefined) {
      updateData.notes = notes
    }

    const { error } = await supabase
      .from('tracked_applications')
      .update(updateData)
      .eq('id', bookmarkId)
      .eq('user_id', user.id) // Ensure user can only update their own bookmarks

    if (error) throw error
    
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error updating bookmark status:', error)
    throw new Error('Failed to update bookmark status')
  }
}

export async function getBookmarkStatus(jobId: number) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { bookmarked: false }
  }

  try {
    const { data, error } = await supabase
      .from('tracked_applications')
      .select('id')
      .eq('user_id', user.id)
      .eq('job_id', Number(jobId))
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return { bookmarked: !!data }
  } catch (error) {
    console.error('Error checking bookmark status:', error)
    return { bookmarked: false }
  }
}

export async function getUserBookmarks() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('tracked_applications')
      .select(`
        id,
        status,
        notes,
        job_id,
        job (
          id,
          title,
          company,
          location,
          url,
          created_at,
          job_tags (
            tags (
              id,
              name
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .order('id', { ascending: false })

    if (error) throw error

    // Transform the data to flatten the tags structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookmarksWithJobs = data?.map((bookmark: any) => ({
      id: bookmark.id,
      status: bookmark.status,
      notes: bookmark.notes,
      job: {
        id: bookmark.job.id,
        title: bookmark.job.title,
        company: bookmark.job.company,
        location: bookmark.job.location,
        url: bookmark.job.url,
        created_at: bookmark.job.created_at,
        tags: bookmark.job.job_tags?.map((jt: { tags: { id: number; name: string } }) => jt.tags).filter(Boolean) || []
      }
    })) || []

    return bookmarksWithJobs
  } catch (error) {
    console.error('Error fetching user bookmarks:', error)
    return []
  }
} 