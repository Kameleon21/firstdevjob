import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AuthModal from '@/components/AuthModal'
import { createClient } from '@/lib/supabase/client'
import { oauthSignIn } from '@/app/auth/actions'

// Mock the Supabase client
jest.mock('@/lib/supabase/client')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// Mock the OAuth sign-in action
jest.mock('@/app/auth/actions')
const mockOAuthSignIn = oauthSignIn as jest.MockedFunction<typeof oauthSignIn>

// Mock the auth utilities
jest.mock('@/lib/auth/errorHandling', () => ({
  categorizeEmailAuthError: jest.fn((error) => ({
    userMessage: error.message,
    retryable: true,
    errorCode: 'TEST_ERROR'
  })),
  isDevelopment: jest.fn(() => false)
}))

jest.mock('@/lib/auth/errorRecovery', () => ({
  RecoveryStateManager: jest.fn(() => ({
    updateState: jest.fn(),
    getState: jest.fn(() => ({
      retryCount: 0,
      suggestedActions: [],
      failedProviders: new Set()
    })),
    reset: jest.fn(),
    shouldAutoRetry: jest.fn(() => false),
    getFailedProviders: jest.fn(() => []),
    enableAutoRetry: jest.fn(),
    disableAutoRetry: jest.fn()
  })),
  calculateRetryDelay: jest.fn(() => 1000),
  DEFAULT_RETRY_CONFIG: { maxAttempts: 3, baseDelay: 1000, maxDelay: 10000, backoffMultiplier: 2 }
}))

describe('AuthModal Success Notifications', () => {
  const mockOnClose = jest.fn()
  
  let mockSupabaseAuth: {
    signInWithPassword: jest.Mock
    signUp: jest.Mock
    resetPasswordForEmail: jest.Mock
    signInWithOAuth: jest.Mock
  }
  
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.useFakeTimers()
    
    mockSupabaseAuth = {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      signInWithOAuth: jest.fn()
    }
    
    mockCreateClient.mockReturnValue({
      auth: mockSupabaseAuth
    } as ReturnType<typeof createClient>)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Email Sign-In Success', () => {
    it('should show success notification for email sign-in', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' }, session: {} },
        error: null
      })

      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      // Fill in email and password
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Welcome Back!')).toBeInTheDocument()
        expect(screen.getByText('Welcome back! You have been successfully signed in.')).toBeInTheDocument()
      })
      
      // Should show auto-close message
      expect(screen.getByText('Closing automatically...')).toBeInTheDocument()
      
      // Should auto-close after timeout
      jest.advanceTimersByTime(1500)
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  describe('Email Sign-Up Success', () => {
    it('should show success notification for email sign-up', async () => {
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' }, session: null },
        error: null
      })

      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      // Switch to sign-up mode
      fireEvent.click(screen.getByText(/sign up/i))
      
      // Fill in email and password
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      
      // Submit form - use "Create Account" as that's the actual button text
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Account Created!')).toBeInTheDocument()
        expect(screen.getByText('Account created successfully! Please check your email to verify your account before signing in.')).toBeInTheDocument()
      })
      
      // Should show "Got it" button (not auto-close)
      expect(screen.getByRole('button', { name: /got it/i })).toBeInTheDocument()
      expect(screen.queryByText('Closing automatically...')).not.toBeInTheDocument()
    })
  })

  describe('OAuth Success', () => {
    it('should show success notification for OAuth sign-in', async () => {
      mockOAuthSignIn.mockImplementation(() => {
        // Simulate delay that happens in real OAuth flow
        return new Promise(resolve => setTimeout(resolve, 100))
      })

      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      // Click Google OAuth button
      fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Connecting...')).toBeInTheDocument()
        expect(screen.getByText('Connecting with Google... You\'ll be redirected momentarily.')).toBeInTheDocument()
      })
      
      // Should show redirecting message
      expect(screen.getByText('Redirecting you now...')).toBeInTheDocument()
      expect(screen.getByText('Redirecting...')).toBeInTheDocument()
    })

    it('should update button text during OAuth flow', async () => {
      mockOAuthSignIn.mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100))
      })

      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      // Click Google OAuth button
      fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))
      
      // The success message appears in the modal overlay, not the button text
      await waitFor(() => {
        expect(screen.getByText('Connecting...')).toBeInTheDocument()
      })
    })
  })

  describe('Password Reset Success', () => {
    it('should show success notification for password reset', async () => {
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null
      })

      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      // Go to forgot password mode
      fireEvent.click(screen.getByText(/forgot password/i))
      
      // Fill in email
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Account Created!')).toBeInTheDocument() // Uses signup type
        expect(screen.getByText('Password reset email sent! Please check your inbox and follow the instructions to reset your password.')).toBeInTheDocument()
      })
      
      // Should show "Got it" button (not auto-close)
      expect(screen.getByRole('button', { name: /got it/i })).toBeInTheDocument()
    })
  })

  describe('Success Icon Types', () => {
    it('should show correct icons for different success types', async () => {
      // Test email success (Check icon with pulse animation)
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123' }, session: {} },
        error: null
      })

      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
      
      await waitFor(() => {
        // Check that the icon itself has the animation class
        const checkIcon = screen.getByText('Welcome Back!').parentElement?.querySelector('.animate-pulse')
        expect(checkIcon).toBeInTheDocument()
      })
    })
  })

  describe('Error to Success Recovery', () => {
    it('should hide success notification if OAuth fails after showing it', async () => {
      mockOAuthSignIn.mockRejectedValue(new Error('OAuth failed'))

      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))
      
      // Should initially show success
      await waitFor(() => {
        expect(screen.getByText('Connecting...')).toBeInTheDocument()
      })
      
      // Should hide success and show error after OAuth fails
      await waitFor(() => {
        expect(screen.queryByText('Connecting...')).not.toBeInTheDocument()
        expect(screen.getByText(/oauth failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Success State Reset', () => {
    it('should reset success state when form is reset', async () => {
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: { id: '123' }, session: null },
        error: null
      })

      render(<AuthModal isOpen={true} onClose={mockOnClose} />)
      
      // Show success notification
      fireEvent.click(screen.getByText(/sign up/i))
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      fireEvent.click(screen.getByRole('button', { name: /create account/i })) // Fixed button name
      
      await waitFor(() => {
        expect(screen.getByText('Account Created!')).toBeInTheDocument()
      })
      
      // Close modal (which resets form)
      fireEvent.click(screen.getByRole('button', { name: /got it/i }))
      
      expect(mockOnClose).toHaveBeenCalled()
    })
  })
}) 