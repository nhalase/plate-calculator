export const BAR_WEIGHT = 45 as const

export const PLATE_WEIGHTS = Object.freeze(
  [45, 35, 25, 10, 5, 2.5] as const,
)

export type PlateWeight = (typeof PLATE_WEIGHTS)[number]

export type PlateConfiguration = readonly PlateWeight[]

export type PlateColor =
  | 'red'
  | 'blue'
  | 'yellow'
  | 'green'
  | 'black'
  | 'gray'

export interface PlateDefinition {
  readonly weight: PlateWeight
  readonly color: PlateColor
}

export const PLATE_DEFINITIONS = Object.freeze([
  Object.freeze({ weight: 45, color: 'red' }),
  Object.freeze({ weight: 35, color: 'blue' }),
  Object.freeze({ weight: 25, color: 'yellow' }),
  Object.freeze({ weight: 10, color: 'green' }),
  Object.freeze({ weight: 5, color: 'black' }),
  Object.freeze({ weight: 2.5, color: 'gray' }),
] satisfies readonly PlateDefinition[])

export function getPlateDefinition(weight: PlateWeight): PlateDefinition {
  const definition = PLATE_DEFINITIONS.find(
    (candidate) => candidate.weight === weight,
  )

  if (!definition) {
    throw new RangeError(`Unsupported plate weight: ${weight}`)
  }

  return definition
}
