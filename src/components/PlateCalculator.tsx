import { useLayoutEffect, useRef, useState } from 'react'

import {
  calculateTotalWeight,
  sortPlates,
} from '../domain/calculations'
import {
  PLATE_WEIGHTS,
  type PlateConfiguration,
  type PlateWeight,
} from '../domain/plates'

type PendingFocus =
  | { kind: 'remove'; index: number }
  | { kind: 'add'; weight: PlateWeight }
  | null

const EMPTY_CONFIGURATION = Object.freeze([]) as PlateConfiguration

export function PlateCalculator() {
  const [selectedPlates, setSelectedPlates] =
    useState<PlateConfiguration>(EMPTY_CONFIGURATION)
  const addButtonRefs = useRef(new Map<PlateWeight, HTMLButtonElement>())
  const removeButtonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const pendingFocus = useRef<PendingFocus>(null)

  const total = calculateTotalWeight(selectedPlates)

  useLayoutEffect(() => {
    const target = pendingFocus.current
    pendingFocus.current = null

    if (target?.kind === 'remove') {
      removeButtonRefs.current[target.index]?.focus()
    }

    if (target?.kind === 'add') {
      addButtonRefs.current.get(target.weight)?.focus()
    }
  }, [selectedPlates])

  function addPlate(weight: PlateWeight) {
    setSelectedPlates((current) => sortPlates([...current, weight]))
  }

  function removePlate(index: number, weight: PlateWeight) {
    setSelectedPlates((current) => {
      const next = sortPlates(
        current.filter((_, candidateIndex) => candidateIndex !== index),
      )

      pendingFocus.current =
        next.length === 0
          ? { kind: 'add', weight }
          : { kind: 'remove', index: Math.min(index, next.length - 1) }

      return next
    })
  }

  const occurrences = new Map<PlateWeight, number>()

  return (
    <section className="calculator reverse-calculator" aria-labelledby="reverse-heading">
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
        {selectedPlates.length === 0 ? (
          <p className="empty-plates">No plates loaded</p>
        ) : (
          <div className="selected-plate-controls">
            {selectedPlates.map((weight, index) => {
              const occurrence = (occurrences.get(weight) ?? 0) + 1
              occurrences.set(weight, occurrence)

              return (
                <button
                  key={`${weight}-${occurrence}`}
                  ref={(element) => {
                    removeButtonRefs.current[index] = element
                  }}
                  type="button"
                  aria-label={`Remove ${weight} lb plate`}
                  onClick={() => removePlate(index, weight)}
                >
                  <span>{weight} lb</span>
                  <span aria-hidden="true">Remove</span>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </section>
  )
}
