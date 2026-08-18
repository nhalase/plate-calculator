export const BAR_WEIGHT = 45 as const

export const PLATE_WEIGHTS = Object.freeze(
  [45, 35, 25, 10, 5, 2.5] as const,
)

export type PlateWeight = (typeof PLATE_WEIGHTS)[number]

export type PlateConfiguration = readonly PlateWeight[]

