import {
  getPostJobErrorMessage,
  validatePostJobUrlInput,
} from '../../src/lib/postJobError'

describe('postJobError', () => {
  it('extracts clean message from Convex server error payload', () => {
    const rawError = new Error(
      '[CONVEX M(jobs:postJob)] [Request ID: x] Server Error\nUncaught Error: URL must start with http:// or https://\n    at handler (../convex/jobs.ts:1:1)',
    )

    expect(getPostJobErrorMessage(rawError)).toBe(
      'Please enter a valid URL starting with http:// or https:// (example: https://company.com/jobs/123).',
    )
  })

  it('keeps known rate-limit messages user-friendly', () => {
    const error = new Error('Rate limit reached. Please wait before submitting another job.')
    expect(getPostJobErrorMessage(error)).toBe(
      'Rate limit reached. Please wait before submitting another job.',
    )
  })

  it('validates URL input client-side with clear errors', () => {
    expect(() => validatePostJobUrlInput('ht://example.com')).toThrow(
      'Please enter a valid URL starting with http:// or https:// (example: https://company.com/jobs/123).',
    )

    expect(() => validatePostJobUrlInput('')).toThrow('Please enter a job posting URL.')
    expect(validatePostJobUrlInput('https://company.com/jobs/123')).toBe(
      'https://company.com/jobs/123',
    )
  })
})
