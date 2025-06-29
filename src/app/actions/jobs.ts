'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

interface PostJobData {
  title: string
  company: string
  location: string
  url: string
  selectedTags: string[]
}

export async function postJob(formData: PostJobData) {
  const supabase = createServiceClient()

  try {
    // Validate required fields
    if (!formData.title.trim() || !formData.company.trim() || !formData.location.trim() || !formData.url.trim()) {
      throw new Error('All fields are required')
    }

    // Validate URL format
    try {
      new URL(formData.url)
    } catch {
      throw new Error('Please enter a valid URL')
    }

    // Insert the job with 'pending' status (default for new jobs)
    const { data: jobData, error: jobError } = await supabase
      .from('job')
      .insert({
        title: formData.title.trim(),
        company: formData.company.trim(),
        location: formData.location.trim(),
        url: formData.url.trim(),
        status: 'pending' // All new jobs start as pending for admin approval
      })
      .select('id')
      .single()

    if (jobError) {
      console.error('Job insertion error:', jobError)
      throw new Error(`Database error: ${jobError.message}`)
    }

    // If tags are selected, add them to the job_tags junction table
    if (formData.selectedTags.length > 0 && jobData) {
              // First, get the tag IDs for the selected tag names
        const { data: tagData, error: tagError } = await supabase
          .from('tags')
          .select('id, name')
          .in('name', formData.selectedTags)

        if (tagError) {
          console.error('Tag fetch error:', tagError)
          throw new Error(`Tag fetch error: ${tagError.message}`)
        }

        // Insert job-tag relationships
        if (tagData && tagData.length > 0) {
          const jobTagInserts = tagData.map((tag: { id: number; name: string }) => ({
            job_id: jobData.id,
            tag_id: tag.id
          }))

          const { error: jobTagError } = await supabase
            .from('job_tags')
            .insert(jobTagInserts)

          if (jobTagError) {
            console.error('Job-tag insertion error:', jobTagError)
            throw new Error(`Job-tag insertion error: ${jobTagError.message}`)
          }
        }
    }

    revalidatePath('/')
    return { success: true, message: 'Thank you for your submission! Your job posting will be reviewed and added to the community within 24 hours if it\'s a good fit for our developers.' }
  } catch (error) {
    console.error('Error posting job:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to post job')
  }
} 