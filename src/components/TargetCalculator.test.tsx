import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { TargetCalculator } from './TargetCalculator'

function targetButton() {
  return screen.getByRole('button', { name: 'Edit target weight' })
}

function increaseButton() {
  return screen.getByRole('button', {
    name: 'Increase target by 5 pounds',
  })
}

function decreaseButton() {
  return screen.getByRole('button', {
    name: 'Decrease target by 5 pounds',
  })
}

async function enterDraft(draft: string) {
  const user = userEvent.setup()
  await user.click(targetButton())
  const input = screen.getByRole('textbox', { name: 'Target weight' })
  await user.clear(input)
  if (draft.length > 0) {
    await user.type(input, draft)
  }
  return { input, user }
}

async function commitTarget(draft: string) {
  const { input, user } = await enterDraft(draft)
  await user.type(input, '{Enter}')
  return user
}

describe('Slice 002 Target Weight to Plates UI', () => {
  it('S2-AC-001 renders the initial empty 45 lb bar without configuration controls', () => {
    render(<TargetCalculator />)

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Target weight (tap to change)',
      }),
    ).toBeInTheDocument()
    expect(targetButton()).toHaveTextContent('45')
    expect(targetButton()).toHaveTextContent('lb')
    expect(screen.getByText('No plates required')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Reduce plates' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('textbox', { name: /bar weight/i }),
    ).not.toBeInTheDocument()
  })

  it('S2-AC-002 increments immediately without a Calculate or Submit action', async () => {
    const user = userEvent.setup()
    render(<TargetCalculator />)

    await user.click(increaseButton())

    expect(targetButton()).toHaveTextContent('50')
    expect(screen.getByRole('status')).toHaveTextContent('2.5')
    expect(
      screen.queryByRole('button', { name: /calculate|submit|apply/i }),
    ).not.toBeInTheDocument()
  })

  it('S2-AC-003 enforces the decrement floor and decrements above it', async () => {
    const user = userEvent.setup()
    render(<TargetCalculator />)

    await user.click(decreaseButton())
    expect(targetButton()).toHaveTextContent('45')

    await user.click(increaseButton())
    await user.click(decreaseButton())
    expect(targetButton()).toHaveTextContent('45')
    expect(screen.getByText('No plates required')).toBeInTheDocument()
  })

  it('S2-AC-004 focuses, selects, and declares decimal input behavior', async () => {
    const user = userEvent.setup()
    render(<TargetCalculator />)

    await user.click(targetButton())
    const input = screen.getByRole('textbox', { name: 'Target weight' })

    expect(input).toHaveFocus()
    expect(input).toHaveValue('45')
    expect(input).toHaveAttribute('inputmode', 'decimal')
    expect(input).toHaveAttribute('autocomplete', 'off')
    expect(input).toHaveProperty('selectionStart', 0)
    expect(input).toHaveProperty('selectionEnd', 2)
  })

  it('S2-AC-005 commits an achievable target with Enter', async () => {
    render(<TargetCalculator />)

    await commitTarget('155')

    expect(targetButton()).toHaveTextContent('155')
    expect(screen.getByText('45 + 10')).toBeInTheDocument()
    expect(screen.queryByText(/Nearest loadable weight/i)).not.toBeInTheDocument()
  })

  it('S2-AC-006 commits a decimal midpoint and shows adjustment feedback', async () => {
    render(<TargetCalculator />)

    await commitTarget('137.5')

    expect(targetButton()).toHaveTextContent('135')
    expect(
      screen.getByText('Nearest loadable weight to 137.5 lb'),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('45')
  })

  it('S2-AC-007 commits upward rounding through blur', async () => {
    render(<TargetCalculator />)
    const { user } = await enterDraft('138')

    await user.tab()

    expect(targetButton()).toHaveTextContent('140')
    expect(
      screen.getByText('Nearest loadable weight to 138 lb'),
    ).toBeInTheDocument()
  })

  it.each([
    '',
    '   ',
    '.',
    '+',
    '-',
    '13..5',
    '135lb',
    '135 lbs',
    '135abc',
    '1e2',
    '0x90',
    'NaN',
    'Infinity',
  ])('S2-AC-008 rejects %j and preserves valid state', async (draft) => {
    const user = userEvent.setup()
    render(<TargetCalculator />)

    await user.click(targetButton())
    let input = screen.getByRole('textbox', { name: 'Target weight' })
    await user.clear(input)
    await user.type(input, '163{Enter}')
    await user.click(screen.getByRole('button', { name: 'Reduce plates' }))

    await user.click(targetButton())
    input = screen.getByRole('textbox', { name: 'Target weight' })
    await user.clear(input)
    if (draft.length > 0) {
      await user.type(input, draft)
    }
    await user.type(input, '{Enter}')

    expect(targetButton()).toHaveTextContent('165')
    expect(screen.getByText('35 + 25')).toBeInTheDocument()
    expect(
      screen.getByText('Nearest loadable weight to 163 lb'),
    ).toBeInTheDocument()
  })

  it('S2-AC-008 treats below-bar finite input as valid and resolves it to 45', async () => {
    render(<TargetCalculator />)

    await commitTarget('-10')

    expect(targetButton()).toHaveTextContent('45')
    expect(
      screen.getByText('Nearest loadable weight to -10 lb'),
    ).toBeInTheDocument()
  })

  it('S2-AC-009 cancels with Escape and ignores the following blur', async () => {
    const user = userEvent.setup()
    render(<TargetCalculator />)

    await commitTarget('163')
    await user.click(screen.getByRole('button', { name: 'Reduce plates' }))
    await user.click(targetButton())
    const input = screen.getByRole('textbox', { name: 'Target weight' })
    await user.clear(input)
    await user.type(input, '225{Escape}')

    expect(targetButton()).toHaveTextContent('165')
    expect(screen.getByText('35 + 25')).toBeInTheDocument()
    expect(
      screen.getByText('Nearest loadable weight to 163 lb'),
    ).toBeInTheDocument()
  })

  it('S2-AC-010 reduces plates without moving or exposing an unavailable action', async () => {
    const user = userEvent.setup()
    render(<TargetCalculator />)

    await commitTarget('165')
    expect(screen.getByText('45 + 10 + 5')).toBeInTheDocument()
    const actionSlot = document.querySelector(
      '[data-configuration-action-slot="true"]',
    )
    expect(actionSlot).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reduce plates' }))

    expect(targetButton()).toHaveTextContent('165')
    expect(screen.getByText('35 + 25')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Reduce plates' }),
    ).not.toBeInTheDocument()
    expect(
      document.querySelector('[data-configuration-action-slot="true"]'),
    ).toBe(actionSlot)
  })

  it('S2-AC-011 hides Reduce plates when the greedy result is minimal', async () => {
    render(<TargetCalculator />)

    await commitTarget('155')

    expect(
      screen.queryByRole('button', { name: 'Reduce plates' }),
    ).not.toBeInTheDocument()
  })

  it('S2-AC-012 resets to the default result after a target change', async () => {
    const user = userEvent.setup()
    render(<TargetCalculator />)

    await commitTarget('165')
    await user.click(screen.getByRole('button', { name: 'Reduce plates' }))
    await user.click(increaseButton())

    expect(targetButton()).toHaveTextContent('170')
    expect(screen.getByText('45 + 10 + 5 + 2.5')).toBeInTheDocument()
    expect(screen.queryByText(/Nearest loadable weight/i)).not.toBeInTheDocument()
  })

  it('S2-AC-013 preserves adjustment feedback during optimization', async () => {
    const user = userEvent.setup()
    render(<TargetCalculator />)

    await commitTarget('163')
    await user.click(screen.getByRole('button', { name: 'Reduce plates' }))

    expect(targetButton()).toHaveTextContent('165')
    expect(screen.getByText('35 + 25')).toBeInTheDocument()
    expect(
      screen.getByText('Nearest loadable weight to 163 lb'),
    ).toBeInTheDocument()
  })

  it('commits Enter only once when blur follows it', async () => {
    render(<TargetCalculator />)

    await commitTarget('137')

    expect(targetButton()).toHaveTextContent('135')
    expect(
      screen.getByText('Nearest loadable weight to 137 lb'),
    ).toBeInTheDocument()
  })

  it('clears old adjustment feedback after an exact commit and an increment', async () => {
    const user = userEvent.setup()
    render(<TargetCalculator />)

    await commitTarget('137')
    await commitTarget('155')
    expect(screen.queryByText(/Nearest loadable weight/i)).not.toBeInTheDocument()

    await commitTarget('137')
    await user.click(increaseButton())
    expect(screen.queryByText(/Nearest loadable weight/i)).not.toBeInTheDocument()
  })
})

function targetVisualization() {
  return screen.getByRole('img', { name: /Plates required on one side/ })
}

function visualWeights() {
  return [
    ...targetVisualization().querySelectorAll<HTMLElement>(
      '[data-plate-weight]',
    ),
  ].map((plate) => plate.dataset.plateWeight)
}

describe('Slice 004 target visualization integration', () => {
  it('S4-AC-001 renders an empty read-only barbell for the initial target', () => {
    render(<TargetCalculator />)

    expect(screen.getByText('No plates required')).toBeInTheDocument()
    expect(targetVisualization()).toHaveAccessibleName(
      'Plates required on one side. Fixed bar: 45 lb. One side: no plates',
    )
    expect(visualWeights()).toEqual([])
    expect(
      screen.queryByRole('button', { name: /^Remove / }),
    ).not.toBeInTheDocument()
  })

  it('S4-AC-002 keeps default text and visual plates synchronized', async () => {
    render(<TargetCalculator />)

    await commitTarget('155')

    expect(screen.getByText('45 + 10')).toBeInTheDocument()
    expect(visualWeights()).toEqual(['45', '10'])
    const plates = targetVisualization().querySelectorAll<HTMLElement>(
      '[data-plate-weight]',
    )
    expect([...plates].map((plate) => plate.dataset.plateColor)).toEqual([
      'red',
      'green',
    ])
    expect(Number.parseInt(plates[0].style.getPropertyValue('--plate-height'))).toBeGreaterThan(
      Number.parseInt(plates[1].style.getPropertyValue('--plate-height')),
    )
    expect(
      screen.queryByRole('button', { name: /^Remove / }),
    ).not.toBeInTheDocument()
  })

  it('S4-AC-003 replaces default text and graphics together on Reduce plates', async () => {
    const user = userEvent.setup()
    render(<TargetCalculator />)
    await commitTarget('165')
    expect(visualWeights()).toEqual(['45', '10', '5'])

    await user.click(screen.getByRole('button', { name: 'Reduce plates' }))

    expect(targetButton()).toHaveTextContent('165')
    expect(screen.getByText('35 + 25')).toBeInTheDocument()
    expect(visualWeights()).toEqual(['35', '25'])
    expect(
      [...targetVisualization().querySelectorAll<HTMLElement>('[data-plate-color]')].map(
        (plate) => plate.dataset.plateColor,
      ),
    ).toEqual(['blue', 'yellow'])
  })

  it('S4-AC-004 resets text and graphics to the new default after a target change', async () => {
    const user = userEvent.setup()
    render(<TargetCalculator />)
    await commitTarget('165')
    await user.click(screen.getByRole('button', { name: 'Reduce plates' }))

    await user.click(increaseButton())

    expect(screen.getByText('45 + 10 + 5 + 2.5')).toBeInTheDocument()
    expect(visualWeights()).toEqual(['45', '10', '5', '2.5'])
  })
})
