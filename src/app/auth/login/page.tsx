'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  const getMessageType = () => {
    if (message?.includes('Check email')) return 'success'
    if (message?.includes('Error') || message?.includes('Could not')) return 'error'
    return 'info'
  }

  const messageType = getMessageType()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl shadow-xl p-8 max-w-md mx-auto text-center">
        <div className="mb-6">
          {messageType === 'success' && (
            <svg className="w-16 h-16 text-success mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {messageType === 'error' && (
            <svg className="w-16 h-16 text-error mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )}
          {messageType === 'info' && (
            <svg className="w-16 h-16 text-info mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        
        <h1 className="text-2xl font-semibold text-foreground mb-4">
          {messageType === 'success' && 'Check Your Email'}
          {messageType === 'error' && 'Authentication Error'}
          {messageType === 'info' && 'Authentication'}
        </h1>
        
        {message && (
          <p className={`mb-6 ${
            messageType === 'success' ? 'text-success' :
            messageType === 'error' ? 'text-error' : 'text-muted-foreground'
          }`}>
            {message}
          </p>
        )}
        
        <Link
          href="/"
          className="inline-flex px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
} 