import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ThemeProvider, { useTheme } from '@/components/ThemeProvider'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock matchMedia
const mockMatchMedia = jest.fn()
Object.defineProperty(window, 'matchMedia', {
  value: mockMatchMedia,
})

// Test component that uses the theme hook
function TestComponent() {
  const { theme, toggleTheme, isHydrated } = useTheme()
  
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="hydrated">{isHydrated ? 'hydrated' : 'not-hydrated'}</div>
      <button onClick={toggleTheme} data-testid="toggle">
        Toggle Theme
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Mock document.documentElement
    Object.defineProperty(document.documentElement, 'setAttribute', {
      value: jest.fn(),
      writable: true,
    })
    
    Object.defineProperty(document.documentElement, 'getAttribute', {
      value: jest.fn(),
      writable: true,
    })
    
    // Mock matchMedia
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })
  })

  it('initializes with dark theme by default', () => {
    ;(document.documentElement.getAttribute as jest.Mock).mockReturnValue('dark')
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('sets isHydrated to true after mounting', async () => {
    ;(document.documentElement.getAttribute as jest.Mock).mockReturnValue('light')
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('hydrated')).toHaveTextContent('hydrated')
    })
  })

  it('toggles theme from light to dark', async () => {
    ;(document.documentElement.getAttribute as jest.Mock).mockReturnValue('light')
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('light')
    })

    fireEvent.click(screen.getByTestId('toggle'))

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    })
    
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
  })

  it('toggles theme from dark to light', async () => {
    ;(document.documentElement.getAttribute as jest.Mock).mockReturnValue('dark')
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    })

    fireEvent.click(screen.getByTestId('toggle'))

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('light')
    })
    
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light')
  })

  it('sets up OS theme change listener', () => {
    const mockAddEventListener = jest.fn()
    const mockRemoveEventListener = jest.fn()
    
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    })

    const { unmount } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    
    unmount()
    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('handles OS theme changes when no user preference is set', async () => {
    const mockAddEventListener = jest.fn()
    mockLocalStorage.getItem.mockReturnValue(null) // No user preference
    
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: mockAddEventListener,
      removeEventListener: jest.fn(),
    })

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    // Get the change handler
    const changeHandler = mockAddEventListener.mock.calls[0][1]
    
    // Simulate OS theme change to dark
    changeHandler({ matches: true })
    
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
  })

  it('ignores OS theme changes when user preference exists', async () => {
    const mockAddEventListener = jest.fn()
    mockLocalStorage.getItem.mockReturnValue('light') // User has preference
    
    ;(document.documentElement.getAttribute as jest.Mock).mockReturnValue('light')
    
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: mockAddEventListener,
      removeEventListener: jest.fn(),
    })

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    // Wait for initial setup to complete
    await waitFor(() => {
      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })

    // Clear calls from initial setup
    ;(document.documentElement.setAttribute as jest.Mock).mockClear()

    // Get the change handler
    const changeHandler = mockAddEventListener.mock.calls[0][1]
    
    // Simulate OS theme change to dark
    changeHandler({ matches: true })
    
    // Should not change theme since user has preference
    expect(document.documentElement.setAttribute).not.toHaveBeenCalledWith('data-theme', 'dark')
  })
}) 