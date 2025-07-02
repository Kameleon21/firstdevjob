import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { mockSupabaseClient, resetMockDatabase } from '../mocks/supabase'

// Mock Next.js revalidation
const mockRevalidatePath = jest.fn()
jest.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}))

// Mock the Supabase service client (this is what postJob actually uses)
jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: jest.fn(() => mockSupabaseClient),
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
      selectedTags: ['React', 'TypeScript']
    }

    it('should successfully create a new job posting', async () => {
      // Mock successful job insertion
      const mockJobResponse = { id: 123 }
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'job') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockJobResponse,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'tags') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [
                  { id: 1, name: 'React' },
                  { id: 2, name: 'TypeScript' }
                ],
                error: null
              })
            })
          }
        }
        if (table === 'job_tags') {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          }
        }
        return {
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        }
      })

      const result = await postJob(validJobData)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Thank you for your submission')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/')
    })

    it('should handle database insertion errors', async () => {
      // Mock database error
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'job') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database connection failed' }
                })
              })
            })
          }
        }
        return {
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        }
      })

      await expect(postJob(validJobData)).rejects.toThrow('Database error: Database connection failed')
    })

    it('should validate required fields', async () => {
      const invalidJobData = {
        title: '', // Empty title
        company: 'TechCorp',
        location: 'Remote',
        url: 'https://example.com/job',
        selectedTags: []
      }

      await expect(postJob(invalidJobData)).rejects.toThrow('All fields are required')
    })

    it('should validate URL format', async () => {
      const invalidJobData = {
        ...validJobData,
        url: 'not-a-valid-url'
      }

      await expect(postJob(invalidJobData)).rejects.toThrow('Please enter a valid URL')
    })

    it('should handle job posting without tags', async () => {
      const mockJobResponse = { id: 456 }
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'job') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockJobResponse,
                  error: null
                })
              })
            })
          }
        }
        return {
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        }
      })

      const jobDataWithoutTags = {
        ...validJobData,
        selectedTags: []
      }

      const result = await postJob(jobDataWithoutTags)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Thank you for your submission')
    })

    it('should handle tag relationships when tags are provided', async () => {
      const mockJobResponse = { id: 789 }
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'job') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockJobResponse,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'tags') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [
                  { id: 1, name: 'React' },
                  { id: 2, name: 'TypeScript' }
                ],
                error: null
              })
            })
          }
        }
        if (table === 'job_tags') {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          }
        }
        return {
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        }
      })

      const result = await postJob(validJobData)

      expect(result.success).toBe(true)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('job')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tags')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('job_tags')
    })
  })
}) 