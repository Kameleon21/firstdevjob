'use client'

import React, { useState } from 'react'
import { X, Mail, Github, Chrome, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { oauthSignIn } from '@/app/auth/actions'
import { createClient } from '@/lib/supabase/client'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError('')
    setShowSuccess(false)
    setSuccessMessage('')
    setIsForgotPassword(false)
    setIsSignUp(false)
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
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        
        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('An account with this email already exists. Try signing in instead.')
          } else if (signUpError.message.includes('weak password')) {
            setError('Password is too weak. Please use at least 6 characters.')
          } else {
            setError(signUpError.message)
          }
          return
        }
        
        // Success - show success message
        setShowSuccess(true)
        setSuccessMessage('Account created successfully! Please check your email to verify your account before signing in.')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials and try again.')
          } else if (signInError.message.includes('Email not confirmed')) {
            setError('Please check your email and click the confirmation link before signing in.')
          } else {
            setError(signInError.message)
          }
          return
        }
        
        // Success - close modal
        handleClose()
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
    } catch (err) {
      console.error('Reset password error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    try {
      await oauthSignIn(provider)
    } catch (error) {
      console.error('OAuth error:', error)
      setIsLoading(false)
    }
  }

  // Success state
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-2xl border border-border w-full max-w-md mx-auto">
          <div className="p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-success mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {isForgotPassword ? 'Email Sent!' : isSignUp ? 'Account Created!' : 'Success!'}
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {successMessage}
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors font-medium"
            >
              Got it
            </button>
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

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-error-background border border-error rounded-lg">
                  <p className="text-error text-sm">{error}</p>
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
                  <Chrome size={20} />
                  Continue with Google
                </button>
                
                <button
                  onClick={() => handleOAuthSignIn('github')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-border"
                >
                  <Github size={20} />
                  Continue with Github
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-background text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-error-background border border-error rounded-lg">
                  <p className="text-error text-sm">{error}</p>
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