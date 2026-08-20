import type { PlateColor, PlateWeight } from '../domain/plates'

export interface PlateColorToken {
  readonly background: string
  readonly label: string
}

export const PLATE_COLOR_TOKENS = Object.freeze({
  red: Object.freeze({ background: '#b42318', label: '#ffffff' }),
  blue: Object.freeze({ background: '#175cd3', label: '#ffffff' }),
  yellow: Object.freeze({ background: '#fdb022', label: '#17201c' }),
  green: Object.freeze({ background: '#067647', label: '#ffffff' }),
  black: Object.freeze({ background: '#242426', label: '#ffffff' }),
  gray: Object.freeze({ background: '#8e8e93', label: '#000000' }),
} satisfies Readonly<Record<PlateColor, PlateColorToken>>)

export const PLATE_HEIGHTS = Object.freeze({
  45: 136,
  35: 124,
  25: 112,
  10: 100,
  5: 88,
  2.5: 76,
} satisfies Readonly<Record<PlateWeight, number>>)
