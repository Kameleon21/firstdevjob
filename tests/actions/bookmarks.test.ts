import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { mockSupabaseClient, resetMockDatabase, createMockUser } from '../mocks/supabase'

// Mock Next.js functions
const mockRevalidatePath = jest.fn()
const mockRedirect = jest.fn()

jest.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}))

jest.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

// Mock the Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}))

// Import after mocking
import { toggleBookmark, getBookmarkStatus, getUserBookmarks } from '@/app/actions/bookmarks'

describe('Bookmark Actions', () => {
  const mockUser = createMockUser({
    id: 'user-123',
    email: 'test@example.com'
  })

  beforeEach(() => {
    jest.clearAllMocks()
    resetMockDatabase()
  })

  describe('toggleBookmark', () => {
    it('should create bookmark when none exists', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock no existing bookmark (PGRST116 is "not found")
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tracked_applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' } // Not found error
                  })
                })
              })
            }),
            insert: jest.fn().mockResolvedValue({
              data: [{ id: 1, user_id: 'user-123', job_id: 42, status: 'saved' }],
              error: null
            })
          }
        }
        return {}
      })

      const result = await toggleBookmark(42)

      expect(result.bookmarked).toBe(true)
      expect(mockRevalidatePath).toHaveBeenCalledWith('/')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
    })

    it('should remove bookmark when one exists', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock existing bookmark
      const existingBookmark = { id: 1, user_id: 'user-123', job_id: 42 }
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tracked_applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: existingBookmark,
                    error: null
                  })
                })
              })
            }),
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          }
        }
        return {}
      })

      const result = await toggleBookmark(42)

      expect(result.bookmarked).toBe(false)
      expect(mockRevalidatePath).toHaveBeenCalledWith('/')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
    })

    it('should redirect unauthenticated users to login', async () => {
      // Mock no user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      // The function should either redirect or throw an error (since redirect doesn't stop execution in tests)
      try {
        await toggleBookmark(42)
        // If no error is thrown, check that redirect was called
        expect(mockRedirect).toHaveBeenCalledWith('/auth/login?message=Please sign in to bookmark jobs')
      } catch (error) {
        // If an error is thrown, still check that redirect was called
        expect(mockRedirect).toHaveBeenCalledWith('/auth/login?message=Please sign in to bookmark jobs')
      }
    })

    it('should handle database errors gracefully', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock database error
      const dbError = new Error('Database connection failed')
      Object.assign(dbError, { code: 'DB_ERROR' })
      
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tracked_applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: dbError
                  })
                })
              })
            })
          }
        }
        return {}
      })

      await expect(toggleBookmark(42)).rejects.toThrow('Failed to update bookmark: Database connection failed')
    })

    it('should handle job ID type conversion correctly', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock no existing bookmark
      const mockInsert = jest.fn().mockResolvedValue({
        data: [{ id: 1 }],
        error: null
      })
      
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tracked_applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }
                  })
                })
              })
            }),
            insert: mockInsert
          }
        }
        return {}
      })

      // Test with string job ID (should be converted to number)
      await toggleBookmark('123' as any)

      // Verify the job_id was converted to number in the insert call
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        job_id: 123, // Should be converted to number
        status: 'saved'
      })
    })
  })

  describe('getBookmarkStatus', () => {
    it('should return true when bookmark exists', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tracked_applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 1 },
                    error: null
                  })
                })
              })
            })
          }
        }
        return {}
      })

      const result = await getBookmarkStatus(42)

      expect(result.bookmarked).toBe(true)
    })

    it('should return false when bookmark does not exist', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tracked_applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' } // Not found
                  })
                })
              })
            })
          }
        }
        return {}
      })

      const result = await getBookmarkStatus(42)

      expect(result.bookmarked).toBe(false)
    })

    it('should return false for unauthenticated users', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const result = await getBookmarkStatus(42)

      expect(result.bookmarked).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tracked_applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database error', code: 'DB_ERROR' }
                  })
                })
              })
            })
          }
        }
        return {}
      })

      const result = await getBookmarkStatus(42)

      // Should return false instead of throwing
      expect(result.bookmarked).toBe(false)
    })
  })

  describe('getUserBookmarks', () => {
    it('should return empty array for unauthenticated users', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const result = await getUserBookmarks()

      expect(result).toEqual([])
    })

    it('should return bookmarks with job details and tags', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockBookmarksData = [
        {
          id: 1,
          status: 'applied',
          notes: 'Great company culture',
          job_id: 42,
          job: {
            id: 42,
            title: 'Frontend Developer',
            company: 'TechCorp',
            location: 'Remote',
            url: 'https://example.com/job',
            created_at: '2024-01-15T10:00:00Z'
          }
        }
      ]

      const mockJobTags = [
        {
          job_id: 42,
          tags: { id: 1, name: 'React' }
        },
        {
          job_id: 42,
          tags: { id: 2, name: 'TypeScript' }
        }
      ]

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tracked_applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockBookmarksData,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'job_tags') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: mockJobTags,
                error: null
              })
            })
          }
        }
        return {}
      })

      const result = await getUserBookmarks()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 1,
        status: 'applied',
        notes: 'Great company culture',
        job: {
          id: 42,
          title: 'Frontend Developer',
          company: 'TechCorp',
          location: 'Remote',
          url: 'https://example.com/job',
          created_at: '2024-01-15T10:00:00Z',
          tags: [
            { id: 1, name: 'React' },
            { id: 2, name: 'TypeScript' }
          ]
        }
      })
    })

    it('should handle missing tags gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockBookmarksData = [
        {
          id: 1,
          status: 'saved',
          notes: null,
          job_id: 42,
          job: {
            id: 42,
            title: 'Backend Developer',
            company: 'DataCorp',
            location: 'NYC',
            url: 'https://example.com/backend',
            created_at: '2024-01-20T10:00:00Z'
          }
        }
      ]

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tracked_applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockBookmarksData,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'job_tags') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: null, // No tags
                error: { message: 'Tags fetch failed' }
              })
            })
          }
        }
        return {}
      })

      const result = await getUserBookmarks()

      expect(result).toHaveLength(1)
      expect(result[0].job.tags).toEqual([]) // Should handle missing tags gracefully
    })

    it('should return empty array when no bookmarks exist', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tracked_applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [], // No bookmarks
                  error: null
                })
              })
            })
          }
        }
        return {}
      })

      const result = await getUserBookmarks()

      expect(result).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tracked_applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database connection failed' }
                })
              })
            })
          }
        }
        return {}
      })

      const result = await getUserBookmarks()

      // Should return empty array instead of throwing
      expect(result).toEqual([])
    })
  })
}) 