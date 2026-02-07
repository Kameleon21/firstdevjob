import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

const mockUpdateBookmarkStatus = jest.fn()
const mockRemoveTrackedApplication = jest.fn()

jest.mock('convex/react', () => ({
  useMutation: (reference: string) => {
    if (reference === 'bookmarks:updateBookmarkStatus') {
      return mockUpdateBookmarkStatus
    }
    return mockRemoveTrackedApplication
  },
}))

jest.mock('../../convex/_generated/api', () => ({
  api: {
    bookmarks: {
      updateBookmarkStatus: 'bookmarks:updateBookmarkStatus',
      removeTrackedApplication: 'bookmarks:removeTrackedApplication',
    },
  },
}))

import DashboardJobCard from '../../src/components/DashboardJobCard'

describe('DashboardJobCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const baseBookmark = {
    id: 'bookmark-1',
    status: 'saved' as const,
    notes: null,
    job: {
      id: 'job-1',
      title: 'Frontend Developer',
      company: 'TechCorp',
      location: 'Remote',
      url: 'https://example.com/jobs/1',
      createdAt: 1705312800000,
      tags: ['React', 'TypeScript'],
      availability: 'active' as const,
      closureReason: null,
    },
  }

  it('renders active jobs with view posting action', () => {
    render(<DashboardJobCard bookmark={baseBookmark as any} />)

    expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Job Posting' })).toHaveAttribute('href', 'https://example.com/jobs/1')
  })

  it('renders closed job messaging and disabled posting action', () => {
    render(
      <DashboardJobCard
        bookmark={{
          ...baseBookmark,
          job: {
            ...baseBookmark.job,
            availability: 'closed',
            closureReason: 'removed',
          },
        } as any}
      />,
    )

    expect(screen.getByText('Job closed')).toBeInTheDocument()
    expect(screen.getByText('Posting no longer available')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'View Job Posting' })).not.toBeInTheDocument()
  })

  it('removes tracked application when remove button is clicked', () => {
    render(<DashboardJobCard bookmark={baseBookmark as any} />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove from tracker' }))

    expect(mockRemoveTrackedApplication).toHaveBeenCalledWith({ bookmarkId: 'bookmark-1' })
  })
})
