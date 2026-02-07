import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Convex
const mockUseQuery = jest.fn()
jest.mock('convex/react', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
}))

// Mock the Convex API
jest.mock('../../convex/_generated/api', () => ({
  api: {
    jobs: {
      listApprovedJobs: 'jobs:listApprovedJobs',
      getApprovedJobFilterOptions: 'jobs:getApprovedJobFilterOptions',
    },
  },
}))

// Mock the child components
jest.mock('@/components/JobSearch', () => {
  return function MockJobSearch({
    searchQuery,
    selectedRoleLevel,
    selectedLocation,
    locationOptions,
    onSearchChange,
    onRoleLevelChange,
    onLocationChange,
    onClearFilters
  }: {
    searchQuery: string
    selectedRoleLevel: string
    selectedLocation: string
    locationOptions: string[]
    onSearchChange: (query: string) => void
    onRoleLevelChange: (roleLevel: string) => void
    onLocationChange: (location: string) => void
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
        <select
          data-testid="role-filter"
          value={selectedRoleLevel}
          onChange={(e) => onRoleLevelChange(e.target.value)}
        >
          <option value="">All levels</option>
          <option value="intern">Intern</option>
          <option value="graduate">Graduate</option>
          <option value="earlyCareer">Early Career</option>
        </select>
        <select
          data-testid="location-filter"
          value={selectedLocation}
          onChange={(e) => onLocationChange(e.target.value)}
        >
          <option value="">All locations</option>
          {locationOptions.map((location: string) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
        <button data-testid="clear-filters" onClick={onClearFilters}>
          Clear Filters
        </button>
      </div>
    )
  }
})

jest.mock('@/components/JobCard', () => {
  return function MockJobCard({ job, searchQuery, isBookmarked }: {
    job: { _id: string; title: string; company: string; location: string }
    searchQuery: string
    isBookmarked: boolean
  }) {
    return (
      <div data-testid={`job-card-${job._id}`}>
        <h3>{job.title}</h3>
        <p>{job.company}</p>
        <p>{job.location}</p>
        <div data-testid="search-query">{searchQuery}</div>
        <div data-testid="bookmarked-state">{String(isBookmarked)}</div>
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
      tags: ['React', 'TypeScript'],
      isBookmarked: false
    },
    {
      _id: '2',
      _creationTime: 1705226400000,
      title: 'Backend Engineer',
      company: 'DataCorp',
      location: 'New York, NY',
      url: 'https://datacorp.com/jobs/2',
      status: 'approved' as const,
      tags: ['Node.js', 'Python'],
      isBookmarked: true
    }
  ]

  const mockLocations = ['Remote', 'New York, NY']

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseQuery.mockImplementation((queryRef: string) => {
      if (queryRef === 'jobs:getApprovedJobFilterOptions') {
        return { locations: mockLocations }
      }
      return mockJobs
    })
  })

  it('renders initial jobs correctly', () => {
    render(<JobSearchWrapper />)

    expect(screen.getByText('Latest Jobs')).toBeInTheDocument()
    expect(screen.getByText('2 jobs')).toBeInTheDocument()
    expect(screen.getByTestId('job-card-1')).toBeInTheDocument()
    expect(screen.getByTestId('job-card-2')).toBeInTheDocument()
  })

  it('handles search input changes', async () => {
    render(<JobSearchWrapper />)

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
    render(<JobSearchWrapper />)

    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'test' } })
    fireEvent.change(screen.getByTestId('role-filter'), { target: { value: 'intern' } })

    const clearButton = screen.getByTestId('clear-filters')
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(searchInput).toHaveValue('')
      expect(screen.getByTestId('role-filter')).toHaveValue('')
    })
  })

  it('displays empty state when no jobs found', () => {
    mockUseQuery.mockImplementation((queryRef: string) => {
      if (queryRef === 'jobs:getApprovedJobFilterOptions') {
        return { locations: mockLocations }
      }
      return []
    })

    render(<JobSearchWrapper />)

    expect(screen.getByText('No jobs available')).toBeInTheDocument()
  })

  it('displays empty state with filters when no jobs match', async () => {
    mockUseQuery.mockImplementation((queryRef: string) => {
      if (queryRef === 'jobs:getApprovedJobFilterOptions') {
        return { locations: mockLocations }
      }
      return []
    })

    render(<JobSearchWrapper />)

    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    await waitFor(() => {
      expect(screen.getByText('No jobs found')).toBeInTheDocument()
    })

    expect(screen.getByText('Try adjusting your search terms, role level, or location filters to find more opportunities.')).toBeInTheDocument()
  })

  it('shows loading state when jobs are undefined', () => {
    mockUseQuery.mockImplementation((queryRef: string) => {
      if (queryRef === 'jobs:getApprovedJobFilterOptions') {
        return { locations: mockLocations }
      }
      return undefined
    })

    render(<JobSearchWrapper />)

    expect(screen.getByTestId('job-skeleton-grid')).toBeInTheDocument()
    expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0)
    expect(screen.queryByText('No jobs available')).not.toBeInTheDocument()
  })

  it('maintains job count display', () => {
    render(<JobSearchWrapper />)

    expect(screen.getByText('2 jobs')).toBeInTheDocument()
  })

  it('displays singular job count correctly', () => {
    mockUseQuery.mockImplementation((queryRef: string) => {
      if (queryRef === 'jobs:getApprovedJobFilterOptions') {
        return { locations: mockLocations }
      }
      return [mockJobs[0]]
    })

    render(<JobSearchWrapper />)

    expect(screen.getByText('1 job')).toBeInTheDocument()
  })
})
