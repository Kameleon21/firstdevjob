import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

const mockInitialize = jest.fn()
const mockRender = jest.fn()
let mockResolvedTheme = 'dark'

jest.mock('mermaid', () => ({
  __esModule: true,
  default: { initialize: mockInitialize, render: mockRender },
}))

jest.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: mockResolvedTheme }),
}))

import { Mermaid } from '@/components/docs/Mermaid'

describe('Mermaid', () => {
  beforeEach(() => {
    mockInitialize.mockClear()
    mockRender.mockReset()
    mockResolvedTheme = 'dark'
  })

  it('renders the diagram SVG with an accessible label and the source', async () => {
    mockRender.mockResolvedValue({ svg: '<svg data-testid="svg"><title>x</title></svg>' })

    render(<Mermaid chart="flowchart LR\n A --> B" title="A to B" />)

    const figure = await screen.findByRole('img', { name: 'A to B' })
    expect(figure.querySelector('svg')).not.toBeNull()
    expect(screen.getByText('A to B', { selector: 'figcaption' })).toBeInTheDocument()
    expect(screen.getByText('Diagram source')).toBeInTheDocument()
    expect(screen.getByText(/A --> B/)).toBeInTheDocument()
  })

  it('passes theme variables that follow the resolved theme', async () => {
    mockRender.mockResolvedValue({ svg: '<svg></svg>' })
    mockResolvedTheme = 'light'

    render(<Mermaid chart="flowchart LR\n A --> B" />)

    await waitFor(() => expect(mockRender).toHaveBeenCalled())
    const config = mockInitialize.mock.calls[0][0]
    expect(config.securityLevel).toBe('strict')
    expect(config.themeVariables.background).toBe('#ffffff')
    expect(mockRender.mock.calls[0][0]).toMatch(/-light$/)
  })

  it('shows the error instead of crashing when the chart is invalid', async () => {
    mockRender.mockRejectedValue(new Error('Parse error on line 2'))

    render(<Mermaid chart="not a diagram" />)

    expect(await screen.findByText(/Diagram failed to render: Parse error on line 2/)).toBeInTheDocument()
  })
})
