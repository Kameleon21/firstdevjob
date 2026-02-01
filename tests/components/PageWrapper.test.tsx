import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Convex
jest.mock('convex/react', () => ({
  useQuery: () => ['React', 'TypeScript', 'Node.js'],
}))

// Mock the Convex API
jest.mock('../../convex/_generated/api', () => ({
  api: {
    tags: {
      getAllTags: 'tags:getAllTags',
    },
  },
}))

// Mock child components
jest.mock('@/components/Header', () => ({ onPostJobClick }: { onPostJobClick: () => void }) => (
  <header>
    <button onClick={onPostJobClick} data-testid="post-job-button">Post a Job</button>
  </header>
))
jest.mock('@/components/HeroSection', () => () => <div data-testid="hero-section" />)
jest.mock('@/components/JobSearchWrapper', () => () => <div data-testid="job-search-wrapper" />)
jest.mock('@/components/PostJobModal', () => () => <div data-testid="post-job-modal" />)
jest.mock('@/components/Toast', () => () => <div data-testid="toast" />)

import PageWrapper from '@/components/PageWrapper'

describe('PageWrapper', () => {
  it('renders the main page components', () => {
    render(<PageWrapper />)
    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
    expect(screen.getByTestId('job-search-wrapper')).toBeInTheDocument()
  })

  it('does not render the PostJobModal initially', () => {
    render(<PageWrapper />)
    expect(screen.queryByTestId('post-job-modal')).not.toBeInTheDocument()
  })

  it('lazily loads and renders the PostJobModal when the "Post a Job" button is clicked', async () => {
    render(<PageWrapper />)

    // Ensure the modal is not there initially
    expect(screen.queryByTestId('post-job-modal')).not.toBeInTheDocument()

    // Click the button to open the modal
    const postJobButton = screen.getByTestId('post-job-button')
    fireEvent.click(postJobButton)

    // Wait for the modal to be loaded and rendered
    await waitFor(() => {
      expect(screen.getByTestId('post-job-modal')).toBeInTheDocument()
    })
  })
})
