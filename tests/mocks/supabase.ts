import { jest } from '@jest/globals'

// Mock data interfaces
export interface MockUser {
  id: string
  email: string
  user_metadata?: {
    name?: string
    full_name?: string
  }
  role?: 'user' | 'moderator' | 'admin'
}

export interface MockJob {
  id: number
  title: string
  company: string
  location: string
  url?: string
  apply_url?: string
  status?: 'pending' | 'approved' | 'rejected'
  is_approved?: boolean
  created_at?: string
  tags?: Array<{ id: number; name: string }>
}

export interface MockBookmark {
  id: number
  user_id: string
  job_id: number
  created_at: string
}

// Mock database state
let mockUsers: MockUser[] = []
let mockJobs: MockJob[] = []
let mockBookmarks: MockBookmark[] = []
let mockTags: Array<{ id: number; name: string }> = [
  { id: 1, name: 'React' },
  { id: 2, name: 'TypeScript' },
  { id: 3, name: 'Node.js' },
  { id: 4, name: 'Python' },
  { id: 5, name: 'JavaScript' }
]

// Helper functions to manage mock data
export const resetMockDatabase = () => {
  mockUsers = []
  mockJobs = []
  mockBookmarks = []
}

export const setMockUsers = (users: MockUser[]) => {
  mockUsers = users
}

export const setMockJobs = (jobs: MockJob[]) => {
  mockJobs = jobs
}

export const setMockBookmarks = (bookmarks: MockBookmark[]) => {
  mockBookmarks = bookmarks
}

export const addMockUser = (user: MockUser) => {
  mockUsers.push(user)
}

export const addMockJob = (job: MockJob) => {
  const newJob = { ...job, id: job.id || Date.now() }
  mockJobs.push(newJob)
  return newJob
}

// Factory functions for creating mock data
export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: `user-${Date.now()}`,
  email: 'test@example.com',
  role: 'user',
  ...overrides
})

export const createMockJob = (overrides: Partial<MockJob> = {}): MockJob => ({
  id: Date.now(),
  title: 'Test Job',
  company: 'Test Company',
  location: 'Remote',
  url: 'https://example.com/job',
  status: 'pending',
  is_approved: false,
  created_at: new Date().toISOString(),
  ...overrides
})

export const createMockBookmark = (overrides: Partial<MockBookmark> = {}): MockBookmark => ({
  id: Date.now(),
  user_id: 'test-user',
  job_id: 1,
  created_at: new Date().toISOString(),
  ...overrides
})

// Create a mock query builder that supports chaining
const createMockQueryBuilder = (table: string) => {
  const queryBuilder = {
    insert: jest.fn().mockReturnValue(queryBuilder),
    select: jest.fn().mockReturnValue(queryBuilder),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockReturnValue(queryBuilder),
    delete: jest.fn().mockReturnValue(queryBuilder),
    eq: jest.fn().mockReturnValue(queryBuilder),
    in: jest.fn().mockReturnValue(queryBuilder),
    gte: jest.fn().mockReturnValue(queryBuilder),
    lte: jest.fn().mockReturnValue(queryBuilder),
    order: jest.fn().mockReturnValue(queryBuilder),
    limit: jest.fn().mockReturnValue(queryBuilder),
    range: jest.fn().mockReturnValue(queryBuilder),
    // Add promise-like behavior for queries without explicit resolution
    then: jest.fn(),
    catch: jest.fn(),
  }

  // Setup default behaviors based on table
  if (table === 'job') {
    queryBuilder.insert.mockImplementation((data) => {
      const newJob = { id: Date.now(), ...data }
      return {
        ...queryBuilder,
        select: jest.fn().mockReturnValue({
          ...queryBuilder,
          single: jest.fn().mockResolvedValue({
            data: newJob,
            error: null
          })
        })
      }
    })
  }

  if (table === 'tags') {
    queryBuilder.select.mockResolvedValue({
      data: mockTags,
      error: null
    })
    queryBuilder.in.mockImplementation((column, values) => ({
      ...queryBuilder,
      then: (resolve) => resolve({
        data: mockTags.filter(tag => values.includes(tag.name)),
        error: null
      })
    }))
  }

  if (table === 'job_tags') {
    queryBuilder.insert.mockResolvedValue({
      data: null,
      error: null
    })
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
export const mockSupabaseClient = {
  auth: mockSupabaseAuth,
  from: jest.fn().mockImplementation((table: string) => createMockQueryBuilder(table)),
  rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: null, error: null }),
      download: jest.fn().mockResolvedValue({ data: null, error: null }),
      remove: jest.fn().mockResolvedValue({ data: null, error: null }),
    })
  }
}

// Export mock functions for easy access in tests
export const getMockJobs = () => [...mockJobs]
export const getMockUsers = () => [...mockUsers]
export const getMockBookmarks = () => [...mockBookmarks]
export const getMockTags = () => [...mockTags] 