import { createClient } from '@/lib/supabase/server';
import PageWrapper from '@/components/PageWrapper';
import { getAllTags } from '@/app/actions/search';

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

async function fetchJobs(): Promise<Job[]> {
  try {
    const supabase = await createClient();
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
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
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
      tags: job.job_tags?.map((jt: { tags: { id: number; name: string } }) => jt.tags).filter(Boolean) || []
    })) || [];

    return jobsWithTags;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
}

async function fetchUserBookmarkIds(): Promise<Set<number>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return new Set();
    }

    const { data, error } = await supabase
      .from('tracked_applications')
      .select('job_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching user bookmarks:', error);
      return new Set();
    }

    return new Set(data?.map(bookmark => bookmark.job_id) || []);
  } catch (error) {
    console.error('Error fetching user bookmarks:', error);
    return new Set();
  }
}

export default async function Home() {
  const [jobs, allTags, bookmarkIds] = await Promise.all([
    fetchJobs(),
    getAllTags(),
    fetchUserBookmarkIds()
  ]);

  return (
    <PageWrapper 
      initialJobs={jobs} 
      allTags={allTags} 
      bookmarkIds={bookmarkIds}
    />
  );
}
