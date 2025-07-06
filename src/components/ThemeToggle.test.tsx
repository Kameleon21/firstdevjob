import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import { ThemeToggle } from './ThemeToggle'
import { useTheme } from 'next-themes'

// Mock the useTheme hook
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}))

describe('ThemeToggle', () => {
  it('renders the sun icon when the theme is light', () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
    })

    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    expect(button.querySelector('.dark\\:-rotate-90')).not.toBeNull()
  })

  it('renders the moon icon when the theme is dark', () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: 'dark',
      setTheme: jest.fn(),
    })

    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    expect(button.querySelector('.dark\\:scale-100')).not.toBeNull()
  })

  it('calls setTheme with "dark" when the theme is light and the button is clicked', () => {
    const setTheme = jest.fn()
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme,
    })

    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(setTheme).toHaveBeenCalledWith('dark')
  })

  it('calls setTheme with "light" when the theme is dark and the button is clicked', () => {
    const setTheme = jest.fn()
    ;(useTheme as jest.Mock).mockReturnValue({
      theme: 'dark',
      setTheme,
    })

    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(setTheme).toHaveBeenCalledWith('light')
  })
}) 