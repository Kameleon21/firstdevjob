import { NextRequest } from 'next/server'

// Mock NextResponse
const mockRedirect = jest.fn()
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    redirect: mockRedirect,
  },
}))

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    exchangeCodeForSession: jest.fn(),
  },
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

import { GET } from '../../../../src/app/auth/callback/route'

describe('OAuth Callback Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRedirect.mockReturnValue({ status: 302 })
  })

  describe('Successful authentication', () => {
    it('should handle successful OAuth callback in development', async () => {
      process.env.NODE_ENV = 'development'
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            app_metadata: { provider: 'google' }
          }
        },
        error: null,
      })

      const request = {
        url: 'http://localhost:3000/auth/callback?code=test_code',
        headers: new Map(),
      } as unknown as NextRequest

      await GET(request)

      expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('test_code')
      expect(mockRedirect).toHaveBeenCalledWith('http://localhost:3000/')
    })

    it('should handle successful OAuth callback in production with forwarded host', async () => {
      process.env.NODE_ENV = 'production'
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            app_metadata: { provider: 'google' }
          }
        },
        error: null,
      })

      const mockHeaders = new Map()
      mockHeaders.set('x-forwarded-host', 'firstdevjob.vercel.app')

      const request = {
        url: 'https://firstdevjob.vercel.app/auth/callback?code=test_code',
        headers: mockHeaders,
      } as unknown as NextRequest

      await GET(request)

      expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('test_code')
      expect(mockRedirect).toHaveBeenCalledWith('https://firstdevjob.vercel.app/')
    })

    it('should handle successful OAuth callback in production without forwarded host', async () => {
      process.env.NODE_ENV = 'production'
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            app_metadata: { provider: 'google' }
          }
        },
        error: null,
      })

      const mockHeaders = new Map()
      const request = {
        url: 'https://firstdevjob.vercel.app/auth/callback?code=test_code',
        headers: mockHeaders,
      } as unknown as NextRequest

      await GET(request)

      expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('test_code')
      expect(mockRedirect).toHaveBeenCalledWith('https://firstdevjob.vercel.app/')
    })

    it('should handle custom redirect path in next parameter', async () => {
      process.env.NODE_ENV = 'development'
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            app_metadata: { provider: 'google' }
          }
        },
        error: null,
      })

      const request = {
        url: 'http://localhost:3000/auth/callback?code=test_code&next=/dashboard',
        headers: new Map(),
      } as unknown as NextRequest

      await GET(request)

      expect(mockRedirect).toHaveBeenCalledWith('http://localhost:3000/dashboard')
    })
  })

  describe('Error scenarios', () => {
    it('should redirect to error page when no code is provided', async () => {
      const request = {
        url: 'http://localhost:3000/auth/callback',
        headers: new Map(),
      } as unknown as NextRequest

      await GET(request)

      expect(mockSupabaseClient.auth.exchangeCodeForSession).not.toHaveBeenCalled()
      expect(mockRedirect).toHaveBeenCalledWith('http://localhost:3000/auth/auth-code-error')
    })

    it('should redirect to error page when code exchange fails', async () => {
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        error: { message: 'Invalid code' },
      })

      const request = {
        url: 'http://localhost:3000/auth/callback?code=invalid_code',
        headers: new Map(),
      } as unknown as NextRequest

      await GET(request)

      expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('invalid_code')
      expect(mockRedirect).toHaveBeenCalledWith('http://localhost:3000/auth/auth-code-error')
    })

    it('should handle empty code parameter', async () => {
      const request = {
        url: 'http://localhost:3000/auth/callback?code=',
        headers: new Map(),
      } as unknown as NextRequest

      await GET(request)

      expect(mockSupabaseClient.auth.exchangeCodeForSession).not.toHaveBeenCalled()
      expect(mockRedirect).toHaveBeenCalledWith('http://localhost:3000/auth/auth-code-error')
    })
  })

  describe('URL construction edge cases', () => {
    it('should handle URLs with existing query parameters', async () => {
      process.env.NODE_ENV = 'development'
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            app_metadata: { provider: 'google' }
          }
        },
        error: null,
      })

      const request = {
        url: 'http://localhost:3000/auth/callback?code=test_code&next=/dashboard?tab=profile',
        headers: new Map(),
      } as unknown as NextRequest

      await GET(request)

      expect(mockRedirect).toHaveBeenCalledWith('http://localhost:3000/dashboard?tab=profile')
    })

    it('should handle root path correctly', async () => {
      process.env.NODE_ENV = 'development'
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            app_metadata: { provider: 'google' }
          }
        },
        error: null,
      })

      const request = {
        url: 'http://localhost:3000/auth/callback?code=test_code&next=/',
        headers: new Map(),
      } as unknown as NextRequest

      await GET(request)

      expect(mockRedirect).toHaveBeenCalledWith('http://localhost:3000/')
    })
  })

  afterEach(() => {
    delete process.env.NODE_ENV
  })
}) 