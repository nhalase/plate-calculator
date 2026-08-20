import { useLayoutEffect, useRef, useState } from 'react'

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

function configurationsMatch(
  left: PlateConfiguration,
  right: PlateConfiguration,
): boolean {
  return (
    left.length === right.length &&
    left.every((plate, index) => plate === right[index])
  )
}

export function PlateCalculator() {
  const [selectedPlates, setSelectedPlates] =
    useState<PlateConfiguration>(EMPTY_CONFIGURATION)
  const addButtonRefs = useRef(new Map<PlateWeight, HTMLButtonElement>())
  const barbellRef = useRef<BarbellHandle>(null)
  const pendingAction = useRef<PendingAction>(null)

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

  function addPlate(weight: PlateWeight) {
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
        <output
          className="current-total"
          aria-labelledby="reverse-heading"
          aria-live="polite"
        >
          {total} <span className="target-unit">lb</span>
        </output>
        <p className="symmetry-note">
          Select plates for one side. Matching plates are assumed on the other
          side.
        </p>
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
        <h2 id="selected-heading">Plates on one side</h2>
        {selectedPlates.length === 0 && (
          <p className="empty-plates">No plates loaded</p>
        )}
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
