import React from 'react'
import { render, fireEvent } from '@testing-library/react'

const mockSetCollapsed = jest.fn()
const mockSetOpen = jest.fn()

jest.mock('fumadocs-ui/components/sidebar/base', () => ({
  useSidebar: () => ({ setCollapsed: mockSetCollapsed, setOpen: mockSetOpen }),
}))

import { DocsKeyboardShortcuts } from '@/app/docs/keyboard-shortcuts'

function setViewport(desktop: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: desktop,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }))
}

describe('DocsKeyboardShortcuts', () => {
  beforeEach(() => {
    mockSetCollapsed.mockClear()
    mockSetOpen.mockClear()
    setViewport(true)
  })

  it('toggles the collapsed sidebar on Cmd+B on desktop', () => {
    render(<DocsKeyboardShortcuts />)
    fireEvent.keyDown(window, { key: 'b', metaKey: true })

    expect(mockSetCollapsed).toHaveBeenCalledTimes(1)
    expect(mockSetOpen).not.toHaveBeenCalled()
    const updater = mockSetCollapsed.mock.calls[0][0] as (value: boolean) => boolean
    expect(updater(false)).toBe(true)
    expect(updater(true)).toBe(false)
  })

  it('toggles the drawer on Ctrl+B on mobile', () => {
    setViewport(false)
    render(<DocsKeyboardShortcuts />)
    fireEvent.keyDown(window, { key: 'B', ctrlKey: true })

    expect(mockSetOpen).toHaveBeenCalledTimes(1)
    expect(mockSetCollapsed).not.toHaveBeenCalled()
  })

  it('ignores the shortcut while typing in a field or with extra modifiers', () => {
    render(
      <>
        <DocsKeyboardShortcuts />
        <input data-testid="field" />
      </>,
    )
    const field = document.querySelector('[data-testid="field"]') as HTMLInputElement
    fireEvent.keyDown(field, { key: 'b', metaKey: true })
    fireEvent.keyDown(window, { key: 'b', metaKey: true, shiftKey: true })
    fireEvent.keyDown(window, { key: 'b' })

    expect(mockSetCollapsed).not.toHaveBeenCalled()
    expect(mockSetOpen).not.toHaveBeenCalled()
  })

  it('removes the listener on unmount', () => {
    const { unmount } = render(<DocsKeyboardShortcuts />)
    unmount()
    fireEvent.keyDown(window, { key: 'b', metaKey: true })

    expect(mockSetCollapsed).not.toHaveBeenCalled()
  })
})
