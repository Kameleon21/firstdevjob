import { jest } from '@jest/globals'

// Mock data types
export type MockUser = {
  id: string
  email: string
  role?: string
}

export type MockJob = {
  id: number
  title: string
  company: string
  location: string
  url: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  tags?: Array<{ id: number; name: string }>
}

export type MockBookmark = {
  id: number
  user_id: string
  job_id: number
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'accepted'
  notes?: string
  job?: MockJob
}

// Mock database state
let mockUsers: MockUser[] = []
let mockJobs: MockJob[] = []
let mockBookmarks: MockBookmark[] = []
let mockTags: Array<{ id: number; name: string }> = []
let mockProfiles: Array<{ id: string; full_name?: string; role: string }> = []

// Helper functions for test setup
export const resetMockDatabase = () => {
  mockUsers = []
  mockJobs = []
  mockBookmarks = []
  mockTags = []
  mockProfiles = []
}

export const setMockUser = (user: MockUser) => {
  mockUsers = [user]
  // Also add to profiles if not exists
  if (!mockProfiles.find(p => p.id === user.id)) {
    mockProfiles.push({
      id: user.id,
      role: user.role || 'user'
    })
  }
}

export const setMockJobs = (jobs: MockJob[]) => {
  mockJobs = jobs
}

export const setMockBookmarks = (bookmarks: MockBookmark[]) => {
  mockBookmarks = bookmarks
}

export const setMockTags = (tags: Array<{ id: number; name: string }>) => {
  mockTags = tags
}

// Mock Supabase query builder
const createMockQueryBuilder = (table: string) => {
  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
  }

  // Mock implementations based on table
  switch (table) {
    case 'jobs':
      queryBuilder.select.mockImplementation((columns?: string) => {
        const mockResponse = {
          data: columns?.includes('tags') 
            ? mockJobs.map(job => ({
                ...job,
                job_tags: job.tags?.map(tag => ({ tags: tag })) || []
              }))
            : mockJobs,
          error: null
        }
        return Promise.resolve(mockResponse)
      })
      
      queryBuilder.insert.mockImplementation((data: any) => {
        const newJob: MockJob = {
          id: mockJobs.length + 1,
          created_at: new Date().toISOString(),
          status: 'pending',
          ...data
        }
        mockJobs.push(newJob)
        return Promise.resolve({ data: [newJob], error: null })
      })
      
      queryBuilder.update.mockImplementation((data: any) => {
        // Update logic would go here
        return Promise.resolve({ data: null, error: null })
      })
      break

    case 'tracked_applications':
      queryBuilder.select.mockImplementation(() => {
        return Promise.resolve({ data: mockBookmarks, error: null })
      })
      
      queryBuilder.insert.mockImplementation((data: any) => {
        const newBookmark: MockBookmark = {
          id: mockBookmarks.length + 1,
          ...data
        }
        mockBookmarks.push(newBookmark)
        return Promise.resolve({ data: [newBookmark], error: null })
      })
      
      queryBuilder.update.mockImplementation((data: any) => {
        return Promise.resolve({ data: null, error: null })
      })
      
      queryBuilder.delete.mockImplementation(() => {
        return Promise.resolve({ data: null, error: null })
      })
      break

    case 'tags':
      queryBuilder.select.mockImplementation(() => {
        return Promise.resolve({ data: mockTags, error: null })
      })
      
      queryBuilder.upsert.mockImplementation((data: any) => {
        const tags = Array.isArray(data) ? data : [data]
        const newTags = tags.map((tag: any, index: number) => ({
          id: mockTags.length + index + 1,
          ...tag
        }))
        mockTags.push(...newTags)
        return { select: () => Promise.resolve({ data: newTags, error: null }) }
      })
      break

    case 'profiles':
      queryBuilder.select.mockImplementation(() => {
        return Promise.resolve({ data: mockProfiles, error: null })
      })
      
      queryBuilder.update.mockImplementation((data: any) => {
        return Promise.resolve({ data: null, error: null })
      })
      break

    default:
      queryBuilder.select.mockResolvedValue({ data: [], error: null })
      queryBuilder.insert.mockResolvedValue({ data: [], error: null })
      queryBuilder.update.mockResolvedValue({ data: null, error: null })
      queryBuilder.delete.mockResolvedValue({ data: null, error: null })
  }

  return queryBuilder
}

// Mock Supabase auth
export const mockSupabaseAuth = {
  getUser: jest.fn().mockResolvedValue({
    data: { user: mockUsers[0] || null },
    error: null
  }),
  signInWithPassword: jest.fn().mockResolvedValue({
    data: { user: mockUsers[0] || null, session: {} },
    error: null
  }),
  signUp: jest.fn().mockResolvedValue({
    data: { user: mockUsers[0] || null, session: {} },
    error: null
  }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
  resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: jest.fn().mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } }
  }),
  signInWithOAuth: jest.fn().mockResolvedValue({
    data: { url: 'https://oauth-url.com' },
    error: null
  }),
}

// Mock Supabase client
export const createMockSupabaseClient = () => ({
  auth: mockSupabaseAuth,
  from: jest.fn().mockImplementation((table: string) => createMockQueryBuilder(table)),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
})

// Main mock for Supabase modules
export const mockSupabaseClient = createMockSupabaseClient()

// Mock the Supabase client creation
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: jest.fn(() => mockSupabaseClient)
}))

export { mockSupabaseClient } 