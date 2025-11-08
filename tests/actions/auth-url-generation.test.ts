import { jest } from '@jest/globals'

// Mock the Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithOAuth: jest.fn(),
    resetPasswordForEmail: jest.fn(),
  },
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock Next.js functions
const mockRedirect = jest.fn()
jest.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

// Store original environment variables
const originalEnv = process.env

describe('Authentication URL Generation Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variables
    process.env = { ...originalEnv }
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.NEXT_PUBLIC_VERCEL_URL
  })

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv
  })

  describe('OAuth URL Generation', () => {
    it('should use NEXT_PUBLIC_SITE_URL when available (first priority)', async () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://firstdevjob.vercel.app'
      process.env.NEXT_PUBLIC_VERCEL_URL = 'https://different-url.vercel.app'

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth-provider.com/auth' },
        error: null,
      })

      const { oauthSignIn } = await import('@/app/auth/actions')
      await oauthSignIn('google')

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'https://firstdevjob.vercel.app/auth/callback',
        },
      })
    })

    it('should use NEXT_PUBLIC_VERCEL_URL when NEXT_PUBLIC_SITE_URL is not available (second priority)', async () => {
      process.env.NEXT_PUBLIC_VERCEL_URL = 'firstdevjob.vercel.app'

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth-provider.com/auth' },
        error: null,
      })

      const { oauthSignIn } = await import('@/app/auth/actions')
      await oauthSignIn('google')

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'https://firstdevjob.vercel.app/auth/callback',
        },
      })
    })

    it('should fallback to localhost when neither environment variable is available', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth-provider.com/auth' },
        error: null,
      })

      const { oauthSignIn } = await import('@/app/auth/actions')
      await oauthSignIn('google')

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      })
    })

    it('should work with GitHub provider using the same URL logic', async () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://firstdevjob.vercel.app'

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://github.com/login/oauth/authorize' },
        error: null,
      })

      const { oauthSignIn } = await import('@/app/auth/actions')
      await oauthSignIn('github')

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: 'https://firstdevjob.vercel.app/auth/callback',
        },
      })
    })
  })

  describe('Password Reset URL Generation', () => {
    it('should use NEXT_PUBLIC_SITE_URL for password reset (first priority)', async () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://firstdevjob.vercel.app'
      process.env.NEXT_PUBLIC_VERCEL_URL = 'https://different-url.vercel.app'

      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      })

      const { resetPassword } = await import('@/app/auth/actions')
      const formData = new FormData()
      formData.append('email', 'test@example.com')

      await resetPassword(formData)

      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'https://firstdevjob.vercel.app/auth/reset-password',
        }
      )
    })

    it('should use NEXT_PUBLIC_VERCEL_URL for password reset when NEXT_PUBLIC_SITE_URL is not available', async () => {
      process.env.NEXT_PUBLIC_VERCEL_URL = 'firstdevjob.vercel.app'

      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      })

      const { resetPassword } = await import('@/app/auth/actions')
      const formData = new FormData()
      formData.append('email', 'test@example.com')

      await resetPassword(formData)

      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'https://firstdevjob.vercel.app/auth/reset-password',
        }
      )
    })

    it('should fallback to localhost for password reset when neither environment variable is available', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      })

      const { resetPassword } = await import('@/app/auth/actions')
      const formData = new FormData()
      formData.append('email', 'test@example.com')

      await resetPassword(formData)

      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost:3000/auth/reset-password',
        }
      )
    })
  })

  describe('URL Format Validation', () => {
    it('should add https:// to NEXT_PUBLIC_VERCEL_URL when not present', async () => {
      process.env.NEXT_PUBLIC_VERCEL_URL = 'firstdevjob.vercel.app' // No protocol

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth-provider.com/auth' },
        error: null,
      })

      const { oauthSignIn } = await import('@/app/auth/actions')
      await oauthSignIn('google')

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'https://firstdevjob.vercel.app/auth/callback',
        },
      })
    })

    it('should not add https:// to NEXT_PUBLIC_VERCEL_URL when already present', async () => {
      process.env.NEXT_PUBLIC_VERCEL_URL = 'https://firstdevjob.vercel.app'

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth-provider.com/auth' },
        error: null,
      })

      const { oauthSignIn } = await import('@/app/auth/actions')
      await oauthSignIn('google')

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'https://firstdevjob.vercel.app/auth/callback',
        },
      })
    })

    it('should add trailing slash when not present', async () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://firstdevjob.vercel.app' // No trailing slash

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth-provider.com/auth' },
        error: null,
      })

      const { oauthSignIn } = await import('@/app/auth/actions')
      await oauthSignIn('google')

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'https://firstdevjob.vercel.app/auth/callback',
        },
      })
    })

    it('should not add trailing slash when already present', async () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://firstdevjob.vercel.app/'

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth-provider.com/auth' },
        error: null,
      })

      const { oauthSignIn } = await import('@/app/auth/actions')
      await oauthSignIn('google')

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'https://firstdevjob.vercel.app/auth/callback',
        },
      })
    })

    it('should keep localhost protocol intact for fallback', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth-provider.com/auth' },
        error: null,
      })

      const { oauthSignIn } = await import('@/app/auth/actions')
      await oauthSignIn('google')

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string environment variables', async () => {
      process.env.NEXT_PUBLIC_SITE_URL = ''
      process.env.NEXT_PUBLIC_VERCEL_URL = ''

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth-provider.com/auth' },
        error: null,
      })

      const { oauthSignIn } = await import('@/app/auth/actions')
      await oauthSignIn('google')

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      })
    })

    it('should handle undefined environment variables', async () => {
      process.env.NEXT_PUBLIC_SITE_URL = undefined
      process.env.NEXT_PUBLIC_VERCEL_URL = undefined

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth-provider.com/auth' },
        error: null,
      })

      const { oauthSignIn } = await import('@/app/auth/actions')
      await oauthSignIn('google')

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      })
    })

    it('should handle whitespace-only environment variables', async () => {
      process.env.NEXT_PUBLIC_SITE_URL = '   '
      process.env.NEXT_PUBLIC_VERCEL_URL = '   '

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth-provider.com/auth' },
        error: null,
      })

      const { oauthSignIn } = await import('@/app/auth/actions')
      await oauthSignIn('google')

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      })
    })
  })
}) 