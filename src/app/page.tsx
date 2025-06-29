import { createClient } from '@/lib/supabase/server';
import HeroSection from '@/components/HeroSection';
import Header from '@/components/Header';
import JobSearchWrapper from '@/components/JobSearchWrapper';
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

export default async function Home() {
  const jobs = await fetchJobs();
  const allTags = await getAllTags();

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <HeroSection allTags={allTags} />
        <div className="mt-16">
          <JobSearchWrapper initialJobs={jobs} allTags={allTags} />
        </div>
      </div>
    </div>
  );
}
