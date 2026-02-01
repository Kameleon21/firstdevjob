import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Convex
const mockUseQuery = jest.fn()
jest.mock('convex/react', () => ({
  useQuery: () => mockUseQuery(),
}))

// Mock the Convex API
jest.mock('../../convex/_generated/api', () => ({
  api: {
    jobs: {
      listApprovedJobs: 'jobs:listApprovedJobs',
    },
  },
}))

// Mock the child components
jest.mock('@/components/JobSearch', () => {
  return function MockJobSearch({
    searchQuery,
    selectedTags,
    onSearchChange,
    onTagToggle,
    onClearFilters
  }: {
    searchQuery: string
    selectedTags: string[]
    onSearchChange: (query: string) => void
    onTagToggle: (tag: string) => void
    onClearFilters: () => void
  }) {
    return (
      <div data-testid="job-search">
        <input
          data-testid="search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search jobs..."
        />
        <div data-testid="tags">
          {selectedTags.map((tag: string) => (
            <button
              key={tag}
              data-testid={`tag-${tag}`}
              onClick={() => onTagToggle(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <button data-testid="clear-filters" onClick={onClearFilters}>
          Clear Filters
        </button>
      </div>
    )
  }
})

jest.mock('@/components/JobCard', () => {
  return function MockJobCard({ job, searchQuery }: {
    job: { _id: string; title: string; company: string; location: string }
    searchQuery: string
  }) {
    return (
      <div data-testid={`job-card-${job._id}`}>
        <h3>{job.title}</h3>
        <p>{job.company}</p>
        <p>{job.location}</p>
        <div data-testid="search-query">{searchQuery}</div>
      </div>
    )
  }
})

import JobSearchWrapper from '../../src/components/JobSearchWrapper'

describe('JobSearchWrapper', () => {
  const mockJobs = [
    {
      _id: '1',
      _creationTime: 1705312800000,
      title: 'Frontend Developer',
      company: 'TechCorp',
      location: 'Remote',
      url: 'https://techcorp.com/jobs/1',
      status: 'approved' as const,
      tags: ['React', 'TypeScript']
    },
    {
      _id: '2',
      _creationTime: 1705226400000,
      title: 'Backend Engineer',
      company: 'DataCorp',
      location: 'New York, NY',
      url: 'https://datacorp.com/jobs/2',
      status: 'approved' as const,
      tags: ['Node.js', 'Python']
    }
  ]

  const mockTags = ['React', 'TypeScript', 'Node.js', 'Python']

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseQuery.mockReturnValue(mockJobs)
  })

  it('renders initial jobs correctly', () => {
    render(<JobSearchWrapper allTags={mockTags} />)

    expect(screen.getByText('Latest Jobs')).toBeInTheDocument()
    expect(screen.getByText('2 jobs')).toBeInTheDocument()
    expect(screen.getByTestId('job-card-1')).toBeInTheDocument()
    expect(screen.getByTestId('job-card-2')).toBeInTheDocument()
  })

  it('handles search input changes', async () => {
    render(<JobSearchWrapper allTags={mockTags} />)

    const searchInput = screen.getByTestId('search-input')

    // Type in search input
    fireEvent.change(searchInput, { target: { value: 'test' } })

    // Input should reflect the change
    expect(searchInput).toHaveValue('test')

    // Title should change to Search Results
    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument()
    })
  })

  it('handles clear filters correctly', async () => {
    render(<JobSearchWrapper allTags={mockTags} />)

    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    const clearButton = screen.getByTestId('clear-filters')
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(searchInput).toHaveValue('')
    })
  })

  it('displays empty state when no jobs found', () => {
    mockUseQuery.mockReturnValue([])

    render(<JobSearchWrapper allTags={mockTags} />)

    expect(screen.getByText('No jobs available')).toBeInTheDocument()
  })

  it('displays empty state with filters when no jobs match', async () => {
    mockUseQuery.mockReturnValue([])

    render(<JobSearchWrapper allTags={mockTags} />)

    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    await waitFor(() => {
      expect(screen.getByText('No jobs found')).toBeInTheDocument()
    })

    expect(screen.getByText('Try adjusting your search terms or selected tags to find more opportunities.')).toBeInTheDocument()
  })

  it('shows loading state when jobs are undefined', () => {
    mockUseQuery.mockReturnValue(undefined)

    render(<JobSearchWrapper allTags={mockTags} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('maintains job count display', () => {
    render(<JobSearchWrapper allTags={mockTags} />)

    expect(screen.getByText('2 jobs')).toBeInTheDocument()
  })

  it('displays singular job count correctly', () => {
    mockUseQuery.mockReturnValue([mockJobs[0]])

    render(<JobSearchWrapper allTags={mockTags} />)

    expect(screen.getByText('1 job')).toBeInTheDocument()
  })
})
