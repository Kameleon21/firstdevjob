import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Utility function to construct secure redirect URLs
function buildRedirectUrl(origin: string, path: string, forwardedHost?: string): string {
  const isLocalEnv = process.env.NODE_ENV === 'development'
  
  if (isLocalEnv) {
    // Development environment - use the origin directly
    return `${origin}${path}`
  }
  
  // Production environment - use forwarded host if available for better load balancer support
  if (forwardedHost) {
    return `https://${forwardedHost}${path}`
  }
  
  // Fallback to origin for production
  return `${origin}${path}`
}

// Validate redirect path to prevent open redirect vulnerabilities
function validateRedirectPath(path: string): string {
  // Ensure path starts with / and doesn't contain external URLs
  if (!path.startsWith('/') || path.includes('://')) {
    return '/' // Default to home page for security
  }
  
  // Additional security: prevent redirects to auth-related paths that could cause loops
  if (path.startsWith('/auth/callback') || path.startsWith('/auth/auth-code-error')) {
    return '/'
  }
  
  return path
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  
  // Validate and sanitize the redirect path
  const redirectPath = validateRedirectPath(next)
  
  // Log authentication attempt for monitoring (limit verbosity in production)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`OAuth callback received: code=${code ? 'present' : 'missing'}, next=${redirectPath}`)
  }
  
  // Handle missing or empty code
  if (!code || code.trim() === '') {
    console.warn('OAuth callback: No authorization code provided')
    return NextResponse.redirect(buildRedirectUrl(origin, '/auth/auth-code-error', request.headers.get('x-forwarded-host') || undefined))
  }
  
  try {
    const supabase = await createClient()
    
    // Exchange the authorization code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('OAuth callback: Code exchange failed:', error.message)
      } else {
        console.error('OAuth callback: Code exchange failed')
      }
      return NextResponse.redirect(buildRedirectUrl(origin, '/auth/auth-code-error', request.headers.get('x-forwarded-host') || undefined))
    }
    
    // Log successful authentication
    if (process.env.NODE_ENV !== 'production') {
      console.log('OAuth callback: Authentication successful', {
        userId: data.user?.id,
        email: data.user?.email,
        provider: data.user?.app_metadata?.provider,
        redirectTo: redirectPath
      })
    } else {
      console.log('OAuth callback: Authentication successful')
    }
    
    // Successful authentication - redirect to the intended destination
    const forwardedHost = request.headers.get('x-forwarded-host')
    return NextResponse.redirect(buildRedirectUrl(origin, redirectPath, forwardedHost || undefined))
    
  } catch (error) {
    // Handle unexpected errors
    if (process.env.NODE_ENV !== 'production') {
      console.error('OAuth callback: Unexpected error:', error)
    } else {
      console.error('OAuth callback: Unexpected error')
    }
    return NextResponse.redirect(buildRedirectUrl(origin, '/auth/auth-code-error', request.headers.get('x-forwarded-host') || undefined))
  }
} 