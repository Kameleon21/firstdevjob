import PageWrapper from '@/components/PageWrapper';
import { getAllTags } from '@/app/actions/search';

export default async function Home() {
  // Tags are still fetched on the server, but jobs are now fetched on the client by SWR.
  const allTags = await getAllTags();

  return (
    <PageWrapper initialJobs={[]} allTags={allTags} />
  );
}
