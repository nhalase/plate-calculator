import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { App } from './App'

function targetModeButton() {
  return screen.getByRole('button', { name: 'Target Weight → Plates' })
}

function reverseModeButton() {
  return screen.getByRole('button', { name: 'Plates → Total Weight' })
}

function targetButton() {
  return screen.getByRole('button', { name: 'Edit target weight' })
}

async function commitTarget(value: string) {
  const user = userEvent.setup()
  await user.click(targetButton())
  const input = screen.getByRole('textbox', { name: 'Target weight' })
  await user.clear(input)
  await user.type(input, `${value}{Enter}`)
  return user
}

describe('Slice 003 application mode integration', () => {
  it('S5-AC-002 renders the CSS-only product brand', () => {
    const { container } = render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Plate Calculator' }),
    ).toBeInTheDocument()
    expect(container.querySelector('[data-brand-mark="barbell"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(container.querySelector('img, svg, canvas')).toBeNull()
  })

  it('S5-AC-003 uses compact visible mode copy with established accessible names', async () => {
    const user = userEvent.setup()
    render(<App />)
    const choices = screen.getByRole('group', { name: 'Calculator mode' })
      .querySelectorAll('button')

    expect(choices).toHaveLength(2)
    expect(choices[0]).toHaveTextContent('Target → Plates')
    expect(choices[1]).toHaveTextContent('Plates → Total')
    expect(targetModeButton()).toHaveAttribute('aria-pressed', 'true')
    expect(reverseModeButton()).toHaveAttribute('aria-pressed', 'false')

    await user.click(reverseModeButton())

    expect(targetModeButton()).toHaveAttribute('aria-pressed', 'false')
    expect(reverseModeButton()).toHaveAttribute('aria-pressed', 'true')
  })

  it('S3-AC-001 starts in target mode with reverse content inaccessible', () => {
    render(<App />)

    expect(targetModeButton()).toHaveAttribute('aria-pressed', 'true')
    expect(reverseModeButton()).toHaveAttribute('aria-pressed', 'false')
    expect(targetButton()).toHaveTextContent('45')
    expect(
      screen.queryByRole('heading', { name: 'Current total' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^Add / }),
    ).not.toBeInTheDocument()
  })

  it('S3-AC-002 switches to the empty reverse mode without changing the URL', async () => {
    const user = userEvent.setup()
    render(<App />)
    const initialUrl = window.location.href

    await user.click(reverseModeButton())

    expect(reverseModeButton()).toHaveAttribute('aria-pressed', 'true')
    expect(targetModeButton()).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('status', { name: 'Current total' })).toHaveTextContent(
      '45 lb',
    )
    expect(screen.getByText('No plates loaded')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Add / })).toHaveLength(6)
    expect(window.location.href).toBe(initialUrl)
    expect(
      screen.queryByRole('button', { name: 'Edit target weight' }),
    ).not.toBeInTheDocument()
  })

  it('S3-AC-009 preserves reverse state through a mode round trip', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(reverseModeButton())
    await user.click(screen.getByRole('button', { name: 'Add 45 lb plate' }))
    await user.click(screen.getByRole('button', { name: 'Add 10 lb plate' }))

    await user.click(targetModeButton())
    await user.click(reverseModeButton())

    expect(
      screen.getByRole('button', { name: 'Remove 45 lb plate' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Remove 10 lb plate' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Current total' })).toHaveTextContent(
      '155 lb',
    )
  })

  it('S3-AC-010 preserves rounded optimized target state through a mode round trip', async () => {
    const user = userEvent.setup()
    render(<App />)
    await commitTarget('163')
    await user.click(screen.getByRole('button', { name: 'Reduce plates' }))

    await user.click(reverseModeButton())
    await user.click(targetModeButton())

    expect(targetButton()).toHaveTextContent('165')
    expect(screen.getByText('35 + 25')).toBeInTheDocument()
    expect(
      screen.getByText('Nearest loadable weight to 163 lb'),
    ).toBeInTheDocument()
  })

  it('S3-AC-011 cancels an unfinished target draft when reverse mode is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    await commitTarget('155')
    await user.click(targetButton())
    const input = screen.getByRole('textbox', { name: 'Target weight' })
    await user.clear(input)
    await user.type(input, '225')

    await user.click(reverseModeButton())
    await user.click(targetModeButton())

    expect(
      screen.queryByRole('textbox', { name: 'Target weight' }),
    ).not.toBeInTheDocument()
    expect(targetButton()).toHaveTextContent('155')
    expect(screen.getByText('45 + 10')).toBeInTheDocument()
    expect(screen.queryByText('45 + 45')).not.toBeInTheDocument()
  })

  it('S3-AC-011 cancels an empty draft when mode changes programmatically', async () => {
    const user = userEvent.setup()
    render(<App />)
    await commitTarget('155')
    await user.click(targetButton())
    await user.clear(screen.getByRole('textbox', { name: 'Target weight' }))

    reverseModeButton().click()
    await user.click(targetModeButton())

    expect(targetButton()).toHaveTextContent('155')
    expect(screen.getByText('45 + 10')).toBeInTheDocument()
  })

  it('S3-AC-012 treats activation of the current target mode as a no-op', async () => {
    const user = userEvent.setup()
    render(<App />)
    await commitTarget('155')

    await user.click(targetModeButton())

    expect(targetModeButton()).toHaveFocus()
    expect(targetButton()).toHaveTextContent('155')
    expect(screen.getByText('45 + 10')).toBeInTheDocument()
  })

  it('S3-AC-012 treats activation of the current reverse mode as a no-op', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(reverseModeButton())
    await user.click(screen.getByRole('button', { name: 'Add 45 lb plate' }))

    await user.click(reverseModeButton())

    expect(reverseModeButton()).toHaveFocus()
    expect(
      screen.getByRole('button', { name: 'Remove 45 lb plate' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Current total' })).toHaveTextContent(
      '135 lb',
    )
  })

  it('S3-AC-013 exposes a labeled native mode group and only one active panel', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('group', { name: 'Calculator mode' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)
    expect(targetButton()).toBeInTheDocument()

    await user.click(reverseModeButton())

    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)
    expect(
      screen.queryByRole('button', { name: 'Edit target weight' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Current total' })).toBeInTheDocument()
  })

  it('S3-AC-014 resets both calculators after a full App remount', async () => {
    const user = userEvent.setup()
    const rendered = render(<App />)
    await commitTarget('155')
    await user.click(reverseModeButton())
    await user.click(screen.getByRole('button', { name: 'Add 45 lb plate' }))
    rendered.unmount()

    render(<App />)

    expect(targetModeButton()).toHaveAttribute('aria-pressed', 'true')
    expect(targetButton()).toHaveTextContent('45')
    await user.click(reverseModeButton())
    expect(screen.getByText('No plates loaded')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Current total' })).toHaveTextContent(
      '45 lb',
    )
  })

  it('S4-AC-013 preserves independent target and reverse visualizations across modes', async () => {
    const user = userEvent.setup()
    render(<App />)
    await commitTarget('165')
    await user.click(screen.getByRole('button', { name: 'Reduce plates' }))
    expect(
      screen
        .getByRole('img', { name: /Plates required on one side/ })
        .querySelectorAll('[data-plate-weight]'),
    ).toHaveLength(2)

    await user.click(reverseModeButton())
    await user.click(screen.getByRole('button', { name: 'Add 45 lb plate' }))
    await user.click(screen.getByRole('button', { name: 'Add 10 lb plate' }))
    expect(
      screen
        .getByRole('group', { name: /Plates on one side\. Fixed bar: 45 lb/ })
        .querySelectorAll('[data-plate-weight]'),
    ).toHaveLength(2)

    await user.click(targetModeButton())
    const targetVisual = screen.getByRole('img', {
      name: /Plates required on one side/,
    })
    expect(
      [...targetVisual.querySelectorAll<HTMLElement>('[data-plate-weight]')].map(
        (plate) => plate.dataset.plateWeight,
      ),
    ).toEqual(['35', '25'])

    await user.click(reverseModeButton())
    const reverseVisual = screen.getByRole('group', {
      name: /Plates on one side\. Fixed bar: 45 lb/,
    })
    expect(
      [...reverseVisual.querySelectorAll<HTMLElement>('[data-plate-weight]')].map(
        (plate) => plate.dataset.plateWeight,
      ),
    ).toEqual(['45', '10'])
  })
})
