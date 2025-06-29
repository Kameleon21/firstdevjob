'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

export async function checkUserRole() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { isAdmin: false, isModerator: false }
  }

  try {
    // Query the profiles table to get the user's role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError)
      return { isAdmin: false, isModerator: false, userEmail: user.email }
    }

    const isAdmin = profile.role === 'admin'
    const isModerator = profile.role === 'moderator' || isAdmin

    return { 
      isAdmin, 
      isModerator, 
      userEmail: user.email,
      role: profile.role 
    }
  } catch (error) {
    console.error('Error checking user role:', error)
    return { isAdmin: false, isModerator: false }
  }
}

export async function getPendingJobs(): Promise<PendingJob[]> {
  const supabase = await createClient()
  
  // Check if user is admin or moderator
  const { isModerator } = await checkUserRole()
  
  if (!isModerator) {
    throw new Error('Access denied. Admin or moderator privileges required.')
  }

  try {
    const { data, error } = await supabase
      .from('job')
      .select(`
        id,
        created_at,
        title,
        company,
        location,
        url,
        status,
        job_tags (
          tags (
            id,
            name
          )
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform the data to flatten the tags structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pendingJobs: PendingJob[] = data?.map((job: any) => ({
      id: job.id,
      created_at: job.created_at,
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
      status: job.status,
      tags: job.job_tags?.map((jt: { tags: { id: number; name: string } }) => jt.tags).filter(Boolean) || []
    })) || []

    return pendingJobs
  } catch (error) {
    console.error('Error fetching pending jobs:', error)
    throw new Error('Failed to fetch pending jobs')
  }
}

export async function getPendingJobsCount(): Promise<number> {
  const supabase = await createClient()
  
  // Check if user is admin or moderator
  const { isModerator } = await checkUserRole()
  
  if (!isModerator) {
    return 0 // Return 0 for non-moderators instead of throwing error
  }

  try {
    const { count, error } = await supabase
      .from('job')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (error) throw error

    return count || 0
  } catch (error) {
    console.error('Error fetching pending jobs count:', error)
    return 0
  }
}

export async function updateJobStatus(jobId: number, status: 'approved' | 'rejected') {
  const supabase = await createClient()
  
  // Check if user is admin or moderator
  const { isModerator } = await checkUserRole()
  
  if (!isModerator) {
    throw new Error('Access denied. Admin or moderator privileges required.')
  }

  try {
    const { error } = await supabase
      .from('job')
      .update({ status })
      .eq('id', jobId)

    if (error) throw error

    revalidatePath('/dashboard')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('Error updating job status:', error)
    throw new Error('Failed to update job status')
  }
} 