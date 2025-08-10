import { 
  categorizeOAuthError, 
  categorizeEmailAuthError, 
  isDevelopment, 
  logAuthError 
} from '@/lib/auth/errorHandling'

// Mock the environment
const originalEnv = process.env

describe('Environment-aware Error Handling', () => {
  beforeEach(() => {
    // Clear console mocks
    jest.clearAllMocks()
    // Reset environment
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('isDevelopment', () => {
    it('should return true when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development'
      expect(isDevelopment()).toBe(true)
    })

    it('should return false when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production'
      expect(isDevelopment()).toBe(false)
    })

    it('should return false when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test'
      expect(isDevelopment()).toBe(false)
    })
  })

  describe('categorizeOAuthError', () => {
    beforeEach(() => {
      // Mock console methods
      jest.spyOn(console, 'group').mockImplementation()
      jest.spyOn(console, 'log').mockImplementation()
      jest.spyOn(console, 'groupEnd').mockImplementation()
    })

    describe('in development environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development'
      })

      it('should provide detailed error message for redirect_uri_mismatch', () => {
        const error = new Error('redirect_uri_mismatch: Invalid redirect URI')
        const result = categorizeOAuthError(error, 'google')

        expect(result.userMessage).toContain('OAuth redirect URI mismatch for Google')
        expect(result.userMessage).toContain('Google Cloud Console')
        expect(result.errorCode).toBe('REDIRECT_URI_MISMATCH')
        expect(result.retryable).toBe(false)
        expect(result.debugMessage).toContain('Redirect URI mismatch')
      })

      it('should provide detailed error message for unauthorized_client', () => {
        const error = new Error('unauthorized_client: Invalid client')
        const result = categorizeOAuthError(error, 'github')

        expect(result.userMessage).toContain('GitHub OAuth client is not authorized')
        expect(result.userMessage).toContain('GitHub Developer Settings')
        expect(result.errorCode).toBe('UNAUTHORIZED_CLIENT')
        expect(result.retryable).toBe(false)
      })

      it('should log detailed debug information', () => {
        const error = new Error('test error')
        categorizeOAuthError(error, 'google')

        expect(console.group).toHaveBeenCalledWith(expect.stringContaining('OAuth Error Debug Info'))
        expect(console.log).toHaveBeenCalledWith('Provider:', 'google')
        expect(console.log).toHaveBeenCalledWith('Error object:', error)
        expect(console.groupEnd).toHaveBeenCalled()
      })
    })

    describe('in production environment', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production'
      })

      it('should provide user-friendly error message for redirect_uri_mismatch', () => {
        const error = new Error('redirect_uri_mismatch: Invalid redirect URI')
        const result = categorizeOAuthError(error, 'google')

        expect(result.userMessage).toContain('configuration issue with Google login')
        expect(result.userMessage).toContain('try email login')
        expect(result.userMessage).not.toContain('Google Cloud Console')
      })

      it('should provide user-friendly error message for unauthorized_client', () => {
        const error = new Error('unauthorized_client: Invalid client')
        const result = categorizeOAuthError(error, 'github')

        expect(result.userMessage).toContain('GitHub login is currently not available')
        expect(result.userMessage).not.toContain('Developer Settings')
      })

      it('should not log detailed debug information', () => {
        const error = new Error('test error')
        categorizeOAuthError(error, 'google')

        expect(console.group).not.toHaveBeenCalled()
      })
    })

    it('should handle access_denied errors', () => {
      const error = new Error('access_denied: User denied access')
      const result = categorizeOAuthError(error, 'google')

      expect(result.errorCode).toBe('ACCESS_DENIED')
      expect(result.retryable).toBe(true)
    })

    it('should handle temporarily_unavailable errors', () => {
      const error = new Error('temporarily_unavailable: Service unavailable')
      const result = categorizeOAuthError(error, 'github')

      expect(result.userMessage).toContain('GitHub login is temporarily unavailable')
      expect(result.errorCode).toBe('TEMPORARILY_UNAVAILABLE')
      expect(result.retryable).toBe(true)
    })

    it('should handle server_error with environment-specific messages', () => {
      process.env.NODE_ENV = 'development'
      const error = new Error('server_error: Internal server error')
      const devResult = categorizeOAuthError(error, 'google')

      expect(devResult.userMessage).toContain('Google server error')
      expect(devResult.userMessage).toContain('network connectivity')

      process.env.NODE_ENV = 'production'
      const prodResult = categorizeOAuthError(error, 'google')

      expect(prodResult.userMessage).toContain('Authentication server is experiencing issues')
      expect(prodResult.userMessage).not.toContain('network connectivity')
    })

    it('should handle network errors', () => {
      const error = new Error('Failed to fetch')
      const result = categorizeOAuthError(error, 'google')

      expect(result.userMessage).toContain('Unable to connect to Google')
      expect(result.errorCode).toBe('NETWORK_ERROR')
      expect(result.retryable).toBe(true)
    })

    it('should handle generic errors with environment-specific messages', () => {
      process.env.NODE_ENV = 'development'
      const error = new Error('Unknown OAuth error')
      const devResult = categorizeOAuthError(error, 'google')

      expect(devResult.userMessage).toContain('Google OAuth error: Unknown OAuth error')
      expect(devResult.userMessage).toContain('Check console for details')

      process.env.NODE_ENV = 'production'
      const prodResult = categorizeOAuthError(error, 'google')

      expect(prodResult.userMessage).toContain('Google login failed')
      expect(prodResult.userMessage).toContain('try again or use email login')
    })
  })

  describe('categorizeEmailAuthError', () => {
    beforeEach(() => {
      jest.spyOn(console, 'group').mockImplementation()
      jest.spyOn(console, 'log').mockImplementation()
      jest.spyOn(console, 'groupEnd').mockImplementation()
    })

    it('should handle already registered error', () => {
      const error = new Error('User already registered')
      const result = categorizeEmailAuthError(error, true)

      expect(result.userMessage).toContain('account with this email already exists')
      expect(result.errorCode).toBe('USER_ALREADY_EXISTS')
      expect(result.retryable).toBe(false)
    })

    it('should handle weak password error', () => {
      const error = new Error('Password too weak password')
      const result = categorizeEmailAuthError(error, true)

      expect(result.userMessage).toContain('Password is too weak')
      expect(result.errorCode).toBe('WEAK_PASSWORD')
      expect(result.retryable).toBe(true)
    })

    it('should handle invalid credentials with environment-specific messages', () => {
      const error = new Error('Invalid login credentials')
      
      process.env.NODE_ENV = 'development'
      const devResult = categorizeEmailAuthError(error, false)
      expect(devResult.userMessage).toContain('verify email confirmation status')

      process.env.NODE_ENV = 'production'
      const prodResult = categorizeEmailAuthError(error, false)
      expect(prodResult.userMessage).not.toContain('verify email confirmation status')
    })

    it('should handle email not confirmed error', () => {
      const error = new Error('Email not confirmed')
      const result = categorizeEmailAuthError(error, false)

      expect(result.userMessage).toContain('check your email and click the confirmation link')
      expect(result.errorCode).toBe('EMAIL_NOT_CONFIRMED')
      expect(result.retryable).toBe(false)
    })

    it('should handle rate limiting error', () => {
      const error = new Error('Too many requests')
      const result = categorizeEmailAuthError(error, false)

      expect(result.userMessage).toContain('Too many attempts')
      expect(result.errorCode).toBe('RATE_LIMITED')
      expect(result.retryable).toBe(true)
    })

    it('should log debug information in development', () => {
      process.env.NODE_ENV = 'development'
      const error = new Error('Test error')
      categorizeEmailAuthError(error, true)

      expect(console.group).toHaveBeenCalledWith('🔍 Email Auth Error Debug Info')
      expect(console.log).toHaveBeenCalledWith('Operation:', 'Sign Up')
    })

    it('should not log debug information in production', () => {
      process.env.NODE_ENV = 'production'
      const error = new Error('Test error')
      categorizeEmailAuthError(error, false)

      expect(console.group).not.toHaveBeenCalled()
    })
  })

  describe('logAuthError', () => {
    beforeEach(() => {
      jest.spyOn(console, 'group').mockImplementation()
      jest.spyOn(console, 'log').mockImplementation()
      jest.spyOn(console, 'groupEnd').mockImplementation()
      jest.spyOn(console, 'error').mockImplementation()
    })

    it('should log detailed information in development', () => {
      process.env.NODE_ENV = 'development'
      const errorDetails = {
        provider: 'google' as const,
        originalError: new Error('Test error'),
        timestamp: new Date(),
        categorizedError: {
          userMessage: 'Test message',
          errorCode: 'TEST_ERROR',
          retryable: true
        }
      }

      logAuthError(errorDetails)

      expect(console.group).toHaveBeenCalledWith('🚨 Authentication Error Log')
      expect(console.log).toHaveBeenCalledWith('Provider:', 'google')
      expect(console.log).toHaveBeenCalledWith('Error Code:', 'TEST_ERROR')
      expect(console.groupEnd).toHaveBeenCalled()
    })

    it('should log minimal information in production', () => {
      process.env.NODE_ENV = 'production'
      const errorDetails = {
        provider: 'github' as const,
        originalError: new Error('Test error'),
        timestamp: new Date(),
        categorizedError: {
          userMessage: 'Test message',
          errorCode: 'TEST_ERROR',
          retryable: false
        }
      }

      logAuthError(errorDetails)

      expect(console.error).toHaveBeenCalledWith('Auth Error:', {
        provider: 'github',
        errorCode: 'TEST_ERROR',
        retryable: false,
        timestamp: errorDetails.timestamp.toISOString()
      })
      expect(console.group).not.toHaveBeenCalled()
    })
  })
}) 