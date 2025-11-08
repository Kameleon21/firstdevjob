// Error recovery mechanisms for authentication
// Implements retry logic, recovery suggestions, and graceful fallbacks

import { AuthError } from './errorHandling'

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number // in milliseconds
  maxDelay: number
  backoffMultiplier: number
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'manual' | 'contact_support'
  label: string
  description: string
  priority: 'high' | 'medium' | 'low'
  action?: () => Promise<void>
}

export interface RecoveryState {
  retryCount: number
  lastAttempt: Date
  failedProviders: Set<string>
  suggestedActions: RecoveryAction[]
  autoRetryEnabled: boolean
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
}

// Calculate delay for exponential backoff
export const calculateRetryDelay = (attempt: number, config: RetryConfig): number => {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1)
  return Math.min(delay, config.maxDelay)
}

// Determine if an error is retryable
export const isRetryableError = (authError: AuthError): boolean => {
  if (!authError.retryable) return false
  
  const retryableErrorCodes = [
    'TEMPORARILY_UNAVAILABLE',
    'SERVER_ERROR',
    'NETWORK_ERROR',
    'ACCESS_DENIED', // User might change their mind
    'RATE_LIMITED'
  ]
  
  return authError.errorCode ? retryableErrorCodes.includes(authError.errorCode) : false
}

// Generate recovery suggestions based on error type
export const generateRecoverySuggestions = (
  authError: AuthError,
  provider?: 'google' | 'github',
  retryCount: number = 0
): RecoveryAction[] => {
  const suggestions: RecoveryAction[] = []
  
  switch (authError.errorCode) {
    case 'REDIRECT_URI_MISMATCH':
    case 'UNAUTHORIZED_CLIENT':
      suggestions.push({
        type: 'fallback',
        label: 'Use Email Login',
        description: 'Try logging in with your email and password instead.',
        priority: 'high'
      })
      suggestions.push({
        type: 'contact_support',
        label: 'Contact Support',
        description: 'This appears to be a configuration issue. Please contact support for assistance.',
        priority: 'medium'
      })
      break
      
    case 'ACCESS_DENIED':
      suggestions.push({
        type: 'retry',
        label: `Try ${provider === 'google' ? 'Google' : 'GitHub'} Again`,
        description: 'You may have accidentally denied access. Try the authorization again.',
        priority: 'high'
      })
      suggestions.push({
        type: 'fallback',
        label: 'Use Email Login',
        description: 'Skip OAuth and use email/password authentication.',
        priority: 'medium'
      })
      break
      
    case 'TEMPORARILY_UNAVAILABLE':
    case 'SERVER_ERROR':
      if (retryCount < DEFAULT_RETRY_CONFIG.maxAttempts) {
        suggestions.push({
          type: 'retry',
          label: 'Retry Automatically',
          description: `Service is temporarily unavailable. Retrying in ${calculateRetryDelay(retryCount + 1, DEFAULT_RETRY_CONFIG) / 1000} seconds.`,
          priority: 'high'
        })
      }
      suggestions.push({
        type: 'fallback',
        label: 'Use Email Login',
        description: 'Try email authentication while the service recovers.',
        priority: 'medium'
      })
      break
      
    case 'NETWORK_ERROR':
      suggestions.push({
        type: 'retry',
        label: 'Check Connection & Retry',
        description: 'Please check your internet connection and try again.',
        priority: 'high'
      })
      suggestions.push({
        type: 'manual',
        label: 'Refresh Page',
        description: 'Try refreshing the page if the connection issue persists.',
        priority: 'medium'
      })
      break
      
    case 'RATE_LIMITED':
      suggestions.push({
        type: 'manual',
        label: 'Wait and Retry',
        description: 'Please wait a few minutes before attempting to log in again.',
        priority: 'high'
      })
      suggestions.push({
        type: 'fallback',
        label: 'Use Different Method',
        description: 'Try a different authentication method if available.',
        priority: 'medium'
      })
      break
      
    case 'USER_ALREADY_EXISTS':
      suggestions.push({
        type: 'fallback',
        label: 'Sign In Instead',
        description: 'An account with this email already exists. Try signing in.',
        priority: 'high'
      })
      suggestions.push({
        type: 'manual',
        label: 'Reset Password',
        description: 'If you forgot your password, you can reset it.',
        priority: 'medium'
      })
      break
      
    case 'INVALID_CREDENTIALS':
      suggestions.push({
        type: 'retry',
        label: 'Check Credentials',
        description: 'Double-check your email and password and try again.',
        priority: 'high'
      })
      suggestions.push({
        type: 'manual',
        label: 'Reset Password',
        description: 'Reset your password if you can\'t remember it.',
        priority: 'medium'
      })
      break
      
    case 'EMAIL_NOT_CONFIRMED':
      suggestions.push({
        type: 'manual',
        label: 'Check Email',
        description: 'Look for a confirmation email and click the verification link.',
        priority: 'high'
      })
      suggestions.push({
        type: 'manual',
        label: 'Resend Confirmation',
        description: 'Request a new confirmation email if you can\'t find the original.',
        priority: 'medium'
      })
      break
      
    case 'WEAK_PASSWORD':
      suggestions.push({
        type: 'retry',
        label: 'Use Stronger Password',
        description: 'Create a password with at least 6 characters, including letters and numbers.',
        priority: 'high'
      })
      suggestions.push({
        type: 'manual',
        label: 'Password Tips',
        description: 'Use a mix of uppercase, lowercase, numbers, and special characters.',
        priority: 'low'
      })
      break
      
    default:
      // Generic fallback suggestions
      if (isRetryableError(authError) && retryCount < DEFAULT_RETRY_CONFIG.maxAttempts) {
        suggestions.push({
          type: 'retry',
          label: 'Try Again',
          description: 'This might be a temporary issue. Please try again.',
          priority: 'high'
        })
      }
      suggestions.push({
        type: 'fallback',
        label: 'Use Alternative Method',
        description: 'Try a different authentication method.',
        priority: 'medium'
      })
      suggestions.push({
        type: 'manual',
        label: 'Refresh Page',
        description: 'Refresh the page and try again.',
        priority: 'low'
      })
  }
  
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

// Auto-retry function with exponential backoff
export const executeAutoRetry = async (
  retryFunction: () => Promise<void>,
  authError: AuthError,
  retryCount: number = 0,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<void> => {
  if (!isRetryableError(authError) || retryCount >= config.maxAttempts) {
    throw new Error(authError.userMessage)
  }
  
  const delay = calculateRetryDelay(retryCount + 1, config)
  
  // Add jitter to prevent thundering herd
  const jitterDelay = delay + Math.random() * 1000

  // Reduce noisy logs in production
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `Retrying authentication in ${jitterDelay}ms (attempt ${retryCount + 1}/${config.maxAttempts})`
    )
  }
  
  await new Promise(resolve => setTimeout(resolve, jitterDelay))
  
  try {
    await retryFunction()
  } catch (error) {
    // If retry fails, attempt again or give up
    if (retryCount + 1 < config.maxAttempts) {
      return executeAutoRetry(retryFunction, authError, retryCount + 1, config)
    } else {
      throw error
    }
  }
}

// Create recovery state manager
export class RecoveryStateManager {
  private state: RecoveryState = {
    retryCount: 0,
    lastAttempt: new Date(),
    failedProviders: new Set(),
    suggestedActions: [],
    autoRetryEnabled: true
  }
  
  updateState(authError: AuthError, provider?: string): void {
    this.state.retryCount += 1
    this.state.lastAttempt = new Date()
    
    if (provider) {
      this.state.failedProviders.add(provider)
    }
    
    this.state.suggestedActions = generateRecoverySuggestions(
      authError, 
      provider as 'google' | 'github', 
      this.state.retryCount
    )
  }
  
  getState(): RecoveryState {
    return { ...this.state }
  }
  
  reset(): void {
    this.state = {
      retryCount: 0,
      lastAttempt: new Date(),
      failedProviders: new Set(),
      suggestedActions: [],
      autoRetryEnabled: true
    }
  }
  
  shouldAutoRetry(authError: AuthError): boolean {
    return this.state.autoRetryEnabled && 
           isRetryableError(authError) && 
           this.state.retryCount < DEFAULT_RETRY_CONFIG.maxAttempts
  }
  
  getFailedProviders(): string[] {
    return Array.from(this.state.failedProviders)
  }
  
  disableAutoRetry(): void {
    this.state.autoRetryEnabled = false
  }
  
  enableAutoRetry(): void {
    this.state.autoRetryEnabled = true
  }
} 