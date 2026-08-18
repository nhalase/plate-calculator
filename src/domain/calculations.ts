import {
  BAR_WEIGHT,
  PLATE_WEIGHTS,
  type PlateConfiguration,
  type PlateWeight,
} from './plates'

const TOTAL_INCREMENT = 5
const PLATE_UNIT = 2.5

const PLATE_UNITS = PLATE_WEIGHTS.map((weight) => weight / PLATE_UNIT)

type PlateCounts = number[]

function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number`)
  }
}

function assertAchievableTotal(total: number): void {
  assertFiniteNumber(total, 'Total weight')

  if (total < BAR_WEIGHT) {
    throw new RangeError(`Total weight must be at least ${BAR_WEIGHT} lb`)
  }

  const incrementsAboveBar = (total - BAR_WEIGHT) / TOTAL_INCREMENT
  if (!Number.isSafeInteger(incrementsAboveBar)) {
    throw new RangeError(
      `Total weight must be an achievable 5 lb increment beginning at ${BAR_WEIGHT} lb`,
    )
  }
}

function toPlateUnits(weight: number): number {
  const units = weight / PLATE_UNIT
  if (!Number.isSafeInteger(units) || units < 0) {
    throw new RangeError('Weight cannot be represented in 2.5 lb plate units')
  }
  return units
}

function freezeConfiguration(
  plates: PlateWeight[],
): PlateConfiguration {
  return Object.freeze(plates)
}

function countPlates(counts: PlateCounts): number {
  return counts.reduce((total, count) => total + count, 0)
}

function isBetterCounts(
  candidate: PlateCounts,
  current: PlateCounts | undefined,
): boolean {
  if (current === undefined) {
    return true
  }

  const candidateCount = countPlates(candidate)
  const currentCount = countPlates(current)
  if (candidateCount !== currentCount) {
    return candidateCount < currentCount
  }

  for (let index = 0; index < candidate.length; index += 1) {
    if (candidate[index] !== current[index]) {
      return candidate[index] > current[index]
    }
  }

  return false
}

function expandCounts(counts: PlateCounts): PlateConfiguration {
  const plates: PlateWeight[] = []

  counts.forEach((count, index) => {
    for (let occurrence = 0; occurrence < count; occurrence += 1) {
      plates.push(PLATE_WEIGHTS[index])
    }
  })

  return freezeConfiguration(plates)
}

export function normalizeTargetWeight(requested: number): number {
  assertFiniteNumber(requested, 'Requested weight')

  if (requested <= BAR_WEIGHT) {
    return BAR_WEIGHT
  }

  const incrementsAboveBar = (requested - BAR_WEIGHT) / TOTAL_INCREMENT
  const lower = BAR_WEIGHT + Math.floor(incrementsAboveBar) * TOTAL_INCREMENT
  const upper = lower + TOTAL_INCREMENT

  return requested - lower <= upper - requested ? lower : upper
}

export function calculateSideWeight(total: number): number {
  assertAchievableTotal(total)
  return (total - BAR_WEIGHT) / 2
}

export function calculateDefaultPlates(
  total: number,
): PlateConfiguration {
  let remainingUnits = toPlateUnits(calculateSideWeight(total))
  const plates: PlateWeight[] = []

  PLATE_UNITS.forEach((plateUnits, index) => {
    const count = Math.floor(remainingUnits / plateUnits)
    for (let occurrence = 0; occurrence < count; occurrence += 1) {
      plates.push(PLATE_WEIGHTS[index])
    }
    remainingUnits -= count * plateUnits
  })

  if (remainingUnits !== 0) {
    throw new Error('Default plate calculation did not produce an exact load')
  }

  return freezeConfiguration(plates)
}

export function calculateOptimizedPlates(
  total: number,
): PlateConfiguration {
  const targetUnits = toPlateUnits(calculateSideWeight(total))
  const emptyCounts = Array<number>(PLATE_WEIGHTS.length).fill(0)
  const best: Array<PlateCounts | undefined> = Array(targetUnits + 1)
  best[0] = emptyCounts

  for (let amount = 1; amount <= targetUnits; amount += 1) {
    for (let index = 0; index < PLATE_UNITS.length; index += 1) {
      const previousAmount = amount - PLATE_UNITS[index]
      if (previousAmount < 0 || best[previousAmount] === undefined) {
        continue
      }

      const candidate = [...best[previousAmount]]
      candidate[index] += 1

      if (isBetterCounts(candidate, best[amount])) {
        best[amount] = candidate
      }
    }
  }

  const optimized = best[targetUnits]
  if (optimized === undefined) {
    throw new Error('Optimized plate calculation did not produce an exact load')
  }

  return expandCounts(optimized)
}

export function hasOptimization(total: number): boolean {
  return (
    calculateOptimizedPlates(total).length <
    calculateDefaultPlates(total).length
  )
}

export function calculateTotalWeight(
  plates: readonly PlateWeight[],
): number {
  const sideWeight = plates.reduce<number>(
    (total, plate) => total + plate,
    0,
  )
  return BAR_WEIGHT + sideWeight * 2
}

export function sortPlates(
  plates: readonly PlateWeight[],
): PlateConfiguration {
  return freezeConfiguration([...plates].sort((left, right) => right - left))
}

