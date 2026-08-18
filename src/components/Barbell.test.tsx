import { act, createRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  PLATE_DEFINITIONS,
  PLATE_WEIGHTS,
  type PlateConfiguration,
  type PlateWeight,
} from '../domain/plates'
import { Barbell, type BarbellHandle } from './Barbell'
import { PLATE_COLOR_TOKENS, PLATE_HEIGHTS } from './plateVisuals'

function visualPlates(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>('[data-plate-weight]')]
}

function channelToLinear(channel: number) {
  const normalized = channel / 255
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string) {
  const channels = [1, 3, 5].map((start) =>
    Number.parseInt(hex.slice(start, start + 2), 16),
  )
  const [red, green, blue] = channels.map(channelToLinear)
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrastRatio(first: string, second: string) {
  const firstLuminance = luminance(first)
  const secondLuminance = luminance(second)
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Slice 004 shared Barbell', () => {
  it('S4-AC-001 renders named empty hardware without plates', () => {
    const { container } = render(
      <Barbell
        mode="readonly"
        plates={[]}
        accessibleLabel="Plates required on one side"
      />,
    )

    expect(
      screen.getByRole('img', {
        name: 'Plates required on one side. One side: no plates',
      }),
    ).toBeInTheDocument()
    expect(container.querySelector('[data-barbell-part="shaft"]')).not.toBeNull()
    expect(container.querySelector('[data-barbell-part="collar"]')).not.toBeNull()
    expect(container.querySelector('[data-barbell-part="sleeve"]')).not.toBeNull()
    expect(visualPlates(container)).toHaveLength(0)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('S4-AC-002 preserves read-only input order and exposes a text summary', () => {
    const plates = Object.freeze([45, 10, 5] as const)
    const { container } = render(
      <Barbell
        mode="readonly"
        plates={plates}
        accessibleLabel="Plates required on one side"
      />,
    )

    expect(
      screen.getByRole('img', {
        name: 'Plates required on one side. One side: 45 lb, 10 lb, 5 lb',
      }),
    ).toBeInTheDocument()
    expect(
      visualPlates(container).map((plate) => plate.dataset.plateWeight),
    ).toEqual(['45', '10', '5'])
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(plates).toEqual([45, 10, 5])
  })

  it('S4-AC-006 renders removable native controls and reports exact index and weight', async () => {
    const user = userEvent.setup()
    const onRemovePlate = vi.fn()
    render(
      <Barbell
        mode="removable"
        plates={[45, 25, 10]}
        accessibleLabel="Plates on one side"
        onRemovePlate={onRemovePlate}
      />,
    )

    expect(screen.getByRole('group', { name: 'Plates on one side' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove 25 lb plate' }))

    expect(onRemovePlate).toHaveBeenCalledOnce()
    expect(onRemovePlate).toHaveBeenCalledWith(1, 25)
  })

  it('S4-AC-009 keeps duplicate denominations as separate controls', () => {
    render(
      <Barbell
        mode="removable"
        plates={[45, 45]}
        accessibleLabel="Plates on one side"
        onRemovePlate={() => undefined}
      />,
    )

    expect(
      screen.getAllByRole('button', { name: 'Remove 45 lb plate' }),
    ).toHaveLength(2)
  })

  it('S4-AC-010 applies every required color and strictly descending height', () => {
    const { container } = render(
      <Barbell
        mode="readonly"
        plates={PLATE_WEIGHTS}
        accessibleLabel="All plates"
      />,
    )
    const rendered = visualPlates(container)

    expect(rendered.map((plate) => plate.dataset.plateWeight)).toEqual(
      PLATE_WEIGHTS.map(String),
    )
    expect(rendered.map((plate) => plate.dataset.plateColor)).toEqual(
      PLATE_DEFINITIONS.map(({ color }) => color),
    )

    rendered.forEach((plate, index) => {
      const definition = PLATE_DEFINITIONS[index]
      const tokens = PLATE_COLOR_TOKENS[definition.color]
      expect(plate).toHaveTextContent(`${definition.weight} lb`)
      expect(plate.style.getPropertyValue('--plate-background')).toBe(
        tokens.background,
      )
      expect(plate.style.getPropertyValue('--plate-label-color')).toBe(
        tokens.label,
      )
      expect(plate.style.getPropertyValue('--plate-height')).toBe(
        `${PLATE_HEIGHTS[definition.weight]}px`,
      )
    })

    const heights = PLATE_WEIGHTS.map((weight) => PLATE_HEIGHTS[weight])
    for (let index = 1; index < heights.length; index += 1) {
      expect(heights[index - 1]).toBeGreaterThan(heights[index])
    }
  })

  it('S4-AC-010 keeps every specified label contrast above 4.5 to 1', () => {
    for (const { color } of PLATE_DEFINITIONS) {
      const token = PLATE_COLOR_TOKENS[color]
      expect(contrastRatio(token.background, token.label)).toBeGreaterThanOrEqual(
        4.5,
      )
    }
  })

  it('does not introduce a competing live region', () => {
    const { container } = render(
      <Barbell
        mode="readonly"
        plates={[45]}
        accessibleLabel="Plates required on one side"
      />,
    )

    expect(container.querySelector('[aria-live]')).toBeNull()
  })

  it('focuses and reveals a requested removable plate using only internal scroll', () => {
    const ref = createRef<BarbellHandle>()
    const { container } = render(
      <Barbell
        ref={ref}
        mode="removable"
        plates={[45, 25]}
        accessibleLabel="Plates on one side"
        onRemovePlate={() => undefined}
      />,
    )
    const viewport = container.querySelector<HTMLElement>(
      '[data-barbell-viewport="true"]',
    )
    const plates = visualPlates(container)
    expect(viewport).not.toBeNull()

    viewport!.scrollLeft = 0
    vi.spyOn(viewport!, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 160,
      width: 100,
      height: 160,
      toJSON: () => undefined,
    })
    vi.spyOn(plates[1], 'getBoundingClientRect').mockReturnValue({
      x: 120,
      y: 20,
      top: 20,
      left: 120,
      right: 164,
      bottom: 132,
      width: 44,
      height: 112,
      toJSON: () => undefined,
    })

    act(() => ref.current?.focusPlate(1))

    expect(plates[1]).toHaveFocus()
    expect(viewport!.scrollLeft).toBe(72)
  })

  it('S4-AC-012 exposes a visible hint and keyboard affordance only while overflowing', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
      function clientWidth(this: HTMLElement) {
        return this.dataset.barbellViewport === 'true' ? 100 : 0
      },
    )
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(
      function scrollWidth(this: HTMLElement) {
        return this.dataset.barbellViewport === 'true' ? 500 : 0
      },
    )

    render(
      <Barbell
        mode="readonly"
        plates={Array<PlateWeight>(12).fill(45) as PlateConfiguration}
        accessibleLabel="Many plates"
      />,
    )

    const viewport = screen.getByRole('img', {
      name: /Many plates\. One side:/,
    })
    expect(viewport).toHaveAttribute('data-overflowing', 'true')
    expect(viewport).toHaveAttribute('tabindex', '0')
    expect(screen.getByText('More plates — scroll horizontally')).toBeVisible()
    expect(document.documentElement.style.overflowX).toBe('')
  })
})
