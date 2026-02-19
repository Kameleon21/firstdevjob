'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, isVisible, onClose, duration = 5000 }: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    } else {
      setIsAnimating(false)
    }
  }, [isVisible, onClose, duration])

  if (!isVisible && !isAnimating) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-error" />
      case 'info':
        return <Info className="w-5 h-5 text-info" />
      default:
        return <Info className="w-5 h-5 text-info" />
    }
  }

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-success-background border-success'
      case 'error':
        return 'bg-error-background border-error'
      case 'info':
        return 'bg-info-background border-info'
      default:
        return 'bg-muted border-border'
    }
  }

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-4 z-50 max-w-md w-[calc(100%-2rem)] sm:w-full transform transition-all duration-300 ease-in-out ${
        isVisible
          ? 'opacity-100'
          : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className={`${getBgColor()} border rounded-lg shadow-lg p-4`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors ml-2"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
} 