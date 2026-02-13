import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

const mockUseQuery = jest.fn()

jest.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

jest.mock('../../convex/_generated/api', () => ({
  api: {
    admin: {
      getApprovedJobs: 'admin:getApprovedJobs',
    },
  },
}))

jest.mock('../../src/components/AdminJobCard', () => ({
  __esModule: true,
  default: ({ job, mode }: { job: { title: string }; mode: string }) => (
    <div data-testid="admin-job-card">{mode}:{job.title}</div>
  ),
}))

import AdminSection from '../../src/components/AdminSection'

describe('AdminSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseQuery.mockReturnValue([{ id: 'approved_1', title: 'Approved Job' }])
  })

  it('switches between pending and approved tabs', () => {
    render(
      <AdminSection
        pendingJobs={[
          {
            id: 'pending_1',
            createdAt: Date.now(),
            title: 'Pending Job',
            company: 'A',
            location: 'Remote',
            url: 'https://example.com/1',
            status: 'pending',
            tags: [],
          },
        ] as any}
        userRole={{ isAdmin: false, isModerator: true }}
      />,
    )

    expect(screen.getByText('Pending (1)')).toBeInTheDocument()
    expect(screen.getByText('Approved (1)')).toBeInTheDocument()
    expect(screen.getByText('pending:Pending Job')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Approved \(1\)/ }))
    expect(screen.getByText('approved:Approved Job')).toBeInTheDocument()
  })

  it('does not render for non-moderators', () => {
    const { container } = render(
      <AdminSection
        pendingJobs={[]}
        userRole={{ isAdmin: false, isModerator: false }}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
