import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useTheme } from '@/components/ThemeProvider'

// Mock the useTheme hook
jest.mock('@/components/ThemeProvider', () => ({
  useTheme: jest.fn(),
}))

describe('ThemeToggle', () => {
  const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>

  beforeEach(() => {
    mockUseTheme.mockReset()
  })

  it('renders null when not hydrated (hydration gate)', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
      isHydrated: false,
    })

    const { container } = render(<ThemeToggle />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the toggle button when hydrated', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
      isHydrated: true,
    })

    render(<ThemeToggle />)
    
    const button = screen.getByRole('button')
    expect(button).toBeTruthy()
  })

  it('renders with light theme styling when theme is light', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
      isHydrated: true,
    })

    render(<ThemeToggle />)
    
    const button = screen.getByRole('button')
    expect(button).toBeTruthy()
    expect(screen.getByText('Toggle theme')).toBeTruthy()
  })

  it('renders with dark theme styling when theme is dark', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      toggleTheme: jest.fn(),
      isHydrated: true,
    })

    render(<ThemeToggle />)
    
    const button = screen.getByRole('button')
    expect(button).toBeTruthy()
    expect(screen.getByText('Toggle theme')).toBeTruthy()
  })

  it('calls toggleTheme when the button is clicked', () => {
    const toggleTheme = jest.fn()
    mockUseTheme.mockReturnValue({
      theme: 'light',
      toggleTheme,
      isHydrated: true,
    })

    render(<ThemeToggle />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(toggleTheme).toHaveBeenCalledTimes(1)
  })

  it('has proper accessibility attributes', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
      isHydrated: true,
    })

    render(<ThemeToggle />)
    
    const button = screen.getByRole('button')
    expect(button.className).toContain('focus:ring-2')
    expect(screen.getByText('Toggle theme').className).toContain('sr-only')
  })
}) 