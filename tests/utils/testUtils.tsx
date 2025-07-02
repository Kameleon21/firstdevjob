import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { jest } from '@jest/globals'

// Mock Next.js router for components that use it
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
}

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'user',
  ...overrides,
})

export const createMockJob = (overrides: Partial<any> = {}) => ({
  id: 1,
  title: 'Frontend Developer',
  company: 'Test Company',
  location: 'Remote',
  url: 'https://example.com/job',
  status: 'approved' as const,
  created_at: '2024-01-01T00:00:00Z',
  tags: [
    { id: 1, name: 'React' },
    { id: 2, name: 'TypeScript' }
  ],
  ...overrides,
})

export const createMockBookmark = (overrides: Partial<any> = {}) => ({
  id: 1,
  user_id: 'test-user-id',
  job_id: 1,
  status: 'saved' as const,
  notes: 'Test notes',
  ...overrides,
})

// Form data helper
export const createFormData = (data: Record<string, string>) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}

// Wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock server action response
export const mockServerActionSuccess = (data?: any) => ({
  success: true,
  message: 'Operation successful',
  data,
})

export const mockServerActionError = (message: string) => {
  throw new Error(message)
}

// Mock fetch responses
export const mockFetchResponse = (data: any, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(data),
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
  } as Response)
}

// Clean up mocks
export const resetAllMocks = () => {
  jest.clearAllMocks()
  jest.restoreAllMocks()
}

// User event helpers
export const createUserEvent = async () => {
  const userEvent = await import('@testing-library/user-event')
  return userEvent.default.setup()
}

// Assertion helpers
export const expectElementToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
}

export const expectElementNotToBeInDocument = (element: HTMLElement | null) => {
  expect(element).not.toBeInTheDocument()
}

export const expectElementToHaveText = (element: HTMLElement | null, text: string) => {
  expect(element).toHaveTextContent(text)
}

export const expectElementToBeDisabled = (element: HTMLElement | null) => {
  expect(element).toBeDisabled()
}

export const expectElementToBeEnabled = (element: HTMLElement | null) => {
  expect(element).toBeEnabled()
} 