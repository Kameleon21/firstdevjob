import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { mockSupabaseClient, resetMockDatabase } from '../mocks/supabase'

// Mock Next.js navigation
const mockRedirect = jest.fn()
jest.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

// Mock Next.js cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

// Mock the Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}))

// Import after mocking
import { emailLogin, emailSignup, signOut, oauthSignIn } from '@/app/auth/actions'

describe('Auth Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetMockDatabase()
  })

  describe('emailLogin', () => {
    it('should successfully log in a user with valid credentials', async () => {
      // Mock successful login
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' }, session: {} },
        error: null
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')

      await emailLogin(formData)

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(mockRedirect).toHaveBeenCalledWith('/')
    })

    it('should redirect to error page for invalid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'wrongpassword')

      await emailLogin(formData)

      expect(mockRedirect).toHaveBeenCalledWith('/auth/login?message=Could not authenticate user')
    })
  })

  describe('emailSignup', () => {
    it('should successfully create a new user account', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: { id: 'user-2', email: 'newuser@example.com' }, session: null },
        error: null
      })

      const formData = new FormData()
      formData.append('email', 'newuser@example.com')
      formData.append('password', 'password123')

      await emailSignup(formData)

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123'
      })
      expect(mockRedirect).toHaveBeenCalledWith('/auth/login?message=Check email to continue sign in process')
    })

    it('should handle signup error', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' }
      })

      const formData = new FormData()
      formData.append('email', 'existing@example.com')
      formData.append('password', 'password123')

      await emailSignup(formData)

      expect(mockRedirect).toHaveBeenCalledWith('/auth/login?message=Error signing up user')
    })
  })

  describe('signOut', () => {
    it('should successfully sign out user', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null
      })

      await signOut()

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
      expect(mockRedirect).toHaveBeenCalledWith('/')
    })
  })

  describe('oauthSignIn', () => {
    it('should initiate GitHub OAuth flow', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://github.com/oauth', provider: 'github' },
        error: null
      })

      await oauthSignIn('github')

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: expect.stringContaining('/auth/callback')
        }
      })
      expect(mockRedirect).toHaveBeenCalledWith('https://github.com/oauth')
    })

    it('should handle OAuth error', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: null, provider: 'github' },
        error: { message: 'OAuth provider error' }
      })

      await expect(oauthSignIn('github')).rejects.toThrow('GitHub login failed. Please try again or use email login.')
    })

    it('should support google provider', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://google.com/oauth', provider: 'google' },
        error: null
      })

      await oauthSignIn('google')

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback')
        }
      })
      expect(mockRedirect).toHaveBeenCalledWith('https://google.com/oauth')
    })
  })
}) 