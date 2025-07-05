'use client'

import useSWR from 'swr'
import { searchJobs } from '@/app/actions/search'

// Simple test component to verify SWR is working
export default function SWRTestComponent() {
  // Test with a simple fetch (this will use the default fetcher)
  const { data: testData, error: testError, isLoading: testLoading } = useSWR(
    'https://jsonplaceholder.typicode.com/posts/1',
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  // Test with server action (custom fetcher)
  const { data: jobsData, error: jobsError, isLoading: jobsLoading } = useSWR(
    ['searchJobs', '', []], // Key: [actionName, searchQuery, selectedTags]
    async () => await searchJobs('', []),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  return (
    <div className="p-6 bg-gray-800 rounded-lg m-4">
      <h2 className="text-xl font-bold text-white mb-4">SWR Test Component</h2>
      
      {/* Test 1: Regular fetch */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-purple-400 mb-2">Test 1: Regular Fetch</h3>
        {testLoading && <p className="text-yellow-400">Loading test data...</p>}
        {testError && <p className="text-red-400">Error: {testError.message}</p>}
        {testData && (
          <div className="text-green-400">
            <p>✅ Success! Title: {testData.title}</p>
            <p>User ID: {testData.userId}</p>
          </div>
        )}
      </div>

      {/* Test 2: Server action */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-purple-400 mb-2">Test 2: Server Action</h3>
        {jobsLoading && <p className="text-yellow-400">Loading jobs...</p>}
        {jobsError && <p className="text-red-400">Error: {jobsError.message}</p>}
        {jobsData && (
          <div className="text-green-400">
            <p>✅ Success! Found {jobsData.length} jobs</p>
            {jobsData.slice(0, 2).map((job) => (
              <div key={job.id} className="ml-4 mt-2">
                <p>• {job.title} at {job.company}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-sm text-gray-400 mt-4">
        <p>🔧 This is a temporary test component to verify SWR configuration</p>
        <p>Remove this component once SWR integration is complete</p>
      </div>
    </div>
  )
} 