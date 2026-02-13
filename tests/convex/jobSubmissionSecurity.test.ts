import {
  MAX_TAGS,
  MAX_TITLE_LENGTH,
  validateAndNormalizeJobSubmission,
  validateAndNormalizeTags,
} from '../../convex/jobSubmissionSecurity'

describe('jobSubmissionSecurity', () => {
  it('normalizes a valid submission payload', () => {
    const result = validateAndNormalizeJobSubmission({
      title: '  Junior Frontend Developer  ',
      company: '  Acme Inc  ',
      location: '  Remote  ',
      url: 'https://careers.acme.com/jobs/123?utm_source=test',
      tags: [' React ', 'TypeScript', 'react'],
    })

    expect(result.title).toBe('Junior Frontend Developer')
    expect(result.company).toBe('Acme Inc')
    expect(result.location).toBe('Remote')
    expect(result.normalizedUrl).toBe('https://careers.acme.com/jobs/123?utm_source=test')
    expect(result.tags).toEqual(['React', 'TypeScript'])
  })

  it('rejects non-http protocols and credentialed URLs', () => {
    expect(() =>
      validateAndNormalizeJobSubmission({
        title: 'Role',
        company: 'Company',
        location: 'Remote',
        url: 'javascript:alert(1)',
      }),
    ).toThrow('URL must start with http:// or https://')

    expect(() =>
      validateAndNormalizeJobSubmission({
        title: 'Role',
        company: 'Company',
        location: 'Remote',
        url: 'https://user:pass@example.com/job',
      }),
    ).toThrow('URL must not include username or password')
  })

  it('rejects local/private network hosts', () => {
    expect(() =>
      validateAndNormalizeJobSubmission({
        title: 'Role',
        company: 'Company',
        location: 'Remote',
        url: 'https://localhost/job',
      }),
    ).toThrow('Local or private network URLs are not allowed')

    expect(() =>
      validateAndNormalizeJobSubmission({
        title: 'Role',
        company: 'Company',
        location: 'Remote',
        url: 'https://192.168.1.25/job',
      }),
    ).toThrow('Local or private network URLs are not allowed')
  })

  it('rejects control characters and excessive lengths', () => {
    expect(() =>
      validateAndNormalizeJobSubmission({
        title: `Valid\nTitle`,
        company: 'Company',
        location: 'Remote',
        url: 'https://example.com/job',
      }),
    ).toThrow('Title contains invalid characters')

    expect(() =>
      validateAndNormalizeJobSubmission({
        title: 'a'.repeat(MAX_TITLE_LENGTH + 1),
        company: 'Company',
        location: 'Remote',
        url: 'https://example.com/job',
      }),
    ).toThrow(`Title must be ${MAX_TITLE_LENGTH} characters or fewer`)
  })

  it('enforces tag limits and tag sanitization', () => {
    expect(() => validateAndNormalizeTags(Array.from({ length: MAX_TAGS + 1 }, (_, i) => `tag-${i}`))).toThrow(
      `You can add up to ${MAX_TAGS} tags`,
    )

    expect(() => validateAndNormalizeTags(['good', 'bad\n'])).toThrow('Tags contain invalid characters')
  })
})
