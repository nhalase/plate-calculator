import { useEffect, useReducer, useRef } from 'react'

import {
  calculateDefaultPlates,
  calculateOptimizedPlates,
  hasOptimization,
  normalizeTargetWeight,
} from '../domain/calculations'
import { BAR_WEIGHT } from '../domain/plates'
import { Barbell } from './Barbell'

const TARGET_STEP = 5
const DECIMAL_INPUT = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/

type ConfigurationMode = 'default' | 'optimized'

interface TargetCalculatorState {
  activeTarget: number
  requestedTarget: number | null
  draftInput: string
  editing: boolean
  configuration: ConfigurationMode
}

type TargetCalculatorAction =
  | { type: 'begin-edit' }
  | { type: 'change-draft'; value: string }
  | { type: 'commit-valid'; requested: number; normalized: number }
  | { type: 'end-invalid' }
  | { type: 'cancel-edit' }
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'optimize' }

const initialState: TargetCalculatorState = {
  activeTarget: BAR_WEIGHT,
  requestedTarget: null,
  draftInput: String(BAR_WEIGHT),
  editing: false,
  configuration: 'default',
}

export interface TargetCalculatorProps {
  active?: boolean
}

function targetCalculatorReducer(
  state: TargetCalculatorState,
  action: TargetCalculatorAction,
): TargetCalculatorState {
  switch (action.type) {
    case 'begin-edit':
      return {
        ...state,
        draftInput: String(state.activeTarget),
        editing: true,
      }

    case 'change-draft':
      return { ...state, draftInput: action.value }

    case 'commit-valid':
      return {
        activeTarget: action.normalized,
        requestedTarget:
          action.requested === action.normalized ? null : action.requested,
        draftInput: String(action.normalized),
        editing: false,
        configuration: 'default',
      }

    case 'end-invalid':
    case 'cancel-edit':
      return {
        ...state,
        draftInput: String(state.activeTarget),
        editing: false,
      }

    case 'increment': {
      const activeTarget = state.activeTarget + TARGET_STEP
      return {
        activeTarget,
        requestedTarget: null,
        draftInput: String(activeTarget),
        editing: false,
        configuration: 'default',
      }
    }

    case 'decrement': {
      const activeTarget = Math.max(
        BAR_WEIGHT,
        state.activeTarget - TARGET_STEP,
      )
      return {
        activeTarget,
        requestedTarget: null,
        draftInput: String(activeTarget),
        editing: false,
        configuration: 'default',
      }
    }

    case 'optimize':
      return { ...state, configuration: 'optimized' }
  }
}

function parseRequestedTarget(draft: string): number | null {
  const trimmed = draft.trim()
  if (!DECIMAL_INPUT.test(trimmed)) {
    return null
  }

  const requested = Number(trimmed)
  return Number.isFinite(requested) ? requested : null
}

export function TargetCalculator({ active = true }: TargetCalculatorProps = {}) {
  const [state, dispatch] = useReducer(targetCalculatorReducer, initialState)
  const inputRef = useRef<HTMLInputElement>(null)
  const editingSessionCompleted = useRef(false)

  useEffect(() => {
    if (!state.editing) {
      return
    }

    editingSessionCompleted.current = false
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [state.editing])

  useEffect(() => {
    if (active || !state.editing) {
      return
    }

    editingSessionCompleted.current = true
    dispatch({ type: 'cancel-edit' })
  }, [active, state.editing])

  const optimizationAvailable = hasOptimization(state.activeTarget)
  const plates =
    state.configuration === 'optimized'
      ? calculateOptimizedPlates(state.activeTarget)
      : calculateDefaultPlates(state.activeTarget)
  const plateText =
    plates.length === 0 ? 'No plates required' : plates.join(' + ')

  function beginEditing() {
    editingSessionCompleted.current = false
    dispatch({ type: 'begin-edit' })
  }

  function commitDraft() {
    if (editingSessionCompleted.current) {
      return
    }

    editingSessionCompleted.current = true
    const requested = parseRequestedTarget(state.draftInput)

    if (requested === null) {
      dispatch({ type: 'end-invalid' })
      return
    }

    dispatch({
      type: 'commit-valid',
      requested,
      normalized: normalizeTargetWeight(requested),
    })
  }

  function cancelEditing(input: HTMLInputElement) {
    editingSessionCompleted.current = true
    dispatch({ type: 'cancel-edit' })
    input.blur()
  }

  return (
    <section className="calculator" aria-labelledby="target-heading">
      <section className="target-section">
        <h2 id="target-heading">Target weight</h2>

        <div className="target-control">
          {state.editing ? (
            <>
              <label className="visually-hidden" htmlFor="target-input">
                Target weight
              </label>
              <input
                ref={inputRef}
                id="target-input"
                className="target-input"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={state.draftInput}
                onChange={(event) =>
                  dispatch({ type: 'change-draft', value: event.target.value })
                }
                onBlur={(event) => {
                  if (editingSessionCompleted.current) {
                    return
                  }

                  if (
                    event.relatedTarget instanceof HTMLElement &&
                    event.relatedTarget.dataset.calculatorMode ===
                      'plates-to-total'
                  ) {
                    editingSessionCompleted.current = true
                    dispatch({ type: 'cancel-edit' })
                    return
                  }

                  commitDraft()
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    commitDraft()
                    event.currentTarget.blur()
                  }

                  if (event.key === 'Escape') {
                    event.preventDefault()
                    cancelEditing(event.currentTarget)
                  }
                }}
              />
              <span className="target-unit">lb</span>
            </>
          ) : (
            <button
              className="target-display"
              type="button"
              aria-label="Edit target weight"
              onClick={beginEditing}
            >
              <span>{state.activeTarget}</span>
              <span className="target-unit">lb</span>
            </button>
          )}
        </div>

        {state.requestedTarget !== null && (
          <p className="rounding-feedback">
            Nearest loadable weight to {state.requestedTarget} lb
          </p>
        )}

        <div className="step-controls" aria-label="Adjust target weight">
          <button
            type="button"
            aria-label="Decrease target by 5 pounds"
            onClick={() => dispatch({ type: 'decrement' })}
          >
            −5
          </button>
          <button
            type="button"
            aria-label="Increase target by 5 pounds"
            onClick={() => dispatch({ type: 'increment' })}
          >
            +5
          </button>
        </div>
      </section>

      <section className="result-section" aria-labelledby="plates-heading">
        <p className="eyebrow">Load both sides equally</p>
        <h2 id="plates-heading">Plates per side</h2>
        <output className="plate-result" aria-live="polite">
          {plateText}
        </output>

        <Barbell
          mode="readonly"
          plates={plates}
          accessibleLabel="Plates required on one side"
        />

        {optimizationAvailable && state.configuration === 'default' && (
          <button
            className="optimize-button"
            type="button"
            onClick={() => dispatch({ type: 'optimize' })}
          >
            Optimize
          </button>
        )}
      </section>
    </section>
  )
}
