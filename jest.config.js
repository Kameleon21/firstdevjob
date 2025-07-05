const config = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.{ts,tsx}',
    '<rootDir>/app/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/app/**/*.{test,spec}.{ts,tsx}',
    '<rootDir>/components/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/components/**/*.{test,spec}.{ts,tsx}',
    '<rootDir>/lib/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/lib/**/*.{test,spec}.{ts,tsx}'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/middleware.ts', // Next.js middleware
    '!src/**/layout.{ts,tsx}',
    '!src/**/loading.{ts,tsx}',
    '!src/**/error.{ts,tsx}',
    '!src/**/not-found.{ts,tsx}',
    '!src/**/globals.css',
    '!**/node_modules/**',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Transform configuration
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          module: 'esnext',
          moduleResolution: 'node',
          resolveJsonModule: true,
          isolatedModules: true,
        },
      },
    ],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Global test timeout
  testTimeout: 10000,
  
  // Module name mapping for path aliases and assets
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/mocks/fileMock.js',
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/mocks/',
    '<rootDir>/tests/fixtures/',
  ],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!(.*\\.mjs$))',
  ],
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/'],
}

module.exports = config 