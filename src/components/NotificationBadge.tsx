'use client'

import { useEffect, useState } from 'react'
import { getPendingJobsCount } from '@/app/actions/admin'

interface NotificationBadgeProps {
  children: React.ReactNode
  className?: string
}

export default function NotificationBadge({ children, className = '' }: NotificationBadgeProps) {
  const [count, setCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const pendingCount = await getPendingJobsCount()
        setCount(pendingCount)
      } catch (error) {
        console.error('Error fetching pending jobs count:', error)
        setCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPendingCount()
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`relative inline-block ${className}`}>
      {children}
      {!isLoading && count > 0 && (
        <div className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 border-2 border-black">
          {count > 99 ? '99+' : count}
        </div>
      )}
    </div>
  )
} 