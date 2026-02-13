import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

const mockUpdateJobStatus = jest.fn()
const mockDeleteJob = jest.fn()
const mockMarkJobOutdated = jest.fn()

jest.mock('convex/react', () => ({
  useMutation: (reference: string) => {
    if (reference === 'admin:updateJobStatus') return mockUpdateJobStatus
    if (reference === 'admin:deleteJob') return mockDeleteJob
    return mockMarkJobOutdated
  },
}))

jest.mock('../../convex/_generated/api', () => ({
  api: {
    admin: {
      updateJobStatus: 'admin:updateJobStatus',
      deleteJob: 'admin:deleteJob',
      markJobOutdated: 'admin:markJobOutdated',
    },
  },
}))

import AdminJobCard from '../../src/components/AdminJobCard'

describe('AdminJobCard', () => {
  const baseJob = {
    id: 'job_1',
    createdAt: 1705312800000,
    title: 'Junior Engineer',
    company: 'Acme',
    location: 'Remote',
    url: 'https://example.com/jobs/1',
    status: 'pending' as const,
    tags: ['React'],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdateJobStatus.mockResolvedValue(undefined)
    mockDeleteJob.mockResolvedValue(undefined)
    mockMarkJobOutdated.mockResolvedValue(undefined)
    jest.spyOn(window, 'confirm').mockImplementation(() => true)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('handles pending-mode approve and reject actions', async () => {
    render(<AdminJobCard job={baseJob as any} mode="pending" />)

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))
    await waitFor(() =>
      expect(mockUpdateJobStatus).toHaveBeenCalledWith({
        jobId: 'job_1',
        status: 'approved',
      }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
    await waitFor(() =>
      expect(mockUpdateJobStatus).toHaveBeenCalledWith({
        jobId: 'job_1',
        status: 'rejected',
      }),
    )
  })

  it('handles approved-mode outdated and delete actions', async () => {
    render(<AdminJobCard job={baseJob as any} mode="approved" />)

    fireEvent.click(screen.getByRole('button', { name: 'Mark Outdated' }))
    await waitFor(() =>
      expect(mockMarkJobOutdated).toHaveBeenCalledWith({ jobId: 'job_1' }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(window.confirm).toHaveBeenCalled())
    await waitFor(() =>
      expect(mockDeleteJob).toHaveBeenCalledWith({ jobId: 'job_1' }),
    )
  })
})
