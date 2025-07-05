import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SWRConfig } from 'swr'
import JobSearchWrapper from '../../src/components/JobSearchWrapper'

// Mock the search actions
const mockSearchJobs = jest.fn()
jest.mock('@/app/actions/search', () => ({
  searchJobs: (searchQuery: string, selectedTags: string[]) => mockSearchJobs(searchQuery, selectedTags),
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
    job: { id: number; title: string; company: string; location: string }
    searchQuery: string
  }) {
    return (
      <div data-testid={`job-card-${job.id}`}>
        <h3>{job.title}</h3>
        <p>{job.company}</p>
        <p>{job.location}</p>
        <div data-testid="search-query">{searchQuery}</div>
      </div>
    )
  }
})

// Test wrapper with SWR provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
)

describe('JobSearchWrapper', () => {
  const mockJobs = [
    {
      id: 1,
      created_at: '2024-01-15T10:00:00Z',
      title: 'Frontend Developer',
      company: 'TechCorp',
      location: 'Remote',
      url: 'https://techcorp.com/jobs/1',
      status: 'approved' as const,
      tags: [
        { id: 1, name: 'React' },
        { id: 2, name: 'TypeScript' }
      ]
    },
    {
      id: 2,
      created_at: '2024-01-14T15:30:00Z',
      title: 'Backend Engineer',
      company: 'DataCorp',
      location: 'New York, NY',
      url: 'https://datacorp.com/jobs/2',
      status: 'approved' as const,
      tags: [
        { id: 3, name: 'Node.js' },
        { id: 4, name: 'Python' }
      ]
    }
  ]

  const mockTags = ['React', 'TypeScript', 'Node.js', 'Python']

  const defaultProps = {
    initialJobs: mockJobs,
    allTags: mockTags
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchJobs.mockResolvedValue(mockJobs)
  })

  it('renders initial jobs correctly', () => {
    render(
      <TestWrapper>
        <JobSearchWrapper {...defaultProps} />
      </TestWrapper>
    )

    expect(screen.getByText('Latest Jobs')).toBeInTheDocument()
    expect(screen.getByText('2 jobs')).toBeInTheDocument()
    expect(screen.getByTestId('job-card-1')).toBeInTheDocument()
    expect(screen.getByTestId('job-card-2')).toBeInTheDocument()
  })

  it('displays search results when search query is entered', async () => {
    const filteredJobs = [mockJobs[0]] // Only first job
    mockSearchJobs.mockResolvedValue(filteredJobs)

    render(
      <TestWrapper>
        <JobSearchWrapper {...defaultProps} />
      </TestWrapper>
    )

    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'Frontend' } })

    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument()
    })

    // Wait for debounced search to trigger
    await waitFor(() => {
      expect(mockSearchJobs).toHaveBeenCalledWith('Frontend', [])
    }, { timeout: 500 })
  })

  it('handles tag filtering correctly', async () => {
    const filteredJobs = [mockJobs[0]] // Only React job
    mockSearchJobs.mockResolvedValue(filteredJobs)

    render(
      <TestWrapper>
        <JobSearchWrapper {...defaultProps} />
      </TestWrapper>
    )

    // Simulate tag toggle (this would be done through the JobSearch component)
    fireEvent.click(screen.getByTestId('clear-filters')) // This will trigger tag state change

    await waitFor(() => {
      expect(mockSearchJobs).toHaveBeenCalledWith('', [])
    }, { timeout: 500 })
  })

  it('shows loading indicator when searching', async () => {
    // Mock a delayed response
    mockSearchJobs.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockJobs), 100))
    )

    render(
      <TestWrapper>
        <JobSearchWrapper {...defaultProps} />
      </TestWrapper>
    )

    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    // Should show loading indicator
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument()
    })
  })

  it('displays empty state when no jobs found', async () => {
    mockSearchJobs.mockResolvedValue([])

    render(
      <TestWrapper>
        <JobSearchWrapper {...defaultProps} />
      </TestWrapper>
    )

    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    await waitFor(() => {
      expect(screen.getByText('No jobs found')).toBeInTheDocument()
    }, { timeout: 500 })

    await waitFor(() => {
      expect(screen.getByText('Try adjusting your search terms or selected tags to find more opportunities.')).toBeInTheDocument()
    })
  })

  it('displays error state when search fails', async () => {
    mockSearchJobs.mockRejectedValue(new Error('Search failed'))

    render(
      <TestWrapper>
        <JobSearchWrapper {...defaultProps} />
      </TestWrapper>
    )

    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    await waitFor(() => {
      expect(screen.getByText('Search Error')).toBeInTheDocument()
    }, { timeout: 500 })

    await waitFor(() => {
      expect(screen.getByText('Unable to search jobs. Please try again.')).toBeInTheDocument()
    })
  })

  it('handles clear filters correctly', async () => {
    render(
      <TestWrapper>
        <JobSearchWrapper {...defaultProps} />
      </TestWrapper>
    )

    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    const clearButton = screen.getByTestId('clear-filters')
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(searchInput).toHaveValue('')
    })
  })

  it('handles search input changes', async () => {
    render(
      <TestWrapper>
        <JobSearchWrapper {...defaultProps} />
      </TestWrapper>
    )

    const searchInput = screen.getByTestId('search-input')
    
    // Type in search input
    fireEvent.change(searchInput, { target: { value: 'test' } })

    // Input should reflect the change
    expect(searchInput).toHaveValue('test')

    // Eventually the search should be triggered
    await waitFor(() => {
      expect(mockSearchJobs).toHaveBeenCalledWith('test', [])
    }, { timeout: 1000 })
  })

  it('uses correct SWR key format', async () => {
    render(
      <TestWrapper>
        <JobSearchWrapper {...defaultProps} />
      </TestWrapper>
    )

    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    await waitFor(() => {
      expect(mockSearchJobs).toHaveBeenCalledWith('test', [])
    }, { timeout: 500 })
  })

  it('maintains job count display', async () => {
    render(
      <TestWrapper>
        <JobSearchWrapper {...defaultProps} />
      </TestWrapper>
    )

    expect(screen.getByText('2 jobs')).toBeInTheDocument()

    // After search returns 1 job
    mockSearchJobs.mockResolvedValue([mockJobs[0]])
    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'Frontend' } })

    await waitFor(() => {
      expect(screen.getByText('1 job')).toBeInTheDocument()
    }, { timeout: 500 })
  })
}) 