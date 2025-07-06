'use client'

import { useTheme } from './ThemeProvider'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, toggleTheme, isHydrated } = useTheme()

  // THE GATE: If we're on the server or the client hasn't hydrated yet,
  // return null so there's no icon to flash from.
  if (!isHydrated) {
    return null;
  }

  // Once hydrated, this code will run and render the correct icon instantly.
  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring transition-all duration-300 ease-in-out"
    >
      <div className="relative">
        <Sun className={`h-6 w-6 transition-all duration-300 ease-in-out ${
          theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
        }`} />
        <Moon className={`absolute top-0 left-0 h-6 w-6 transition-all duration-300 ease-in-out ${
          theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'
        }`} />
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  )
} 