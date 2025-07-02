'use server'

import { createClient } from '@/lib/supabase/server'

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

    const { data, error } = await query;

    if (error) {
      console.error('Error searching jobs:', error);
      return [];
    }

    // Transform the data to flatten the tags structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let jobsWithTags: Job[] = data?.map((job: any) => ({
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

    // Filter by selected tags if any are provided
    if (selectedTags.length > 0) {
      jobsWithTags = jobsWithTags.filter(job => 
        job.tags.some(tag => selectedTags.includes(tag.name))
      );
    }

    return jobsWithTags;
  } catch (error) {
    console.error('Error searching jobs:', error);
    return [];
  }
}

export async function getAllTags(): Promise<string[]> {
  try {
    const supabase = await createClient();
    
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