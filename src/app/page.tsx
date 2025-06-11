import { createClient } from '@/lib/supabase/server';
import JobCard from '@/components/JobCard';
import HeroSection from '@/components/HeroSection';
import Header from '@/components/Header';

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
      tags: job.job_tags?.map((jt: { tags: { id: number; name: string }[] }) => jt.tags).filter(Boolean) || []
    })) || [];

    return jobsWithTags;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
}

export default async function Home() {
  const jobs = await fetchJobs();

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <HeroSection />

        {jobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-12 max-w-md mx-auto">
              <div className="mb-6">
                <svg className="w-16 h-16 text-purple-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8a2 2 0 012-2V6" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                No Jobs Found
              </h3>
              <p className="text-gray-400 text-base">
                There are currently no job listings available. Please check back later!
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Latest Opportunities
              </h2>
              <p className="text-gray-400 text-sm">
                Found {jobs.length} job{jobs.length !== 1 ? 's' : ''}
              </p>
            </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
