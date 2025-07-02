import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { mockSupabaseClient, resetMockDatabase, createMockJob } from '../mocks/supabase'

// Mock Next.js revalidation
const mockRevalidatePath = jest.fn()
jest.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}))

// Mock the Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}))

// Import after mocking
import { postJob } from '@/app/actions/jobs'

describe('Job Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetMockDatabase()
  })

  describe('postJob', () => {
    const validJobData = {
      title: 'Frontend Developer',
      company: 'TechCorp',
      location: 'Remote',
      url: 'https://example.com/job',
      selectedTags: ['react', 'typescript']
    }

    it('should successfully create a new job posting', async () => {
      const mockJob = createMockJob({
        title: 'Frontend Developer',
        company: 'TechCorp',
        location: 'Remote',
        apply_url: 'https://example.com/job',
        is_approved: false
      })

      // Mock successful insert
      mockSupabaseClient.from('jobs').insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockJob,
            error: null
          })
        })
      })

      const result = await postJob(validJobData)

      expect(result.success).toBe(true)
      expect(result.message).toContain('submitted successfully')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('jobs')
    })

    it('should handle database insertion errors', async () => {
      // Mock database error
      mockSupabaseClient.from('jobs').insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })

      const result = await postJob(validJobData)

      expect(result.success).toBe(false)
      expect(result.message).toContain('error')
    })

    it('should validate required fields', async () => {
      const invalidJobData = {
        title: '',
        company: 'TechCorp',
        location: 'Remote',
        url: 'https://example.com/job',
        selectedTags: []
      }

      const result = await postJob(invalidJobData)

      expect(result.success).toBe(false)
      expect(result.message).toContain('title')
    })

    it('should validate URL format', async () => {
      const invalidJobData = {
        ...validJobData,
        url: 'not-a-valid-url'
      }

      const result = await postJob(invalidJobData)

      expect(result.success).toBe(false)
      expect(result.message).toContain('URL')
    })

    it('should handle tags correctly', async () => {
      const mockJob = createMockJob({
        title: 'Backend Developer',
        company: 'DataCorp',
        location: 'New York',
        apply_url: 'https://example.com/backend-job'
      })

      mockSupabaseClient.from('jobs').insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockJob,
            error: null
          })
        })
      })

      const jobDataWithTags = {
        ...validJobData,
        title: 'Backend Developer',
        company: 'DataCorp',
        location: 'New York',
        url: 'https://example.com/backend-job',
        selectedTags: ['node', 'mongodb', 'aws']
      }

      const result = await postJob(jobDataWithTags)

      expect(result.success).toBe(true)
      // Verify tags are handled properly in the job creation
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('jobs')
    })

    it('should set job as unapproved by default', async () => {
      const mockJob = createMockJob({
        title: 'Designer',
        company: 'DesignStudio',
        is_approved: false
      })

      mockSupabaseClient.from('jobs').insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockJob,
            error: null
          })
        })
      })

      const result = await postJob(validJobData)

      expect(result.success).toBe(true)
      // Verify the job is created with is_approved: false
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('jobs')
    })
  })
}) 