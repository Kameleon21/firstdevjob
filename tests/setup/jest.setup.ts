import '@testing-library/jest-dom'
import { expect, jest, beforeEach, afterEach } from '@jest/globals'

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  redirect: jest.fn(),
  notFound: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}))

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks()
})

afterEach(() => {
  // Clean up after each test
  jest.restoreAllMocks()
})

// Extend Jest expect with custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveBeenCalledOnceWith(...args: any[]): R
    }
  }
}

// Custom matcher for better assertions
expect.extend({
  toHaveBeenCalledOnceWith(received: jest.Mock, ...expectedArgs: any[]) {
    const pass = received.mock.calls.length === 1 && 
                 this.equals(received.mock.calls[0], expectedArgs)
    
    if (pass) {
      return {
        message: () => `Expected mock not to have been called once with ${this.utils.printExpected(expectedArgs)}`,
        pass: true,
      }
    } else {
      return {
        message: () => `Expected mock to have been called once with ${this.utils.printExpected(expectedArgs)}, but it was called ${received.mock.calls.length} times`,
        pass: false,
      }
    }
  },
})

// Mock console warnings and errors in tests unless explicitly testing them
const originalError = console.error
const originalWarn = console.warn

beforeEach(() => {
  console.error = jest.fn()
  console.warn = jest.fn()
})

afterEach(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Set up environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000' 