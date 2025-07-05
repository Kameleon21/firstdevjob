import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SWRConfig } from 'swr'
import DashboardPage from '@/app/dashboard/page'
import { getDashboardData } from '@/app/actions/dashboard'

// Mock the next/navigation module
const mockRouterPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}))

// Mock the server action
jest.mock('@/app/actions/dashboard')
const mockGetDashboardData = getDashboardData as jest.Mock

// Mock child components to isolate the test
jest.mock('@/components/Header', () => () => <header data-testid="header" />)
jest.mock('@/components/AdminSection', () => () => <div data-testid="admin-section" />)
jest.mock('@/components/DashboardJobCard', () => () => <div data-testid="dashboard-job-card" />)

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
)

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading state initially', () => {
    mockGetDashboardData.mockReturnValue(new Promise(() => {})) // Never resolves
    render(<TestWrapper><DashboardPage /></TestWrapper>)
    // Check for a known element in the loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('redirects to login if user is not authenticated', async () => {
    mockGetDashboardData.mockResolvedValue({
      user: null,
      bookmarks: [],
      userRole: { isAdmin: false, isModerator: false },
      pendingJobs: [],
      allTags: [],
    })
    render(<TestWrapper><DashboardPage /></TestWrapper>)

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/auth/login?message=Please sign in to view your dashboard')
    })
  })

  it('displays an error message if data fetching fails', async () => {
    mockGetDashboardData.mockRejectedValue(new Error('Failed to fetch'))
    render(<TestWrapper><DashboardPage /></TestWrapper>)

    expect(await screen.findByText('Could not load dashboard data.')).toBeInTheDocument()
  })

  it('displays bookmarked jobs when data is loaded', async () => {
    const mockData = {
      user: { id: '1', email: 'test@test.com' },
      bookmarks: [{ id: 1, job: { title: 'Test Job' } }],
      userRole: { isAdmin: false, isModerator: false },
      pendingJobs: [],
      allTags: [],
    }
    mockGetDashboardData.mockResolvedValue(mockData)
    render(<TestWrapper><DashboardPage /></TestWrapper>)

    expect(await screen.findByText('Tracked Applications')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-job-card')).toBeInTheDocument()
  })

  it('displays empty state when there are no bookmarked jobs', async () => {
    const mockData = {
      user: { id: '1', email: 'test@test.com' },
      bookmarks: [],
      userRole: { isAdmin: false, isModerator: false },
      pendingJobs: [],
      allTags: [],
    }
    mockGetDashboardData.mockResolvedValue(mockData)
    render(<TestWrapper><DashboardPage /></TestWrapper>)

    expect(await screen.findByText('No Bookmarked Jobs')).toBeInTheDocument()
  })

  it('renders the AdminSection for moderators', async () => {
    const mockData = {
      user: { id: '1', email: 'test@test.com' },
      bookmarks: [],
      userRole: { isAdmin: false, isModerator: true },
      pendingJobs: [{ id: 1, title: 'Pending Job' }],
      allTags: [],
    }
    mockGetDashboardData.mockResolvedValue(mockData)
    render(<TestWrapper><DashboardPage /></TestWrapper>)

    await waitFor(() => {
      expect(screen.getByTestId('admin-section')).toBeInTheDocument()
    })
  })
}) 