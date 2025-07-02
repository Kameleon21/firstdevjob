# FirstDevJob Testing Guide 🧪

This directory contains the comprehensive testing infrastructure for FirstDevJob, built with Jest, TypeScript, and React Testing Library.

## 📁 Directory Structure

```
tests/
├── actions/           # Server action tests
│   ├── auth.test.ts
│   ├── jobs.test.ts
│   ├── bookmarks.test.ts
│   └── admin.test.ts
├── components/        # React component tests
│   ├── JobCard.test.tsx
│   ├── Header.test.tsx
│   └── AuthModal.test.tsx
├── hooks/            # Custom hook tests
│   └── useAuth.test.ts
├── integration/      # Integration tests
│   └── jobSubmission.test.ts
├── mocks/           # Mock implementations
│   ├── supabase.ts
│   └── fileMock.js
├── setup/           # Test setup and configuration
│   └── jest.setup.ts
├── utils/           # Test utilities and helpers
│   └── testUtils.tsx
└── fixtures/        # Test data and fixtures
    └── mockData.ts
```

## 🚀 Getting Started

### 1. Install Dependencies

First, ensure all testing dependencies are installed:

```bash
npm install --save-dev jest @jest/globals @types/jest ts-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom identity-obj-proxy
```

### 2. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI (no watch, with coverage)
npm run test:ci
```

## 🔧 Configuration

### Jest Configuration (`jest.config.ts`)

The Jest configuration is optimized for Next.js with TypeScript:

- **Environment**: `jsdom` for React component testing
- **Transform**: `ts-jest` for TypeScript support
- **Module mapping**: Path aliases (`@/*` → `src/*`)
- **Coverage**: Comprehensive reporting with thresholds
- **Setup**: Automatic setup with React Testing Library

### TypeScript Configuration

Create a `tsconfig.test.json` for test-specific TypeScript settings:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["jest", "node", "@testing-library/jest-dom"]
  },
  "include": [
    "tests/**/*",
    "src/**/*"
  ]
}
```

## 🧪 Testing Patterns

### Server Actions Testing

Server actions are the core of FirstDevJob's data layer. Test them comprehensively:

```typescript
import { jest, describe, it, expect, beforeEach } from '@jest/globals'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('next/cache')

describe('Server Action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle valid input', async () => {
    // Arrange
    const inputData = { /* test data */ }
    
    // Act
    const result = await serverAction(inputData)
    
    // Assert
    expect(result).toEqual({ success: true })
  })
})
```

### Component Testing

Test React components with user interactions:

```typescript
import { render, screen } from '@testing-library/react'
import { createUserEvent } from '@/tests/utils/testUtils'

describe('Component', () => {
  it('should render and handle user interaction', async () => {
    const user = await createUserEvent()
    
    render(<Component />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(screen.getByText('Success')).toBeInTheDocument()
  })
})
```

### Hook Testing

Test custom hooks with React Testing Library:

```typescript
import { renderHook, act } from '@testing-library/react'

describe('useCustomHook', () => {
  it('should update state correctly', () => {
    const { result } = renderHook(() => useCustomHook())
    
    act(() => {
      result.current.updateState('new value')
    })
    
    expect(result.current.state).toBe('new value')
  })
})
```

## 🎭 Mocking Strategy

### Supabase Mocking

The Supabase client is comprehensively mocked in `tests/mocks/supabase.ts`:

```typescript
import { resetMockDatabase, setMockUser, setMockJobs } from '@/tests/mocks/supabase'

beforeEach(() => {
  resetMockDatabase()
  setMockUser({ id: 'test-user', email: 'test@example.com' })
})
```

### Next.js Mocking

Next.js modules are mocked in the Jest setup:

- `next/navigation` - Router functions
- `next/cache` - Revalidation functions
- `next/headers` - Request headers

### File and Asset Mocking

Static assets are mocked using `identity-obj-proxy` for CSS and custom file mock for media files.

## 📊 Coverage Requirements

The project maintains high code coverage standards:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

Generate coverage reports:

```bash
npm run test:coverage
```

View coverage report at `coverage/lcov-report/index.html`

## 🎯 Testing Guidelines

### 1. Test Structure (AAA Pattern)

Always use the Arrange-Act-Assert pattern:

```typescript
it('should do something', async () => {
  // Arrange
  const input = 'test input'
  
  // Act
  const result = await functionUnderTest(input)
  
  // Assert
  expect(result).toBe('expected output')
})
```

### 2. Descriptive Test Names

Write clear, descriptive test names that explain the expected behavior:

```typescript
// ✅ Good
it('should return validation error when email is empty')

// ❌ Bad
it('should validate email')
```

### 3. Test One Thing at a Time

Each test should focus on a single behavior:

```typescript
// ✅ Good - Single responsibility
it('should validate required fields')
it('should handle database errors')

// ❌ Bad - Multiple responsibilities
it('should validate and save data')
```

### 4. Use Data Factories

Create reusable test data factories:

```typescript
import { createMockJob, createMockUser } from '@/tests/utils/testUtils'

const mockJob = createMockJob({ title: 'Custom Title' })
```

### 5. Clean Up After Tests

Always clean up mocks and state:

```typescript
afterEach(() => {
  jest.restoreAllMocks()
  resetMockDatabase()
})
```

## 🔍 Debugging Tests

### Running Specific Tests

```bash
# Run specific test file
npm test auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should validate"

# Run tests in specific directory
npm test tests/actions/
```

### Debug Mode

```bash
# Run tests with debug output
npm test -- --verbose

# Run single test with full error output
npm test -- --no-coverage --verbose auth.test.ts
```

### Common Issues

1. **Module not found errors**: Check path mappings in `jest.config.ts`
2. **Async test timeouts**: Increase timeout or check for unresolved promises
3. **Mock not working**: Ensure mocks are set up before imports

## 🚀 Best Practices

### 1. Prefer Integration Over Unit Tests

Focus on testing user workflows rather than isolated functions.

### 2. Test Error Scenarios

Always test error cases and edge conditions:

```typescript
it('should handle network errors gracefully', async () => {
  mockApiCall.mockRejectedValue(new Error('Network error'))
  
  await expect(functionUnderTest()).rejects.toThrow('Network error')
})
```

### 3. Use Realistic Test Data

Use data that closely resembles production data:

```typescript
const mockJob = createMockJob({
  title: 'Senior Frontend Developer',
  company: 'TechCorp Inc.',
  tags: ['React', 'TypeScript', 'Next.js']
})
```

### 4. Test Accessibility

Include accessibility testing in component tests:

```typescript
it('should be accessible', () => {
  render(<Component />)
  
  const button = screen.getByRole('button', { name: 'Submit' })
  expect(button).toHaveAccessibleName()
})
```

### 5. Mock External Dependencies

Always mock external services and APIs:

```typescript
jest.mock('@/lib/external-service', () => ({
  apiCall: jest.fn().mockResolvedValue({ success: true })
}))
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)
- [TypeScript Jest Configuration](https://kulshekhar.github.io/ts-jest/)

## 🤝 Contributing

When adding new tests:

1. Follow the established patterns and structure
2. Update this documentation if adding new testing utilities
3. Ensure all tests pass before submitting PRs
4. Maintain or improve coverage percentages

For questions about testing, check the existing test files for examples or create an issue for discussion. 