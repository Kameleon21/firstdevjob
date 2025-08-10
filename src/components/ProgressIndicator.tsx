import React from 'react'
import { Check, ArrowRight, RefreshCw } from 'lucide-react'

export interface ProgressStep {
  id: string
  label: string
  description?: string
  status: 'pending' | 'active' | 'completed' | 'error'
}

interface ProgressIndicatorProps {
  steps: ProgressStep[]
  variant?: 'horizontal' | 'vertical'
  showLabels?: boolean
  className?: string
}

export function ProgressIndicator({ 
  steps, 
  variant = 'horizontal', 
  showLabels = true,
  className = '' 
}: ProgressIndicatorProps) {
  const getStepIcon = (step: ProgressStep, index: number) => {
    switch (step.status) {
      case 'completed':
        return <Check className="w-4 h-4 text-white" />
      case 'active':
        return <RefreshCw className="w-4 h-4 text-white animate-spin" />
      case 'error':
        return <span className="w-4 h-4 text-white text-sm font-bold">!</span>
      case 'pending':
      default:
        return <span className="w-4 h-4 text-gray-400 text-sm font-medium">{index + 1}</span>
    }
  }

  const getStepColor = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-500 border-green-500'
      case 'active':
        return 'bg-blue-500 border-blue-500'
      case 'error':
        return 'bg-red-500 border-red-500'
      case 'pending':
      default:
        return 'bg-gray-200 border-gray-300 text-gray-400'
    }
  }

  const getConnectorColor = (currentIndex: number) => {
    const currentStep = steps[currentIndex]
    
    if (currentStep?.status === 'completed') {
      return 'bg-green-500'
    } else if (currentStep?.status === 'active' || currentStep?.status === 'error') {
      return 'bg-gray-300'
    }
    return 'bg-gray-300'
  }

  if (variant === 'vertical') {
    return (
      <div className={`space-y-4 ${className}`}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStepColor(step)}`}>
                {getStepIcon(step, index)}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-px h-8 mt-2 ${getConnectorColor(index)}`} />
              )}
            </div>
            {showLabels && (
              <div className="ml-3 flex-1">
                <h4 className={`text-sm font-medium ${
                  step.status === 'active' ? 'text-blue-600' : 
                  step.status === 'completed' ? 'text-green-600' :
                  step.status === 'error' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </h4>
                {step.description && (
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Horizontal variant
  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStepColor(step)}`}>
              {getStepIcon(step, index)}
            </div>
            {showLabels && (
              <div className="mt-2 text-center">
                <p className={`text-xs font-medium ${
                  step.status === 'active' ? 'text-blue-600' : 
                  step.status === 'completed' ? 'text-green-600' :
                  step.status === 'error' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-gray-400 mt-1">{step.description}</p>
                )}
              </div>
            )}
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-px mx-4 ${getConnectorColor(index)}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// Loading progress bar component
interface LoadingProgressProps {
  progress: number // 0-100
  label?: string
  sublabel?: string
  variant?: 'determinate' | 'indeterminate'
  color?: 'blue' | 'green' | 'red'
  className?: string
}

export function LoadingProgress({ 
  progress, 
  label, 
  sublabel, 
  variant = 'determinate',
  color = 'blue',
  className = '' 
}: LoadingProgressProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500'
  }

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {variant === 'determinate' && (
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        {variant === 'indeterminate' ? (
          <div role="status" aria-live="polite" className="relative">
            {!label && <span className="sr-only">Loading...</span>}
            <div className={`h-2 ${colorClasses[color]} rounded-full animate-pulse`} style={{ width: '30%' }} />
          </div>
        ) : (
          <div 
            className={`h-2 ${colorClasses[color]} rounded-full transition-all duration-300 ease-out`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        )}
      </div>
      {sublabel && (
        <p className="text-xs text-gray-500 mt-1">{sublabel}</p>
      )}
    </div>
  )
}

// Animated dots for loading states
interface AnimatedDotsProps {
  className?: string
}

export function AnimatedDots({ className = '' }: AnimatedDotsProps) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

// Mini step indicator for simple flows
interface MiniStepIndicatorProps {
  currentStep: number
  totalSteps: number
  labels?: string[]
  className?: string
}

export function MiniStepIndicator({ 
  currentStep, 
  totalSteps, 
  labels,
  className = '' 
}: MiniStepIndicatorProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1
        const isActive = stepNumber === currentStep
        const isCompleted = stepNumber < currentStep
        
        return (
          <React.Fragment key={index}>
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2
              ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                isActive ? 'bg-blue-500 border-blue-500 text-white' :
                'bg-gray-100 border-gray-300 text-gray-500'}
            `}>
              {isCompleted ? <Check className="w-3 h-3" /> : stepNumber}
            </div>
            {labels && labels[index] && (
              <span className={`text-xs ${
                isActive ? 'text-blue-600 font-medium' : 
                isCompleted ? 'text-green-600' : 'text-gray-500'
              }`}>
                {labels[index]}
              </span>
            )}
            {index < totalSteps - 1 && (
              <ArrowRight className="w-3 h-3 text-gray-400" />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
} 