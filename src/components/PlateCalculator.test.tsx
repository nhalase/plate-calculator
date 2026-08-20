import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PLATE_WEIGHTS, type PlateWeight } from '../domain/plates'
import { PlateCalculator } from './PlateCalculator'

function addButton(weight: PlateWeight) {
  return screen.getByRole('button', { name: `Add ${weight} lb plate` })
}

function removeButtons(weight: PlateWeight) {
  return screen.queryAllByRole('button', {
    name: `Remove ${weight} lb plate`,
  })
}

function totalOutput() {
  return screen.getByRole('status', { name: 'Current total' })
}

function totalResetControl() {
  return screen.getByRole('button', {
    name: /Current total \d+(?:\.\d+)? pounds\. Reset plates/,
  })
}

function configurationActionSlot() {
  const slot = document.querySelector<HTMLElement>(
    '[data-configuration-action-slot="true"]',
  )
  expect(slot).not.toBeNull()
  return slot as HTMLElement
}

async function addPlates(weights: readonly PlateWeight[]) {
  const user = userEvent.setup()
  for (const weight of weights) {
    await user.click(addButton(weight))
  }
  return user
}

describe('Slice 003 Plates to Total Weight calculator', () => {
  it('S3-AC-002 renders an empty 45 lb reverse calculator', () => {
    render(<PlateCalculator />)

    expect(totalOutput()).toHaveTextContent('45 lb')
    expect(totalResetControl()).toHaveAccessibleName(
      'Current total 45 pounds. Reset plates',
    )
    expect(screen.getByRole('heading', { name: 'Plates per side' })).toBeInTheDocument()
    expect(screen.queryByText('No plates loaded')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^Remove / }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Reset$/i })).not.toBeInTheDocument()
  })

  it('S3-AC-003 exposes and adds exactly every supported denomination', async () => {
    render(<PlateCalculator />)

    const addControls = screen.getAllByRole('button', { name: /^Add / })
    expect(addControls).toHaveLength(PLATE_WEIGHTS.length)
    expect(addControls.map((button) => button.getAttribute('aria-label'))).toEqual(
      PLATE_WEIGHTS.map((weight) => `Add ${weight} lb plate`),
    )

    await addPlates(PLATE_WEIGHTS)

    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(6)
    expect(totalOutput()).toHaveTextContent('290 lb')
  })

  it('S3-AC-004 adds repeated plates without disabling or moving focus', async () => {
    const user = userEvent.setup()
    render(<PlateCalculator />)
    const add45 = addButton(45)

    await user.click(add45)
    expect(add45).toHaveFocus()
    expect(add45).toBeEnabled()
    await user.keyboard('{Enter}')

    expect(add45).toHaveFocus()
    expect(add45).toBeEnabled()
    expect(removeButtons(45)).toHaveLength(2)
    expect(totalOutput()).toHaveTextContent('225 lb')
  })

  it.each<readonly [readonly PlateWeight[], number]>([
    [[], 45],
    [[45], 135],
    [[45, 10], 155],
    [[45, 45], 225],
    [[45, 35, 2.5], 210],
  ])('S3-AC-005 calculates %j as %s lb', async (plates, expected) => {
    render(<PlateCalculator />)

    await addPlates(plates)

    expect(totalOutput()).toHaveTextContent(`${expected} lb`)
  })

  it('S3-AC-006 displays plates in domain order, not insertion order', async () => {
    render(<PlateCalculator />)

    await addPlates([10, 45, 5, 25])

    const selectedRegion = screen.getByRole('region', {
      name: 'Plates per side',
    })
    const labels = within(selectedRegion)
      .getAllByRole('button', { name: /^Remove / })
      .map((button) => button.getAttribute('aria-label'))
    expect(labels).toEqual([
      'Remove 45 lb plate',
      'Remove 25 lb plate',
      'Remove 10 lb plate',
      'Remove 5 lb plate',
    ])
  })

  it('S3-AC-007 removes exactly one duplicate and updates the total', async () => {
    const user = userEvent.setup()
    render(<PlateCalculator />)
    await addPlates([45, 45, 10])
    expect(totalOutput()).toHaveTextContent('245 lb')

    await user.click(removeButtons(45)[0])

    expect(removeButtons(45)).toHaveLength(1)
    expect(removeButtons(10)).toHaveLength(1)
    expect(totalOutput()).toHaveTextContent('155 lb')
  })

  it('S3-AC-008 focuses the next plate after a middle removal', async () => {
    const user = userEvent.setup()
    render(<PlateCalculator />)
    await addPlates([45, 25, 10])

    await user.click(removeButtons(25)[0])

    expect(removeButtons(10)[0]).toHaveFocus()
  })

  it('S3-AC-008 focuses the previous plate after removing the final plate', async () => {
    const user = userEvent.setup()
    render(<PlateCalculator />)
    await addPlates([45, 25, 10])

    await user.click(removeButtons(10)[0])

    expect(removeButtons(25)[0]).toHaveFocus()
  })

  it('S3-AC-008 focuses the matching add control after the sole removal', async () => {
    const user = userEvent.setup()
    render(<PlateCalculator />)
    await user.click(addButton(10))

    await user.click(removeButtons(10)[0])

    expect(addButton(10)).toHaveFocus()
    expect(screen.queryByText('No plates loaded')).not.toBeInTheDocument()
  })

  it('S3-AC-013 uses native, clearly named controls without helper copy', () => {
    render(<PlateCalculator />)

    expect(screen.getAllByRole('button', { name: /^Add / })).toHaveLength(6)
    expect(
      screen.queryByText(/matching plates are assumed on the other side/i),
    ).not.toBeInTheDocument()
    expect(totalOutput()).toHaveAttribute('aria-live', 'polite')
    expect(totalResetControl().tagName).toBe('BUTTON')
  })

  it('S3-AC-016 resets only after two pointer activations within 500 ms', async () => {
    render(<PlateCalculator />)
    await addPlates([45, 10])
    const reset = totalResetControl()
    reset.focus()
    const now = vi.spyOn(Date, 'now')

    now.mockReturnValue(1_000)
    fireEvent.click(reset, { detail: 1 })
    expect(totalOutput()).toHaveTextContent('155 lb')
    expect(removeButtons(45)).toHaveLength(1)

    now.mockReturnValue(1_500)
    fireEvent.click(reset, { detail: 1 })

    expect(totalOutput()).toHaveTextContent('45 lb')
    expect(screen.queryByText('No plates loaded')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Remove / })).not.toBeInTheDocument()
    expect(reset).toHaveFocus()
    now.mockRestore()
  })

  it('S3-AC-016 expires a pointer pair after 500 ms and starts a new sequence', async () => {
    render(<PlateCalculator />)
    await addPlates([45])
    const reset = totalResetControl()
    const now = vi.spyOn(Date, 'now')

    now.mockReturnValue(1_000)
    fireEvent.click(reset, { detail: 1 })
    now.mockReturnValue(1_501)
    fireEvent.click(reset, { detail: 1 })
    expect(totalOutput()).toHaveTextContent('135 lb')

    now.mockReturnValue(2_000)
    fireEvent.click(reset, { detail: 1 })
    expect(totalOutput()).toHaveTextContent('45 lb')
    now.mockRestore()
  })

  it('S3-AC-016 resets immediately from keyboard activation', async () => {
    const user = userEvent.setup()
    render(<PlateCalculator />)
    await user.click(addButton(45))
    const reset = totalResetControl()
    reset.focus()

    await user.keyboard('{Enter}')

    expect(totalOutput()).toHaveTextContent('45 lb')
    expect(screen.queryByText('No plates loaded')).not.toBeInTheDocument()
    expect(reset).toHaveFocus()
  })

  it('S3-AC-016 clears duplicates, visualization, and Optimize in one reset', async () => {
    const user = userEvent.setup()
    render(<PlateCalculator />)
    await addPlates([35, 25, 25])
    const slot = configurationActionSlot()
    expect(screen.getByRole('button', { name: 'Optimize' })).toBeInTheDocument()

    await user.dblClick(totalResetControl())

    expect(totalOutput()).toHaveTextContent('45 lb')
    expect(reverseVisualPlates()).toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'Optimize' })).not.toBeInTheDocument()
    expect(configurationActionSlot()).toBe(slot)
  })

  it('S3-AC-016 treats reset of an empty load as a focused no-op', async () => {
    const user = userEvent.setup()
    render(<PlateCalculator />)
    const reset = totalResetControl()
    reset.focus()

    await user.keyboard('{Enter}')

    expect(totalOutput()).toHaveTextContent('45 lb')
    expect(screen.queryByText('No plates loaded')).not.toBeInTheDocument()
    expect(reset).toHaveFocus()
  })

  it('S3-AC-015 optimizes 35 + 25 to the greedy configuration without changing total or slot', async () => {
    const user = userEvent.setup()
    render(<PlateCalculator />)
    const slot = configurationActionSlot()
    expect(slot).toBeEmptyDOMElement()

    await user.click(addButton(35))
    await user.click(addButton(25))

    expect(totalOutput()).toHaveTextContent('165 lb')
    expect(screen.getByRole('button', { name: 'Optimize' })).toBeInTheDocument()
    expect(configurationActionSlot()).toBe(slot)

    await user.click(screen.getByRole('button', { name: 'Optimize' }))

    expect(totalOutput()).toHaveTextContent('165 lb')
    expect(removeButtons(45)).toHaveLength(1)
    expect(removeButtons(10)).toHaveLength(1)
    expect(removeButtons(5)).toHaveLength(1)
    expect(removeButtons(35)).toHaveLength(0)
    expect(removeButtons(25)).toHaveLength(0)
    expect(
      screen.queryByRole('button', { name: 'Optimize' }),
    ).not.toBeInTheDocument()
    expect(configurationActionSlot()).toBe(slot)
    expect(removeButtons(45)[0]).toHaveFocus()
  })

  it('S3-AC-015 hides Optimize for a manually entered greedy configuration', async () => {
    render(<PlateCalculator />)

    await addPlates([45, 10, 5])

    expect(totalOutput()).toHaveTextContent('165 lb')
    expect(
      screen.queryByRole('button', { name: 'Optimize' }),
    ).not.toBeInTheDocument()
    expect(configurationActionSlot()).toBeEmptyDOMElement()
  })

  it('AC-CALC-007-4 compares denomination counts rather than plate count alone', async () => {
    render(<PlateCalculator />)

    await addPlates([35, 10, 5])

    expect(totalOutput()).toHaveTextContent('145 lb')
    expect(screen.getByRole('button', { name: 'Optimize' })).toBeInTheDocument()
  })
})

function reverseVisualization() {
  return screen.getByRole('group', {
    name: /Plates on one side\. Fixed bar: 45 lb/,
  })
}

function reverseVisualPlates() {
  return [
    ...reverseVisualization().querySelectorAll<HTMLElement>(
      '[data-plate-weight]',
    ),
  ]
}

describe('Slice 004 reverse visualization integration', () => {
  it('S4-AC-005 renders empty hardware with the empty reverse state', () => {
    const { container } = render(<PlateCalculator />)

    expect(totalOutput()).toHaveTextContent('45 lb')
    expect(screen.queryByText('No plates loaded')).not.toBeInTheDocument()
    expect(reverseVisualPlates()).toHaveLength(0)
    expect(container.querySelector('[data-barbell-part="shaft"]')).not.toBeNull()
    expect(container.querySelector('[data-barbell-part="collar"]')).not.toBeNull()
    expect(container.querySelector('[data-barbell-part="sleeve"]')).not.toBeNull()
  })

  it('S4-AC-006 synchronizes graphical additions, colors, total, and add focus', async () => {
    const user = userEvent.setup()
    render(<PlateCalculator />)
    await user.click(addButton(45))
    const add10 = addButton(10)
    await user.click(add10)

    expect(totalOutput()).toHaveTextContent('155 lb')
    expect(add10).toHaveFocus()
    expect(reverseVisualPlates().map((plate) => plate.dataset.plateWeight)).toEqual([
      '45',
      '10',
    ])
    expect(reverseVisualPlates().map((plate) => plate.dataset.plateColor)).toEqual([
      'red',
      'green',
    ])
    const remove45 = screen.getByRole('button', { name: 'Remove 45 lb plate' })
    expect(remove45.querySelector('.barbell__plate-weight')).toHaveTextContent('45')
    expect(remove45.querySelector('.barbell__plate-unit')).toHaveTextContent('LB')
  })

  it('S4-AC-007 keeps graphical order and color independent of insertion order', async () => {
    render(<PlateCalculator />)

    await addPlates([10, 45, 5, 25])

    expect(reverseVisualPlates().map((plate) => plate.dataset.plateWeight)).toEqual([
      '45',
      '25',
      '10',
      '5',
    ])
    expect(reverseVisualPlates().map((plate) => plate.dataset.plateColor)).toEqual([
      'red',
      'yellow',
      'green',
      'black',
    ])
  })

  it('S4-AC-008 removes a graphical plate, updates total, and focuses the next plate', async () => {
    const user = userEvent.setup()
    render(<PlateCalculator />)
    await addPlates([45, 25, 10])
    expect(totalOutput()).toHaveTextContent('205 lb')

    await user.click(screen.getByRole('button', { name: 'Remove 25 lb plate' }))

    expect(reverseVisualPlates().map((plate) => plate.dataset.plateWeight)).toEqual([
      '45',
      '10',
    ])
    expect(totalOutput()).toHaveTextContent('155 lb')
    expect(screen.getByRole('button', { name: 'Remove 10 lb plate' })).toHaveFocus()
  })

  it('S4-AC-009 keeps duplicate graphical plates independently removable', async () => {
    const user = userEvent.setup()
    render(<PlateCalculator />)
    await addPlates([45, 45])
    const duplicates = screen.getAllByRole('button', {
      name: 'Remove 45 lb plate',
    })

    expect(duplicates).toHaveLength(2)
    expect(duplicates.every((plate) => plate.dataset.plateColor === 'red')).toBe(
      true,
    )
    await user.click(duplicates[0])
    expect(
      screen.getAllByRole('button', { name: 'Remove 45 lb plate' }),
    ).toHaveLength(1)
  })

  it('S4-AC-015 replaces reverse graphics with the greedy configuration', async () => {
    const user = userEvent.setup()
    render(<PlateCalculator />)
    await addPlates([35, 25])
    const slot = configurationActionSlot()

    expect(reverseVisualPlates().map((plate) => plate.dataset.plateWeight)).toEqual([
      '35',
      '25',
    ])
    expect(reverseVisualPlates().map((plate) => plate.dataset.plateColor)).toEqual([
      'blue',
      'yellow',
    ])

    await user.click(screen.getByRole('button', { name: 'Optimize' }))

    expect(totalOutput()).toHaveTextContent('165 lb')
    expect(reverseVisualPlates().map((plate) => plate.dataset.plateWeight)).toEqual([
      '45',
      '10',
      '5',
    ])
    expect(reverseVisualPlates().map((plate) => plate.dataset.plateColor)).toEqual([
      'red',
      'green',
      'black',
    ])
    expect(configurationActionSlot()).toBe(slot)
    expect(screen.getByRole('button', { name: 'Remove 45 lb plate' })).toHaveFocus()
  })
})
