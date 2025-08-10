'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Mail, Github, Chrome, Eye, EyeOff, ArrowLeft, CheckCircle, RefreshCw, AlertTriangle, Lightbulb, Check } from 'lucide-react'
import { oauthSignIn } from '@/app/auth/actions'
import { createClient } from '@/lib/supabase/client'
import { categorizeEmailAuthError, isDevelopment } from '@/lib/auth/errorHandling'
import { 
  RecoveryStateManager, 
  RecoveryAction, 
  calculateRetryDelay,
  DEFAULT_RETRY_CONFIG
} from '@/lib/auth/errorRecovery'
import { 
  ProgressIndicator, 
  LoadingProgress, 
  MiniStepIndicator, 
  AnimatedDots,
  type ProgressStep 
} from './ProgressIndicator'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [successType, setSuccessType] = useState<'email' | 'oauth' | 'signup'>('email')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [failedOAuthProvider, setFailedOAuthProvider] = useState<'google' | 'github' | null>(null)

  // Progress tracking states
  const [oauthProgress, setOauthProgress] = useState<ProgressStep[]>([])
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [authFlowStep, setAuthFlowStep] = useState(1)
  const [showProgressIndicator, setShowProgressIndicator] = useState(false)

  // Recovery state management
  const [recoveryManager] = useState(() => new RecoveryStateManager())
  const [recoverySuggestions, setRecoverySuggestions] = useState<RecoveryAction[]>([])
  const [isAutoRetrying, setIsAutoRetrying] = useState(false)
  const [retryCountdown, setRetryCountdown] = useState(0)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [])

  if (!isOpen) return null

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError('')
    setShowSuccess(false)
    setSuccessMessage('')
    setSuccessType('email')
    setFailedOAuthProvider(null)
    setIsForgotPassword(false)
    setIsSignUp(false)
    // Reset recovery state
    setRecoverySuggestions([])
    setIsAutoRetrying(false)
    setRetryCountdown(0)
    recoveryManager.reset()
    // Reset progress indicators
    setOauthProgress([])
    setLoadingProgress(0)
    setAuthFlowStep(1)
    setShowProgressIndicator(false)
    // Clear any pending timeouts
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    const supabase = createClient()
    
    try {
      if (isSignUp) {
        // Update sign-up progress
        setAuthFlowStep(1) // Details step active
        
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        
        if (signUpError) {
          const categorizedError = categorizeEmailAuthError(signUpError, true);
          setError(categorizedError.userMessage);
          
          // In development, also log debug information
          if (isDevelopment()) {
            console.log('Sign-up error details:', categorizedError);
          }
          return
        }
        
        // Move to verify step
        setAuthFlowStep(2)
        
        // Success - show success message
        setShowSuccess(true)
        setSuccessMessage('Account created successfully! Please check your email to verify your account before signing in.')
        setSuccessType('signup')
        
        // Complete the flow
        setTimeout(() => setAuthFlowStep(3), 1000)
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (signInError) {
          const categorizedError = categorizeEmailAuthError(signInError, false);
          setError(categorizedError.userMessage);
          
          // In development, also log debug information
          if (isDevelopment()) {
            console.log('Sign-in error details:', categorizedError);
          }
          return
        }
        
        // Success - show success message before closing
        setShowSuccess(true)
        setSuccessMessage('Welcome back! You have been successfully signed in.')
        setSuccessType('email')
        
        // Auto-close modal after showing success message
        setTimeout(() => {
          handleClose()
        }, 1500)
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    const supabase = createClient()
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      
      if (error) {
        setError(error.message)
        return
      }
      
      setShowSuccess(true)
      setSuccessMessage('Password reset email sent! Please check your inbox and follow the instructions to reset your password.')
      setSuccessType('signup') // Use signup type since it doesn't auto-close
    } catch (err) {
      console.error('Reset password error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize OAuth progress steps
  const initializeOAuthProgress = (provider: 'google' | 'github') => {
    const steps: ProgressStep[] = [
      { id: 'initiate', label: 'Initiating', description: 'Starting authentication', status: 'active' },
      { id: 'redirect', label: 'Redirecting', description: `Connecting to ${provider}`, status: 'pending' },
      { id: 'authorize', label: 'Authorizing', description: 'Waiting for approval', status: 'pending' },
      { id: 'complete', label: 'Complete', description: 'Finishing up', status: 'pending' }
    ]
    setOauthProgress(steps)
    setShowProgressIndicator(true)
    setLoadingProgress(0)
  }

  // Update OAuth progress step
  const updateOAuthProgress = (stepId: string, status: ProgressStep['status']) => {
    setOauthProgress(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ))
  }

  // Simulate loading progress for long operations
  const simulateLoadingProgress = () => {
    setLoadingProgress(0)
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const increment = Math.random() * 15 + 5 // Random increment between 5-20%
        const newProgress = prev + increment
        if (newProgress >= 90) {
          clearInterval(interval)
          return 90 // Cap at 90% until actual completion
        }
        return newProgress
      })
    }, 200)
    
    return () => clearInterval(interval)
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    setError('') // Clear any previous errors
    setFailedOAuthProvider(null) // Clear any previous failed provider
    
    // Initialize progress tracking
    initializeOAuthProgress(provider)
    const stopProgress = simulateLoadingProgress()
    
    try {
      // Step 1: Initiate OAuth
      updateOAuthProgress('initiate', 'completed')
      setLoadingProgress(25)
      
      // Show success notification immediately since OAuth will redirect
      setShowSuccess(true)
      setSuccessMessage(`Connecting with ${provider === 'google' ? 'Google' : 'GitHub'}... You'll be redirected momentarily.`)
      setSuccessType('oauth')
      
      // Step 2: Prepare redirect
      updateOAuthProgress('redirect', 'active')
      setLoadingProgress(50)
      
      // Small delay to show the progress
      await new Promise(resolve => setTimeout(resolve, 800))
      
      updateOAuthProgress('redirect', 'completed')
      updateOAuthProgress('authorize', 'active')
      setLoadingProgress(75)
      
      await oauthSignIn(provider)
      
      // Complete progress (this might not be reached due to redirect)
      updateOAuthProgress('authorize', 'completed')
      updateOAuthProgress('complete', 'completed')
      setLoadingProgress(100)
      
    } catch (error) {
      // Hide success message if there was an error
      setShowSuccess(false)
      setShowProgressIndicator(false)
      stopProgress()
      
      // Mark current step as error
      const activeStep = oauthProgress.find(step => step.status === 'active')
      if (activeStep) {
        updateOAuthProgress(activeStep.id, 'error')
      }
      
      console.error('OAuth error:', error)
      setFailedOAuthProvider(provider) // Track which provider failed
      
      if (error instanceof Error) {
        // Use the new error recovery system
        const authError = {
          userMessage: error.message,
          retryable: true,
          errorCode: determineErrorCode(error.message)
        }
        
        // Update recovery state
        recoveryManager.updateState(authError, provider)
        const recoveryState = recoveryManager.getState()
        setRecoverySuggestions(recoveryState.suggestedActions)
        
        // Check if we should auto-retry
        if (recoveryManager.shouldAutoRetry(authError)) {
          startAutoRetry(provider)
        } else {
          setError(error.message)
        }
      } else {
        // Fallback for unknown error types
        setError(`An unexpected error occurred during ${provider === 'google' ? 'Google' : 'GitHub'} login. Please try email login instead.`)
      }
    } finally {
      if (!isAutoRetrying) {
        setIsLoading(false)
      }
    }
  }

  // Helper function to determine error code from message
  const determineErrorCode = (message: string): string => {
    if (message.includes('redirect_uri_mismatch')) return 'REDIRECT_URI_MISMATCH'
    if (message.includes('unauthorized_client')) return 'UNAUTHORIZED_CLIENT'
    if (message.includes('access_denied')) return 'ACCESS_DENIED'
    if (message.includes('temporarily_unavailable')) return 'TEMPORARILY_UNAVAILABLE'
    if (message.includes('server_error')) return 'SERVER_ERROR'
    if (message.includes('Failed to connect')) return 'NETWORK_ERROR'
    return 'OAUTH_ERROR'
  }

  // Auto-retry functionality
  const startAutoRetry = (provider: 'google' | 'github') => {
    setIsAutoRetrying(true)
    const delay = calculateRetryDelay(recoveryManager.getState().retryCount, DEFAULT_RETRY_CONFIG)
    setRetryCountdown(Math.ceil(delay / 1000))
    
    // Start countdown
    countdownIntervalRef.current = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    // Execute retry after delay
    retryTimeoutRef.current = setTimeout(async () => {
      setRetryCountdown(0)
      try {
        await handleOAuthSignIn(provider)
        setIsAutoRetrying(false)
        setError('')
        setRecoverySuggestions([])
      } catch (retryError) {
        setIsAutoRetrying(false)
        if (retryError instanceof Error) {
          setError(retryError.message)
        }
      }
    }, delay)
  }

  // Cancel auto-retry
  const cancelAutoRetry = () => {
    setIsAutoRetrying(false)
    setRetryCountdown(0)
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
    recoveryManager.disableAutoRetry()
  }

  const handleRetryOAuth = () => {
    if (failedOAuthProvider) {
      // Reset recovery state for manual retry
      recoveryManager.enableAutoRetry()
      setRecoverySuggestions([])
      setError('')
      handleOAuthSignIn(failedOAuthProvider)
    }
  }

  // Success state
  if (showSuccess) {
    const getSuccessIcon = () => {
      switch (successType) {
        case 'email':
          return <Check className="w-16 h-16 text-success mx-auto animate-pulse" />
        case 'oauth':
          return <CheckCircle className="w-16 h-16 text-success mx-auto animate-bounce" />
        case 'signup':
          return <CheckCircle className="w-16 h-16 text-success mx-auto" />
        default:
          return <CheckCircle className="w-16 h-16 text-success mx-auto" />
      }
    }

    const getSuccessTitle = () => {
      switch (successType) {
        case 'email':
          return 'Welcome Back!'
        case 'oauth':
          return 'Connecting...'
        case 'signup':
          return 'Account Created!'
        default:
          return isForgotPassword ? 'Email Sent!' : 'Success!'
      }
    }

    const shouldAutoClose = successType === 'email' || successType === 'oauth'

    return (
      <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-2xl border border-border w-full max-w-md mx-auto shadow-2xl">
          <div className="p-8 text-center">
            <div className="mb-6">
              {getSuccessIcon()}
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {getSuccessTitle()}
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {successMessage}
            </p>
            
            {/* Show different actions based on success type */}
            {successType === 'oauth' && (
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Redirecting you now...
                </div>
              </div>
            )}
            
            {!shouldAutoClose && (
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors font-medium"
              >
                Got it
              </button>
            )}
            
            {shouldAutoClose && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4" />
                {successType === 'email' ? 'Closing automatically...' : 'Redirecting...'}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl border border-border w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center">
            {isForgotPassword && (
              <button
                onClick={() => {
                  setIsForgotPassword(false)
                  setError('')
                }}
                className="mr-3 text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-xl font-semibold text-foreground">
              {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Sign In'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Forgot Password Form */}
          {isForgotPassword ? (
            <>
              <p className="text-muted-foreground mb-6 text-sm">
                                 Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              {/* Error Message with Recovery System */}
              {(error || isAutoRetrying) && (
                <div className="mb-4 p-3 bg-error-background border border-error rounded-lg">
                  {/* Auto-retry indicator */}
                  {isAutoRetrying && (
                    <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                      <RefreshCw className="animate-spin text-blue-600" size={16} />
                      <div className="text-blue-700 text-sm">
                        <p className="font-medium">Auto-retrying in {retryCountdown} seconds...</p>
                        <p className="text-xs">Attempting to reconnect automatically</p>
                      </div>
                      <button
                        onClick={cancelAutoRetry}
                        className="ml-auto px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  
                  {/* Error message */}
                  {error && (
                    <p className="text-error text-sm mb-2">{error}</p>
                  )}
                  
                  {/* Recovery suggestions */}
                  {recoverySuggestions.length > 0 && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="text-amber-600" size={16} />
                        <span className="text-amber-800 text-sm font-medium">Recovery Suggestions</span>
                      </div>
                      <div className="space-y-2">
                        {recoverySuggestions.slice(0, 3).map((suggestion, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="flex-shrink-0 mt-0.5">
                              {suggestion.priority === 'high' && <AlertTriangle className="text-red-500" size={12} />}
                              {suggestion.priority === 'medium' && <div className="w-3 h-3 bg-yellow-400 rounded-full" />}
                              {suggestion.priority === 'low' && <div className="w-3 h-3 bg-gray-400 rounded-full" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-amber-800 text-xs font-medium">{suggestion.label}</p>
                              <p className="text-amber-700 text-xs">{suggestion.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Development-specific debug info */}
                  {isDevelopment() && error && (
                    <details className="mt-2">
                      <summary className="text-xs text-error/70 cursor-pointer hover:text-error">
                        🔍 Debug Info (Development Only)
                      </summary>
                      <div className="mt-2 p-2 bg-error/10 rounded text-xs text-error/80">
                        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
                        <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
                        <p><strong>Component:</strong> AuthModal</p>
                        <p><strong>Action:</strong> {isSignUp ? 'Sign Up' : 'Sign In'}</p>
                        <p><strong>Retry Count:</strong> {recoveryManager.getState().retryCount}</p>
                        <p><strong>Failed Providers:</strong> {recoveryManager.getFailedProviders().join(', ') || 'None'}</p>
                        <p><strong>Browser:</strong> {navigator.userAgent.slice(0, 50)}...</p>
                      </div>
                    </details>
                  )}
                  
                  {/* Action buttons */}
                  {failedOAuthProvider && !isAutoRetrying && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleRetryOAuth}
                        disabled={isLoading}
                        className="px-3 py-1 text-xs bg-error text-error-background rounded hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Try {failedOAuthProvider === 'google' ? 'Google' : 'GitHub'} Again
                      </button>
                      <button
                        onClick={() => {
                          setError('')
                          setFailedOAuthProvider(null)
                          setRecoverySuggestions([])
                          recoveryManager.reset()
                        }}
                        className="px-3 py-1 text-xs text-error hover:text-error/80 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-muted-foreground mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* OAuth Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-foreground text-background rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="animate-spin" size={20} />
                      <span className="flex items-center gap-1">
                        {showSuccess && successType === 'oauth' ? 'Success! Redirecting' : 'Connecting to Google'}
                        <AnimatedDots className="text-background" />
                      </span>
                    </>
                  ) : (
                    <>
                      <Chrome size={20} />
                      Continue with Google
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleOAuthSignIn('github')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-border"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="animate-spin" size={20} />
                      <span className="flex items-center gap-1">
                        {showSuccess && successType === 'oauth' ? 'Success! Redirecting' : 'Connecting to GitHub'}
                        <AnimatedDots className="text-foreground" />
                      </span>
                    </>
                  ) : (
                    <>
                      <Github size={20} />
                      Continue with GitHub
                    </>
                  )}
                </button>
              </div>

              {/* OAuth Progress Indicator */}
              {showProgressIndicator && oauthProgress.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Authentication Progress</h4>
                    <p className="text-xs text-blue-600">Please wait while we connect you securely</p>
                  </div>
                  <ProgressIndicator 
                    steps={oauthProgress} 
                    variant="horizontal" 
                    className="mb-3"
                  />
                  <LoadingProgress 
                    progress={loadingProgress}
                    variant="determinate"
                    color="blue"
                    className="mt-2"
                  />
                </div>
              )}

              {/* Sign-up Progress Steps */}
              {isSignUp && !showProgressIndicator && (
                <div className="mb-4">
                  <MiniStepIndicator 
                    currentStep={authFlowStep}
                    totalSteps={3}
                    labels={['Details', 'Verify', 'Complete']}
                    className="justify-center"
                  />
                </div>
              )}

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-background text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              {/* Error Message with Recovery System */}
              {(error || isAutoRetrying) && (
                <div className="mb-4 p-3 bg-error-background border border-error rounded-lg">
                  {/* Auto-retry indicator */}
                  {isAutoRetrying && (
                    <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                      <RefreshCw className="animate-spin text-blue-600" size={16} />
                      <div className="text-blue-700 text-sm">
                        <p className="font-medium">Auto-retrying in {retryCountdown} seconds...</p>
                        <p className="text-xs">Attempting to reconnect automatically</p>
                      </div>
                      <button
                        onClick={cancelAutoRetry}
                        className="ml-auto px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  
                  {/* Error message */}
                  {error && (
                    <p className="text-error text-sm mb-2">{error}</p>
                  )}
                  
                  {/* Recovery suggestions */}
                  {recoverySuggestions.length > 0 && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="text-amber-600" size={16} />
                        <span className="text-amber-800 text-sm font-medium">Recovery Suggestions</span>
                      </div>
                      <div className="space-y-2">
                        {recoverySuggestions.slice(0, 3).map((suggestion, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="flex-shrink-0 mt-0.5">
                              {suggestion.priority === 'high' && <AlertTriangle className="text-red-500" size={12} />}
                              {suggestion.priority === 'medium' && <div className="w-3 h-3 bg-yellow-400 rounded-full" />}
                              {suggestion.priority === 'low' && <div className="w-3 h-3 bg-gray-400 rounded-full" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-amber-800 text-xs font-medium">{suggestion.label}</p>
                              <p className="text-amber-700 text-xs">{suggestion.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Development-specific debug info */}
                  {isDevelopment() && error && (
                    <details className="mt-2">
                      <summary className="text-xs text-error/70 cursor-pointer hover:text-error">
                        🔍 Debug Info (Development Only)
                      </summary>
                      <div className="mt-2 p-2 bg-error/10 rounded text-xs text-error/80">
                        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
                        <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
                        <p><strong>Component:</strong> AuthModal</p>
                        <p><strong>Action:</strong> {isSignUp ? 'Sign Up' : 'Sign In'}</p>
                        <p><strong>Retry Count:</strong> {recoveryManager.getState().retryCount}</p>
                        <p><strong>Failed Providers:</strong> {recoveryManager.getFailedProviders().join(', ') || 'None'}</p>
                        <p><strong>Browser:</strong> {navigator.userAgent.slice(0, 50)}...</p>
                      </div>
                    </details>
                  )}
                  
                  {/* Action buttons */}
                  {failedOAuthProvider && !isAutoRetrying && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleRetryOAuth}
                        disabled={isLoading}
                        className="px-3 py-1 text-xs bg-error text-error-background rounded hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Try {failedOAuthProvider === 'google' ? 'Google' : 'GitHub'} Again
                      </button>
                      <button
                        onClick={() => {
                          setError('')
                          setFailedOAuthProvider(null)
                          setRecoverySuggestions([])
                          recoveryManager.reset()
                        }}
                        className="px-3 py-1 text-xs text-error hover:text-error/80 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-muted-foreground mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                {/* Forgot Password Link */}
                {!isSignUp && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true)
                        setError('')
                      }}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
                </button>
              </form>

              {/* Toggle between Sign In / Sign Up */}
              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  {isSignUp ? 'Already have an account? ' : 'Don\'t have an account? '}
                  <button
                    onClick={() => {
                      setIsSignUp(!isSignUp)
                      setError('')
                    }}
                    className="font-medium text-primary hover:underline"
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 