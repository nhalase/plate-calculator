import { useLayoutEffect, useRef, useState, type MouseEvent } from 'react'

import {
  calculateDefaultPlates,
  calculateTotalWeight,
  sortPlates,
} from '../domain/calculations'
import {
  PLATE_WEIGHTS,
  type PlateConfiguration,
  type PlateWeight,
} from '../domain/plates'
import { Barbell, type BarbellHandle } from './Barbell'

type PendingAction =
  | { kind: 'remove'; index: number }
  | { kind: 'add'; weight: PlateWeight }
  | { kind: 'reveal'; index: number }
  | null

const EMPTY_CONFIGURATION = Object.freeze([]) as PlateConfiguration
const RESET_ACTIVATION_WINDOW_MS = 500

export interface PlateCalculatorProps {
  active?: boolean
}

function configurationsMatch(
  left: PlateConfiguration,
  right: PlateConfiguration,
): boolean {
  return (
    left.length === right.length &&
    left.every((plate, index) => plate === right[index])
  )
}

export function PlateCalculator({ active = true }: PlateCalculatorProps) {
  const [selectedPlates, setSelectedPlates] =
    useState<PlateConfiguration>(EMPTY_CONFIGURATION)
  const addButtonRefs = useRef(new Map<PlateWeight, HTMLButtonElement>())
  const barbellRef = useRef<BarbellHandle>(null)
  const pendingAction = useRef<PendingAction>(null)
  const pendingResetActivation = useRef<number | null>(null)

  const total = calculateTotalWeight(selectedPlates)
  const greedyPlates = calculateDefaultPlates(total)
  const optimizationAvailable = !configurationsMatch(
    selectedPlates,
    greedyPlates,
  )

  useLayoutEffect(() => {
    const target = pendingAction.current
    pendingAction.current = null

    if (target?.kind === 'remove') {
      barbellRef.current?.focusPlate(target.index)
    }

    if (target?.kind === 'add') {
      addButtonRefs.current.get(target.weight)?.focus()
    }

    if (target?.kind === 'reveal') {
      barbellRef.current?.revealPlate(target.index)
    }
  }, [selectedPlates])

  useLayoutEffect(() => {
    if (!active) {
      pendingResetActivation.current = null
    }
  }, [active])

  function cancelPendingReset() {
    pendingResetActivation.current = null
  }

  function resetPlates() {
    cancelPendingReset()
    pendingAction.current = null

    if (selectedPlates.length > 0) {
      setSelectedPlates(EMPTY_CONFIGURATION)
    }
  }

  function handleTotalActivation(event: MouseEvent<HTMLButtonElement>) {
    if (event.detail === 0) {
      resetPlates()
      return
    }

    const activatedAt = Date.now()
    const previousActivation = pendingResetActivation.current

    if (
      previousActivation !== null &&
      activatedAt - previousActivation <= RESET_ACTIVATION_WINDOW_MS
    ) {
      resetPlates()
      return
    }

    pendingResetActivation.current = activatedAt
  }

  function addPlate(weight: PlateWeight) {
    cancelPendingReset()
    setSelectedPlates((current) => {
      const next = sortPlates([...current, weight])
      pendingAction.current = {
        kind: 'reveal',
        index: next.lastIndexOf(weight),
      }
      return next
    })
  }

  function removePlate(index: number, weight: PlateWeight) {
    cancelPendingReset()
    setSelectedPlates((current) => {
      const next = sortPlates(
        current.filter((_, candidateIndex) => candidateIndex !== index),
      )

      pendingAction.current =
        next.length === 0
          ? { kind: 'add', weight }
          : { kind: 'remove', index: Math.min(index, next.length - 1) }

      return next
    })
  }

  function optimizePlates() {
    cancelPendingReset()
    pendingAction.current = { kind: 'remove', index: 0 }
    setSelectedPlates(greedyPlates)
  }

  return (
    <section
      className="calculator reverse-calculator"
      aria-labelledby="reverse-heading"
    >
      <section className="total-section">
        <h2 id="reverse-heading">Current total</h2>
        <button
          type="button"
          className="current-total"
          aria-label={`Current total ${total} pounds. Reset plates`}
          onClick={handleTotalActivation}
        >
          {total} <span className="target-unit">lb</span>
        </button>
        <output
          className="visually-hidden"
          aria-label="Current total"
          aria-live="polite"
        >
          {total} lb
        </output>
      </section>

      <section className="plate-control-section" aria-labelledby="add-heading">
        <h2 id="add-heading">Add a plate</h2>
        <div className="add-plate-controls">
          {PLATE_WEIGHTS.map((weight) => (
            <button
              key={weight}
              ref={(element) => {
                if (element) {
                  addButtonRefs.current.set(weight, element)
                } else {
                  addButtonRefs.current.delete(weight)
                }
              }}
              type="button"
              aria-label={`Add ${weight} lb plate`}
              onClick={() => addPlate(weight)}
            >
              {weight} lb
            </button>
          ))}
        </div>
      </section>

      <section
        className="plate-control-section"
        aria-labelledby="selected-heading"
      >
        <h2 id="selected-heading">Plates per side</h2>
        <Barbell
          ref={barbellRef}
          mode="removable"
          plates={selectedPlates}
          accessibleLabel="Plates on one side"
          onRemovePlate={removePlate}
        />
        <div
          className="configuration-action-slot"
          data-configuration-action-slot="true"
        >
          {optimizationAvailable && (
            <button
              className="optimize-button"
              type="button"
              onClick={optimizePlates}
            >
              Optimize
            </button>
          )}
        </div>
      </section>
    </section>
  )
}
