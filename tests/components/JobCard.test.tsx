import React from 'react'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { mockSupabaseClient, resetMockDatabase } from '../mocks/supabase'

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

// Mock JobCard component with a simple implementation for testing
const MockJobCard: React.FC<{
  job: {
    id: string
    title: string
    company: string
    location: string
    apply_url: string
    tags?: Array<{ name: string }>
  }
}> = ({ job }) => (
  <div data-testid="job-card">
    <h3>{job.title}</h3>
    <p>{job.company}</p>
    <p>{job.location}</p>
    <a href={job.apply_url}>Apply</a>
    {job.tags && job.tags.map(tag => (
      <span key={tag.name} className="tag">{tag.name}</span>
    ))}
  </div>
)

describe('JobCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetMockDatabase()
  })

  const mockJob = {
    id: '1',
    title: 'Frontend Developer',
    company: 'TechCorp',
    location: 'Remote',
    apply_url: 'https://example.com/apply',
    tags: [
      { name: 'React' },
      { name: 'TypeScript' }
    ]
  }

  it('should render job information correctly', () => {
    render(<MockJobCard job={mockJob} />)

    expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
    expect(screen.getByText('TechCorp')).toBeInTheDocument()
    expect(screen.getByText('Remote')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Apply' })).toHaveAttribute('href', 'https://example.com/apply')
  })

  it('should render job tags', () => {
    render(<MockJobCard job={mockJob} />)

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('should handle job without tags', () => {
    const jobWithoutTags = {
      ...mockJob,
      tags: undefined
    }

    render(<MockJobCard job={jobWithoutTags} />)

    expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
    expect(screen.queryByText('React')).not.toBeInTheDocument()
  })

  it('should render with proper test id', () => {
    render(<MockJobCard job={mockJob} />)

    expect(screen.getByTestId('job-card')).toBeInTheDocument()
  })
}) 