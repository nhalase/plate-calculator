import { describe, expect, it } from 'vitest'

import {
  calculateDefaultPlates,
  calculateOptimizedPlates,
  calculateSideWeight,
  calculateTotalWeight,
  hasOptimization,
  normalizeTargetWeight,
  sortPlates,
} from './calculations'
import { BAR_WEIGHT, PLATE_WEIGHTS, type PlateWeight } from './plates'

describe('normalizeTargetWeight', () => {
  it.each([
    [137, 135, 'AC-CALC-001-1'],
    [138, 140, 'AC-CALC-001-2'],
    [137.5, 135, 'AC-CALC-001-3'],
    [142.5, 140, 'AC-CALC-001-4'],
    [42, 45, 'AC-CALC-001-5'],
    [45, 45, 'AC-CALC-001-6'],
    [155, 155, 'AC-CALC-001-6'],
  ])('%s resolves to %s (%s)', (requested, expected) => {
    expect(normalizeTargetWeight(requested)).toBe(expected)
  })

  it.each([
    [47.5, 45],
    [52.5, 50],
  ])('chooses the lower total at the %s midpoint', (requested, expected) => {
    expect(normalizeTargetWeight(requested)).toBe(expected)
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects non-finite input %s (numeric portion of AC-CALC-001-7)',
    (requested) => {
      expect(() => normalizeTargetWeight(requested)).toThrow(TypeError)
    },
  )
})

describe('calculateSideWeight', () => {
  it.each([
    [45, 0, 'AC-CALC-002-1'],
    [135, 45, 'AC-CALC-002-2'],
    [155, 55, 'AC-CALC-002-3'],
    [225, 90, 'AC-CALC-002-4'],
  ])('%s total requires %s per side (%s)', (total, expected) => {
    expect(calculateSideWeight(total)).toBe(expected)
  })

  it.each([40, 46, 137.5])('rejects invalid total %s', (total) => {
    expect(() => calculateSideWeight(total)).toThrow(RangeError)
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects non-finite total %s',
    (total) => {
      expect(() => calculateSideWeight(total)).toThrow(TypeError)
    },
  )
})

describe('calculateDefaultPlates', () => {
  it.each([
    [45, [], 'empty bar'],
    [135, [45], '45 lb side'],
    [155, [45, 10], 'AC-CALC-003-1'],
    [165, [45, 10, 5], 'AC-CALC-003-2'],
    [185, [45, 25], 'AC-CALC-003-3'],
    [205, [45, 35], 'AC-CALC-003-4'],
    [225, [45, 45], 'AC-CALC-003-5'],
  ] as const)('%s returns %j (%s)', (total, expected, _criterion) => {
    expect(calculateDefaultPlates(total)).toEqual(expected)
  })

  it('returns a frozen configuration', () => {
    expect(Object.isFrozen(calculateDefaultPlates(165))).toBe(true)
  })
})

describe('calculateOptimizedPlates and hasOptimization', () => {
  it('uses 35 + 25 instead of greedy 45 + 10 + 5 (AC-CALC-004-1)', () => {
    expect(calculateDefaultPlates(165)).toEqual([45, 10, 5])
    expect(calculateOptimizedPlates(165)).toEqual([35, 25])
  })

  it('reports the 165 lb optimization (AC-CALC-004-2)', () => {
    expect(hasOptimization(165)).toBe(true)
  })

  it('preserves total weight (domain portion of AC-CALC-004-3)', () => {
    const greedy = calculateDefaultPlates(165)
    const optimized = calculateOptimizedPlates(165)

    expect(calculateTotalWeight(optimized)).toBe(calculateTotalWeight(greedy))
  })

  it('does not report an equal-count alternative (AC-CALC-004-4)', () => {
    expect(hasOptimization(145)).toBe(false)
  })

  it('prefers heavier plates for equal minimum counts', () => {
    expect(calculateOptimizedPlates(145)).toEqual([45, 5])
  })

  it('returns optimized plates in descending order (AC-CALC-004-5)', () => {
    expect(calculateOptimizedPlates(165)).toEqual([35, 25])
    expect(Object.isFrozen(calculateOptimizedPlates(165))).toBe(true)
  })
})

describe('calculateTotalWeight', () => {
  it.each([
    [[], 45, 'AC-DOM-001-1 / AC-CALC-006-1'],
    [[45], 135, 'AC-CALC-006-2'],
    [[45, 10], 155, 'AC-CALC-006-3'],
    [[45, 45], 225, 'AC-CALC-006-4'],
    [[45, 35, 2.5], 210, 'AC-CALC-006-5'],
  ] as const)('%j produces %s (%s)', (plates, expected, _criterion) => {
    expect(calculateTotalWeight(plates)).toBe(expected)
  })
})

describe('plate domain and ordering', () => {
  it('exposes only the supported denominations (AC-DOM-002-1)', () => {
    expect(PLATE_WEIGHTS).toEqual([45, 35, 25, 10, 5, 2.5])
    expect(Object.isFrozen(PLATE_WEIGHTS)).toBe(true)
  })

  it('uses a fixed 45 lb bar (AC-DOM-001-2 / AC-DOM-001-3)', () => {
    expect(BAR_WEIGHT).toBe(45)
    expect(calculateTotalWeight([])).toBe(BAR_WEIGHT)
  })

  it('supports repeated plates and unlimited calculation inventory (AC-DOM-002-2 / AC-DOM-002-3)', () => {
    expect(calculateTotalWeight([45, 45, 45])).toBe(315)
  })

  it('sorts descending without mutating its input (ordering portion of AC-UI-004-3)', () => {
    const plates: PlateWeight[] = [10, 45, 5, 25]
    const original = [...plates]
    const sorted = sortPlates(plates)

    expect(sorted).toEqual([45, 25, 10, 5])
    expect(plates).toEqual(original)
    expect(Object.isFrozen(sorted)).toBe(true)
  })

  it('does not mutate inputs while totaling them', () => {
    const plates: PlateWeight[] = [45, 10]
    const original = [...plates]

    calculateTotalWeight(plates)
    expect(plates).toEqual(original)
  })
})

describe('representative exactness', () => {
  it('reconstructs every achievable total from 45 through 1000 (AC-CALC-003-6)', () => {
    for (let total = 45; total <= 1000; total += 5) {
      const greedy = calculateDefaultPlates(total)
      const optimized = calculateOptimizedPlates(total)

      expect(calculateTotalWeight(greedy)).toBe(total)
      expect(calculateTotalWeight(optimized)).toBe(total)
      expect(optimized.length).toBeLessThanOrEqual(greedy.length)
      expect([...greedy]).toEqual([...greedy].sort((left, right) => right - left))
      expect([...optimized]).toEqual(
        [...optimized].sort((left, right) => right - left),
      )
    }
  })
})
