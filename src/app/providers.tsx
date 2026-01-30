'use client'

import { SWRConfig } from 'swr'
import { ReactNode, useMemo } from 'react'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import ThemeProvider from '@/components/ThemeProvider'

// Type for SWR keys that can be strings or arrays
type SWRKey = string | [string, ...unknown[]]

// Default fetcher function that works with server actions
const fetcher = async (key: SWRKey) => {
  // Handle different key formats for SWR
  if (typeof key === 'string') {
    // For regular API routes
    const response = await fetch(key)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  }
  
  // For server actions - key format: [actionName, ...args]
  const [actionName] = key
  
  // This will be dynamically handled by the components
  // Each component will pass the server action function directly
  throw new Error(`Server action fetcher not implemented for: ${actionName}`)
}

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  const convex = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      throw new Error('Missing NEXT_PUBLIC_CONVEX_URL environment variable')
    }
    return new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL)
  }, [])

  return (
    <ConvexProvider client={convex}>
      <SWRConfig
        value={{
          fetcher,
          // Cache data for 30 seconds by default
          dedupingInterval: 30000,
          // Revalidate on focus for better UX
          revalidateOnFocus: true,
          // Don't revalidate on reconnect to avoid unnecessary requests
          revalidateOnReconnect: false,
          // Retry on error with exponential backoff
          errorRetryCount: 3,
          errorRetryInterval: 1000,
          // Keep data fresh for 5 minutes
          refreshInterval: 0, // Only refresh on explicit user action
        }}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </SWRConfig>
    </ConvexProvider>
  )
}
