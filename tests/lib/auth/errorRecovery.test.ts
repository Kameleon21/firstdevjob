import {
  calculateRetryDelay,
  isRetryableError,
  generateRecoverySuggestions,
  RecoveryStateManager,
  DEFAULT_RETRY_CONFIG
} from '@/lib/auth/errorRecovery'
import { AuthError } from '@/lib/auth/errorHandling'

describe('Error Recovery System', () => {
  describe('calculateRetryDelay', () => {
    it('should calculate correct delay for exponential backoff', () => {
      const config = DEFAULT_RETRY_CONFIG
      
      expect(calculateRetryDelay(1, config)).toBe(1000) // 1 * 2^0 = 1000ms
      expect(calculateRetryDelay(2, config)).toBe(2000) // 1000 * 2^1 = 2000ms
      expect(calculateRetryDelay(3, config)).toBe(4000) // 1000 * 2^2 = 4000ms
    })

    it('should respect maximum delay limit', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, maxDelay: 5000 }
      
      expect(calculateRetryDelay(10, config)).toBe(5000) // Should cap at maxDelay
    })

    it('should work with custom configurations', () => {
      const customConfig = {
        maxAttempts: 5,
        baseDelay: 500,
        maxDelay: 15000,
        backoffMultiplier: 3
      }
      
      expect(calculateRetryDelay(1, customConfig)).toBe(500)
      expect(calculateRetryDelay(2, customConfig)).toBe(1500) // 500 * 3^1
      expect(calculateRetryDelay(3, customConfig)).toBe(4500) // 500 * 3^2
    })
  })

  describe('isRetryableError', () => {
    it('should identify retryable errors correctly', () => {
      const retryableErrors: AuthError[] = [
        { userMessage: 'test', retryable: true, errorCode: 'TEMPORARILY_UNAVAILABLE' },
        { userMessage: 'test', retryable: true, errorCode: 'SERVER_ERROR' },
        { userMessage: 'test', retryable: true, errorCode: 'NETWORK_ERROR' },
        { userMessage: 'test', retryable: true, errorCode: 'ACCESS_DENIED' },
        { userMessage: 'test', retryable: true, errorCode: 'RATE_LIMITED' }
      ]

      retryableErrors.forEach(error => {
        expect(isRetryableError(error)).toBe(true)
      })
    })

    it('should identify non-retryable errors correctly', () => {
      const nonRetryableErrors: AuthError[] = [
        { userMessage: 'test', retryable: false, errorCode: 'REDIRECT_URI_MISMATCH' },
        { userMessage: 'test', retryable: false, errorCode: 'UNAUTHORIZED_CLIENT' },
        { userMessage: 'test', retryable: true, errorCode: 'INVALID_CREDENTIALS' }, // retryable but not in list
        { userMessage: 'test', retryable: false } // no error code
      ]

      nonRetryableErrors.forEach(error => {
        expect(isRetryableError(error)).toBe(false)
      })
    })

    it('should return false if retryable is false regardless of error code', () => {
      const error: AuthError = {
        userMessage: 'test',
        retryable: false,
        errorCode: 'TEMPORARILY_UNAVAILABLE' // normally retryable
      }
      
      expect(isRetryableError(error)).toBe(false)
    })
  })

  describe('generateRecoverySuggestions', () => {
    it('should generate suggestions for redirect_uri_mismatch', () => {
      const authError: AuthError = {
        userMessage: 'OAuth redirect URI mismatch',
        retryable: false,
        errorCode: 'REDIRECT_URI_MISMATCH'
      }

      const suggestions = generateRecoverySuggestions(authError, 'google')
      
      expect(suggestions).toHaveLength(2)
      expect(suggestions[0].type).toBe('fallback')
      expect(suggestions[0].label).toBe('Use Email Login')
      expect(suggestions[0].priority).toBe('high')
      expect(suggestions[1].type).toBe('contact_support')
    })

    it('should generate suggestions for access_denied', () => {
      const authError: AuthError = {
        userMessage: 'Access denied',
        retryable: true,
        errorCode: 'ACCESS_DENIED'
      }

      const suggestions = generateRecoverySuggestions(authError, 'github')
      
      expect(suggestions).toHaveLength(2)
      expect(suggestions[0].type).toBe('retry')
      expect(suggestions[0].label).toBe('Try GitHub Again')
      expect(suggestions[1].type).toBe('fallback')
    })

    it('should include auto-retry suggestion for temporarily unavailable', () => {
      const authError: AuthError = {
        userMessage: 'Service temporarily unavailable',
        retryable: true,
        errorCode: 'TEMPORARILY_UNAVAILABLE'
      }

      const suggestions = generateRecoverySuggestions(authError, 'google', 1)
      
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0].type).toBe('retry')
      expect(suggestions[0].label).toBe('Retry Automatically')
      expect(suggestions[0].description).toContain('Retrying in')
    })

    it('should not include auto-retry suggestion when max attempts reached', () => {
      const authError: AuthError = {
        userMessage: 'Service temporarily unavailable',
        retryable: true,
        errorCode: 'TEMPORARILY_UNAVAILABLE'
      }

      const suggestions = generateRecoverySuggestions(authError, 'google', 5) // > maxAttempts
      
      const autoRetrySuggestion = suggestions.find(s => s.label === 'Retry Automatically')
      expect(autoRetrySuggestion).toBeUndefined()
    })

    it('should generate suggestions for network errors', () => {
      const authError: AuthError = {
        userMessage: 'Network error',
        retryable: true,
        errorCode: 'NETWORK_ERROR'
      }

      const suggestions = generateRecoverySuggestions(authError)
      
      expect(suggestions[0].type).toBe('retry')
      expect(suggestions[0].label).toBe('Check Connection & Retry')
      expect(suggestions[1].type).toBe('manual')
      expect(suggestions[1].label).toBe('Refresh Page')
    })

    it('should generate suggestions for email auth errors', () => {
      const authError: AuthError = {
        userMessage: 'User already exists',
        retryable: false,
        errorCode: 'USER_ALREADY_EXISTS'
      }

      const suggestions = generateRecoverySuggestions(authError)
      
      expect(suggestions[0].type).toBe('fallback')
      expect(suggestions[0].label).toBe('Sign In Instead')
      expect(suggestions[1].type).toBe('manual')
      expect(suggestions[1].label).toBe('Reset Password')
    })

    it('should sort suggestions by priority', () => {
      const authError: AuthError = {
        userMessage: 'Generic error',
        retryable: true,
        errorCode: 'UNKNOWN_ERROR'
      }

      const suggestions = generateRecoverySuggestions(authError, 'google', 1)
      
      // Should be sorted: high priority first
      const priorities = suggestions.map(s => s.priority)
      const highIndex = priorities.indexOf('high')
      const mediumIndex = priorities.indexOf('medium')
      const lowIndex = priorities.indexOf('low')
      
      if (highIndex !== -1 && mediumIndex !== -1) {
        expect(highIndex).toBeLessThan(mediumIndex)
      }
      if (mediumIndex !== -1 && lowIndex !== -1) {
        expect(mediumIndex).toBeLessThan(lowIndex)
      }
    })
  })

  describe('RecoveryStateManager', () => {
    let manager: RecoveryStateManager

    beforeEach(() => {
      manager = new RecoveryStateManager()
    })

    it('should initialize with default state', () => {
      const state = manager.getState()
      
      expect(state.retryCount).toBe(0)
      expect(state.failedProviders.size).toBe(0)
      expect(state.suggestedActions).toHaveLength(0)
      expect(state.autoRetryEnabled).toBe(true)
    })

    it('should update state correctly', () => {
      const authError: AuthError = {
        userMessage: 'Test error',
        retryable: true,
        errorCode: 'ACCESS_DENIED'
      }

      manager.updateState(authError, 'google')
      const state = manager.getState()
      
      expect(state.retryCount).toBe(1)
      expect(state.failedProviders.has('google')).toBe(true)
      expect(state.suggestedActions.length).toBeGreaterThan(0)
    })

    it('should track multiple failed providers', () => {
      const authError: AuthError = {
        userMessage: 'Test error',
        retryable: true,
        errorCode: 'SERVER_ERROR'
      }

      manager.updateState(authError, 'google')
      manager.updateState(authError, 'github')
      
      const failedProviders = manager.getFailedProviders()
      expect(failedProviders).toContain('google')
      expect(failedProviders).toContain('github')
      expect(failedProviders).toHaveLength(2)
    })

    it('should determine auto-retry eligibility correctly', () => {
      const retryableError: AuthError = {
        userMessage: 'Test error',
        retryable: true,
        errorCode: 'TEMPORARILY_UNAVAILABLE'
      }

      const nonRetryableError: AuthError = {
        userMessage: 'Test error',
        retryable: false,
        errorCode: 'REDIRECT_URI_MISMATCH'
      }

      expect(manager.shouldAutoRetry(retryableError)).toBe(true)
      expect(manager.shouldAutoRetry(nonRetryableError)).toBe(false)
    })

    it('should respect max retry attempts', () => {
      const authError: AuthError = {
        userMessage: 'Test error',
        retryable: true,
        errorCode: 'TEMPORARILY_UNAVAILABLE'
      }

      // Exceed max attempts
      for (let i = 0; i < DEFAULT_RETRY_CONFIG.maxAttempts + 1; i++) {
        manager.updateState(authError, 'google')
      }

      expect(manager.shouldAutoRetry(authError)).toBe(false)
    })

    it('should allow disabling and enabling auto-retry', () => {
      const authError: AuthError = {
        userMessage: 'Test error',
        retryable: true,
        errorCode: 'TEMPORARILY_UNAVAILABLE'
      }

      manager.disableAutoRetry()
      expect(manager.shouldAutoRetry(authError)).toBe(false)

      manager.enableAutoRetry()
      expect(manager.shouldAutoRetry(authError)).toBe(true)
    })

    it('should reset state correctly', () => {
      const authError: AuthError = {
        userMessage: 'Test error',
        retryable: true,
        errorCode: 'ACCESS_DENIED'
      }

      // Build up some state
      manager.updateState(authError, 'google')
      manager.updateState(authError, 'github')
      manager.disableAutoRetry()

      // Reset
      manager.reset()
      const state = manager.getState()

      expect(state.retryCount).toBe(0)
      expect(state.failedProviders.size).toBe(0)
      expect(state.suggestedActions).toHaveLength(0)
      expect(state.autoRetryEnabled).toBe(true)
    })

    it('should generate suggestions when updating state', () => {
      const authError: AuthError = {
        userMessage: 'Access denied',
        retryable: true,
        errorCode: 'ACCESS_DENIED'
      }

      manager.updateState(authError, 'google')
      const state = manager.getState()

      expect(state.suggestedActions.length).toBeGreaterThan(0)
      expect(state.suggestedActions[0].label).toBe('Try Google Again')
    })

    it('should increment retry count on each update', () => {
      const authError: AuthError = {
        userMessage: 'Test error',
        retryable: true,
        errorCode: 'SERVER_ERROR'
      }

      expect(manager.getState().retryCount).toBe(0)
      
      manager.updateState(authError)
      expect(manager.getState().retryCount).toBe(1)
      
      manager.updateState(authError)
      expect(manager.getState().retryCount).toBe(2)
    })
  })
}) 