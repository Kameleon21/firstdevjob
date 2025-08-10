import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { 
  ProgressIndicator, 
  LoadingProgress, 
  MiniStepIndicator, 
  AnimatedDots,
  type ProgressStep 
} from '@/components/ProgressIndicator'

describe('Progress Indicator Components', () => {
  describe('ProgressIndicator', () => {
    const mockSteps: ProgressStep[] = [
      { id: 'step1', label: 'Step 1', description: 'First step', status: 'completed' },
      { id: 'step2', label: 'Step 2', description: 'Second step', status: 'active' },
      { id: 'step3', label: 'Step 3', description: 'Third step', status: 'pending' },
    ]

    it('should render horizontal progress indicator', () => {
      render(<ProgressIndicator steps={mockSteps} variant="horizontal" />)
      
      expect(screen.getByText('Step 1')).toBeInTheDocument()
      expect(screen.getByText('Step 2')).toBeInTheDocument()
      expect(screen.getByText('Step 3')).toBeInTheDocument()
    })

    it('should render vertical progress indicator', () => {
      render(<ProgressIndicator steps={mockSteps} variant="vertical" />)
      
      expect(screen.getByText('Step 1')).toBeInTheDocument()
      expect(screen.getByText('First step')).toBeInTheDocument()
      expect(screen.getByText('Second step')).toBeInTheDocument()
    })

    it('should show correct icons for different statuses', () => {
      const stepsWithAllStatuses: ProgressStep[] = [
        { id: 'completed', label: 'Completed', status: 'completed' },
        { id: 'active', label: 'Active', status: 'active' },
        { id: 'error', label: 'Error', status: 'error' },
        { id: 'pending', label: 'Pending', status: 'pending' },
      ]

      render(<ProgressIndicator steps={stepsWithAllStatuses} />)
      
      // Check completed step has check icon
      const completedStep = screen.getByText('Completed').closest('div')?.previousElementSibling
      expect(completedStep?.querySelector('svg')).toBeInTheDocument()
      
      // Check active step has spinning icon
      const activeStep = screen.getByText('Active').closest('div')?.previousElementSibling
      expect(activeStep?.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('should apply correct colors for different statuses', () => {
      render(<ProgressIndicator steps={mockSteps} />)
      
      // Find step containers by looking for text and checking parent classes
      const step1Container = screen.getByText('Step 1').closest('div')?.parentElement?.querySelector('div')
      const step2Container = screen.getByText('Step 2').closest('div')?.parentElement?.querySelector('div')
      const step3Container = screen.getByText('Step 3').closest('div')?.parentElement?.querySelector('div')
      
      expect(step1Container).toHaveClass('bg-green-500') // completed
      expect(step2Container).toHaveClass('bg-blue-500') // active
      expect(step3Container).toHaveClass('bg-gray-200') // pending
    })

    it('should hide labels when showLabels is false', () => {
      render(<ProgressIndicator steps={mockSteps} showLabels={false} />)
      
      expect(screen.queryByText('Step 1')).not.toBeInTheDocument()
      expect(screen.queryByText('Step 2')).not.toBeInTheDocument()
    })
  })

  describe('LoadingProgress', () => {
    it('should render determinate progress bar', () => {
      render(<LoadingProgress progress={50} label="Loading..." />)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('should render indeterminate progress bar', () => {
      render(<LoadingProgress progress={0} variant="indeterminate" label="Loading..." />)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByText('0%')).not.toBeInTheDocument()
    })

    it('should show sublabel when provided', () => {
      render(<LoadingProgress progress={75} sublabel="Almost done..." />)
      
      expect(screen.getByText('Almost done...')).toBeInTheDocument()
    })

    it('should apply correct color classes', () => {
      const { rerender } = render(<LoadingProgress progress={50} color="green" />)
      
      let progressBar = document.querySelector('.bg-green-500')
      expect(progressBar).toBeInTheDocument()
      
      rerender(<LoadingProgress progress={50} color="red" />)
      progressBar = document.querySelector('.bg-red-500')
      expect(progressBar).toBeInTheDocument()
    })

    it('should cap progress at 100%', () => {
      render(<LoadingProgress progress={150} label="Loading..." />)
      
      // The display might show 150% but the progress bar should be capped at 100% width
      expect(screen.getByText('150%')).toBeInTheDocument()
      
      // Check that the progress bar itself is capped at 100% width
      const progressBar = document.querySelector('.bg-blue-500')
      expect(progressBar).toHaveStyle('width: 100%')
    })
  })

  describe('MiniStepIndicator', () => {
    it('should render correct number of steps', () => {
      render(<MiniStepIndicator currentStep={2} totalSteps={4} />)
      
      // Should have 4 step circles
      const stepCircles = document.querySelectorAll('.w-6.h-6.rounded-full')
      expect(stepCircles).toHaveLength(4)
    })

    it('should highlight current step', () => {
      render(<MiniStepIndicator currentStep={2} totalSteps={3} />)
      
      // Check that step 2 has active styling (blue background)
      const activeStep = document.querySelector('.bg-blue-500')
      expect(activeStep).toBeInTheDocument()
      expect(activeStep).toHaveTextContent('2')
    })

    it('should show completed steps with check marks', () => {
      render(<MiniStepIndicator currentStep={3} totalSteps={4} />)
      
      // Steps 1 and 2 should be completed (green with check marks)
      const completedSteps = document.querySelectorAll('.bg-green-500')
      expect(completedSteps).toHaveLength(2)
    })

    it('should show labels when provided', () => {
      const labels = ['Start', 'Process', 'Finish']
      render(<MiniStepIndicator currentStep={2} totalSteps={3} labels={labels} />)
      
      expect(screen.getByText('Start')).toBeInTheDocument()
      expect(screen.getByText('Process')).toBeInTheDocument()
      expect(screen.getByText('Finish')).toBeInTheDocument()
    })

    it('should apply correct styling to labels based on step status', () => {
      const labels = ['Start', 'Process', 'Finish']
      render(<MiniStepIndicator currentStep={2} totalSteps={3} labels={labels} />)
      
      const startLabel = screen.getByText('Start')
      const processLabel = screen.getByText('Process')
      const finishLabel = screen.getByText('Finish')
      
      expect(startLabel).toHaveClass('text-green-600') // completed
      expect(processLabel).toHaveClass('text-blue-600') // active
      expect(finishLabel).toHaveClass('text-gray-500') // pending
    })
  })

  describe('AnimatedDots', () => {
    it('should render three animated dots', () => {
      render(<AnimatedDots />)
      
      const dots = document.querySelectorAll('.animate-bounce')
      expect(dots).toHaveLength(3)
    })

    it('should have staggered animation delays', () => {
      render(<AnimatedDots />)
      
      const dots = document.querySelectorAll('.animate-bounce')
      expect(dots[0]).toHaveStyle('animation-delay: 0ms')
      expect(dots[1]).toHaveStyle('animation-delay: 150ms')
      expect(dots[2]).toHaveStyle('animation-delay: 300ms')
    })

    it('should apply custom className', () => {
      render(<AnimatedDots className="custom-class" />)
      
      const container = document.querySelector('.custom-class')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Integration Tests', () => {
    it('should work together in a complete auth flow simulation', () => {
      const authSteps: ProgressStep[] = [
        { id: 'init', label: 'Initiating', status: 'completed' },
        { id: 'redirect', label: 'Redirecting', status: 'active' },
        { id: 'auth', label: 'Authenticating', status: 'pending' },
      ]

      render(
        <div>
          <ProgressIndicator steps={authSteps} />
          <LoadingProgress progress={65} label="Connecting..." />
          <MiniStepIndicator currentStep={2} totalSteps={3} labels={['Start', 'Auth', 'Done']} />
          <div className="flex items-center gap-1">
            Processing
            <AnimatedDots />
          </div>
        </div>
      )
      
      expect(screen.getByText('Initiating')).toBeInTheDocument()
      expect(screen.getByText('Redirecting')).toBeInTheDocument()
      expect(screen.getByText('Connecting...')).toBeInTheDocument()
      expect(screen.getByText('65%')).toBeInTheDocument()
      expect(screen.getByText('Auth')).toBeInTheDocument()
      expect(screen.getByText('Processing')).toBeInTheDocument()
    })
  })
}) 