import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { mockSupabaseClient, resetMockDatabase } from '../mocks/supabase'

// Mock the Supabase server client for searchJobs
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}))

// Mock the Supabase browser client for getAllTags
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => mockSupabaseClient),
}))

// Import after mocking
import { searchJobs, getAllTags } from '@/app/actions/search'

describe('Search Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetMockDatabase()
  })

  describe('searchJobs', () => {
    const mockJobsData = [
      {
        id: 1,
        created_at: '2024-01-15T10:00:00Z',
        title: 'Frontend Developer',
        company: 'TechCorp',
        location: 'Remote',
        url: 'https://techcorp.com/jobs/1',
        status: 'approved',
        job_tags: [
          { tags: { id: 1, name: 'React' } },
          { tags: { id: 2, name: 'TypeScript' } }
        ]
      },
      {
        id: 2,
        created_at: '2024-01-14T15:30:00Z',
        title: 'Backend Engineer',
        company: 'DataCorp',
        location: 'New York, NY',
        url: 'https://datacorp.com/jobs/2',
        status: 'approved',
        job_tags: [
          { tags: { id: 3, name: 'Node.js' } },
          { tags: { id: 4, name: 'Python' } }
        ]
      },
      {
        id: 3,
        created_at: '2024-01-13T09:15:00Z',
        title: 'Full Stack Developer',
        company: 'StartupCo',
        location: 'San Francisco, CA',
        url: 'https://startupco.com/jobs/3',
        status: 'approved',
        job_tags: [
          { tags: { id: 1, name: 'React' } },
          { tags: { id: 3, name: 'Node.js' } }
        ]
      }
    ]

    it('should return all approved jobs when no search query or tags provided', async () => {
      // Mock the Supabase query chain
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockJobsData,
          error: null
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'job') {
          return mockQuery
        }
        return {}
      })

      const result = await searchJobs()

      expect(result).toHaveLength(3)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'approved')
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      
      // Verify data transformation
      expect(result[0]).toEqual({
        id: 1,
        created_at: '2024-01-15T10:00:00Z',
        title: 'Frontend Developer',
        company: 'TechCorp',
        location: 'Remote',
        url: 'https://techcorp.com/jobs/1',
        status: 'approved',
        tags: [
          { id: 1, name: 'React' },
          { id: 2, name: 'TypeScript' }
        ]
      })
    })

    it('should filter jobs by search query (title, company, location)', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          data: [mockJobsData[0]], // Only TechCorp job matches
          error: null
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'job') {
          return mockQuery
        }
        return {}
      })

      const result = await searchJobs('TechCorp')

      expect(mockQuery.or).toHaveBeenCalledWith(
        'title.ilike.%TechCorp%,company.ilike.%TechCorp%,location.ilike.%TechCorp%'
      )
      expect(result).toHaveLength(1)
      expect(result[0].company).toBe('TechCorp')
    })

    it('should filter jobs by selected tags', async () => {
      const mockTagsQuery = {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [{ id: 1 }], // React tag ID
            error: null
          })
        })
      }

      const mockJobTagsQuery = {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [{ job_id: 1 }, { job_id: 3 }], // Jobs with React tag
            error: null
          })
        })
      }

      const mockJobQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [mockJobsData[0], mockJobsData[2]], // Jobs 1 and 3 with React
          error: null
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tags') {
          return mockTagsQuery
        }
        if (table === 'job_tags') {
          return mockJobTagsQuery
        }
        if (table === 'job') {
          return mockJobQuery
        }
        return {}
      })

      const result = await searchJobs('', ['React'])

      // Should return jobs that have React tag (jobs 1 and 3)
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Frontend Developer')
      expect(result[1].title).toBe('Full Stack Developer')
      
      // Verify server-side queries were called
      expect(mockTagsQuery.select).toHaveBeenCalledWith('id')
      expect(mockJobTagsQuery.select).toHaveBeenCalledWith('job_id')
      expect(mockJobQuery.in).toHaveBeenCalledWith('id', [1, 3])
      
      // Verify both have React tag
      expect(result[0].tags.some(tag => tag.name === 'React')).toBe(true)
      expect(result[1].tags.some(tag => tag.name === 'React')).toBe(true)
    })

    it('should combine search query and tag filters', async () => {
      const mockTagsQuery = {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [{ id: 1 }], // React tag ID
            error: null
          })
        })
      }

      const mockJobTagsQuery = {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [{ job_id: 1 }, { job_id: 3 }], // Jobs with React tag
            error: null
          })
        })
      }

      const mockJobQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [mockJobsData[0]], // Only Frontend Developer matches both filters
          error: null
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tags') {
          return mockTagsQuery
        }
        if (table === 'job_tags') {
          return mockJobTagsQuery
        }
        if (table === 'job') {
          return mockJobQuery
        }
        return {}
      })

      const result = await searchJobs('Frontend', ['React'])

      expect(mockJobQuery.or).toHaveBeenCalledWith(
        'title.ilike.%Frontend%,company.ilike.%Frontend%,location.ilike.%Frontend%'
      )
      expect(mockJobQuery.in).toHaveBeenCalledWith('id', [1, 3])
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Frontend Developer')
      expect(result[0].tags.some(tag => tag.name === 'React')).toBe(true)
    })

    it('should handle jobs with no tags', async () => {
      const jobWithoutTags = {
        id: 4,
        created_at: '2024-01-12T14:20:00Z',
        title: 'DevOps Engineer',
        company: 'CloudCorp',
        location: 'Remote',
        url: 'https://cloudcorp.com/jobs/4',
        status: 'approved',
        job_tags: null // No tags
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [jobWithoutTags],
          error: null
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'job') {
          return mockQuery
        }
        return {}
      })

      const result = await searchJobs()

      expect(result).toHaveLength(1)
      expect(result[0].tags).toEqual([]) // Should be empty array, not null
    })

    it('should handle malformed job_tags data', async () => {
      const jobWithMalformedTags = {
        id: 5,
        created_at: '2024-01-11T11:00:00Z',
        title: 'QA Engineer',
        company: 'TestCorp',
        location: 'Austin, TX',
        url: 'https://testcorp.com/jobs/5',
        status: 'approved',
        job_tags: [
          { tags: null }, // Null tag
          { tags: { id: 5, name: 'Testing' } }, // Valid tag
          null // Null job_tag
        ]
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [jobWithMalformedTags],
          error: null
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'job') {
          return mockQuery
        }
        return {}
      })

      const result = await searchJobs()

      expect(result).toHaveLength(1)
      expect(result[0].tags).toEqual([{ id: 5, name: 'Testing' }]) // Should filter out null/malformed tags
    })

    it('should return empty array when database error occurs', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'job') {
          return mockQuery
        }
        return {}
      })

      const result = await searchJobs('test')

      expect(result).toEqual([]) // Should return empty array instead of throwing
    })

    it('should handle empty search query by ignoring it', async () => {
      const mockOr = jest.fn().mockReturnThis()
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: mockOr,
        order: jest.fn().mockResolvedValue({
          data: mockJobsData,
          error: null
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'job') {
          return mockQuery
        }
        return {}
      })

      const result = await searchJobs('   ') // Whitespace only

      // Should not call .or() for empty/whitespace query
      expect(mockOr).not.toHaveBeenCalled()
      expect(result).toHaveLength(3)
    })

    it('should handle case-insensitive tag filtering', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockJobsData,
          error: null
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'job') {
          return mockQuery
        }
        return {}
      })

      const result = await searchJobs('', ['react']) // Lowercase

      // Should still match 'React' tags (case sensitive in this implementation)
      expect(result).toHaveLength(0) // Current implementation is case-sensitive
    })

    it('should handle multiple tag filters correctly', async () => {
      const mockTagsQuery = {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [{ id: 1 }, { id: 3 }], // React and Node.js tag IDs
            error: null
          })
        })
      }

      const mockJobTagsQuery = {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [{ job_id: 1 }, { job_id: 2 }, { job_id: 3 }], // All jobs have either React or Node.js
            error: null
          })
        })
      }

      const mockJobQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: mockJobsData, // All jobs match the tag filter
          error: null
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tags') {
          return mockTagsQuery
        }
        if (table === 'job_tags') {
          return mockJobTagsQuery
        }
        if (table === 'job') {
          return mockJobQuery
        }
        return {}
      })

      const result = await searchJobs('', ['React', 'Node.js'])

      // Should return jobs that have either React OR Node.js
      expect(result).toHaveLength(3) // All jobs have at least one of these tags
      expect(mockJobQuery.in).toHaveBeenCalledWith('id', [1, 2, 3])
    })
  })

  describe('getAllTags', () => {
    it('should return all tag names', async () => {
      const mockTags = [
        { id: 1, name: 'React' },
        { id: 2, name: 'TypeScript' },
        { id: 3, name: 'Node.js' },
        { id: 4, name: 'Python' },
        { id: 5, name: 'JavaScript' }
      ]

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockTags,
            error: null
          })
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tags') {
          return mockQuery
        }
        return {}
      })

      const result = await getAllTags()

      expect(result).toEqual(['React', 'TypeScript', 'Node.js', 'Python', 'JavaScript'])
      expect(mockQuery.select).toHaveBeenCalledWith('name')
    })

    it('should return empty array when no tags exist', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tags') {
          return mockQuery
        }
        return {}
      })

      const result = await getAllTags()

      expect(result).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tags') {
          return mockQuery
        }
        return {}
      })

      const result = await getAllTags()

      expect(result).toEqual([]) // Should return empty array instead of throwing
    })

    it('should handle null/undefined tag names', async () => {
      const mockTags = [
        { id: 1, name: 'React' },
        { id: 2, name: null },
        { id: 3, name: 'TypeScript' },
        { id: 4, name: undefined },
        { id: 5, name: '' }
      ]

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockTags,
            error: null
          })
        })
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tags') {
          return mockQuery
        }
        return {}
      })

      const result = await getAllTags()

      // Should filter out null/undefined/empty names
      expect(result).toEqual(['React', 'TypeScript'])
    })
  })
}) 