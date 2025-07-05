'use server'

import { createClient } from '@/lib/supabase/server'
import { createBrowserClient } from '@supabase/ssr'

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

export async function searchJobs(searchQuery: string = '', selectedTags: string[] = []): Promise<Job[]> {
  try {
    const supabase = await createClient();
    
    let jobIds: number[] = [];
    
    // First, get job IDs that have the selected tags if tags are provided
    if (selectedTags.length > 0) {
      // Get tag IDs for the selected tag names
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select('id')
        .in('name', selectedTags);
      
      if (tagError) {
        console.error('Error fetching tag IDs for search:', {
          error: tagError,
          selectedTags,
          searchQuery
        });
        return [];
      }
      
      const tagIds = tagData?.map(tag => tag.id) || [];
      
      if (tagIds.length > 0) {
        // Get job IDs that have any of the selected tags
        const { data: jobTagData, error: jobTagError } = await supabase
          .from('job_tags')
          .select('job_id')
          .in('tag_id', tagIds);
        
        if (jobTagError) {
          console.error('Error fetching job IDs by tags:', {
            error: jobTagError,
            tagIds,
            selectedTags,
            searchQuery
          });
          return [];
        }
        
        jobIds = jobTagData?.map(jt => jt.job_id) || [];
        
        // If no jobs found for selected tags, return empty array
        if (jobIds.length === 0) {
          console.log('No jobs found for selected tags:', selectedTags);
          return [];
        }
      } else {
        console.log('No matching tags found for:', selectedTags);
        return [];
      }
    }
    
    let query = supabase
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
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    // Add text search if query is provided
    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
    }

    // Filter by job IDs if we have tag filtering
    if (selectedTags.length > 0 && jobIds.length > 0) {
      query = query.in('id', jobIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error executing job search query:', {
        error: error,
        searchQuery,
        selectedTags,
        hasJobIds: selectedTags.length > 0 && jobIds.length > 0,
        jobIdsCount: jobIds.length
      });
      return [];
    }

    // Transform the data to flatten the tags structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jobsWithTags: Job[] = data?.map((job: any) => ({
      id: job.id,
      created_at: job.created_at,
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
      status: job.status,
      tags: job.job_tags?.filter((jt: { tags: { id: number; name: string } | null } | null) => jt && jt.tags)
        .map((jt: { tags: { id: number; name: string } | null }) => jt.tags)
        .filter((tag: { id: number; name: string } | null): tag is { id: number; name: string } => 
          tag !== null && tag !== undefined && tag.name !== null && tag.name !== undefined) || []
    })) || [];

    return jobsWithTags;
  } catch (error) {
    console.error('Unexpected error in searchJobs:', {
      error: error,
      searchQuery,
      selectedTags,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return [];
  }
}

export async function getAllTags(): Promise<string[]> {
  try {
    // Use the anonymous client to allow static generation
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data, error } = await supabase
      .from('tags')
      .select('name')
      .order('name');

    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }

    return data?.map(tag => tag.name).filter(name => name && name.trim() !== '') || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
} 