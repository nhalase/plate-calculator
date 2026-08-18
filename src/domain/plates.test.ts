import { describe, expect, it } from 'vitest'

import {
  BAR_WEIGHT,
  PLATE_DEFINITIONS,
  PLATE_WEIGHTS,
  getPlateDefinition,
} from './plates'

describe('Slice 004 plate definitions', () => {
  it('S4-AC-010 maps every supported weight to its required color', () => {
    expect(PLATE_DEFINITIONS).toEqual([
      { weight: 45, color: 'red' },
      { weight: 35, color: 'blue' },
      { weight: 25, color: 'yellow' },
      { weight: 10, color: 'green' },
      { weight: 5, color: 'black' },
      { weight: 2.5, color: 'gray' },
    ])
    expect(PLATE_DEFINITIONS.map(({ weight }) => weight)).toEqual(
      PLATE_WEIGHTS,
    )
  })

  it('freezes the collection and every shared definition', () => {
    expect(Object.isFrozen(PLATE_DEFINITIONS)).toBe(true)
    for (const definition of PLATE_DEFINITIONS) {
      expect(Object.isFrozen(definition)).toBe(true)
    }
  })

  it('returns the shared frozen definition for every supported weight', () => {
    for (const definition of PLATE_DEFINITIONS) {
      expect(getPlateDefinition(definition.weight)).toBe(definition)
    }
  })

  it('preserves the established fixed bar and denomination constants', () => {
    expect(BAR_WEIGHT).toBe(45)
    expect(PLATE_WEIGHTS).toEqual([45, 35, 25, 10, 5, 2.5])
    expect(Object.isFrozen(PLATE_WEIGHTS)).toBe(true)
  })
})
