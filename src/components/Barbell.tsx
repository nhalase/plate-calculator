import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

import {
  getPlateDefinition,
  type PlateConfiguration,
  type PlateWeight,
} from '../domain/plates'
import { PLATE_COLOR_TOKENS, PLATE_HEIGHTS } from './plateVisuals'

interface CommonBarbellProps {
  plates: PlateConfiguration
  accessibleLabel: string
}

interface ReadonlyBarbellProps extends CommonBarbellProps {
  mode: 'readonly'
  onRemovePlate?: never
}

interface RemovableBarbellProps extends CommonBarbellProps {
  mode: 'removable'
  onRemovePlate: (index: number, weight: PlateWeight) => void
}

export type BarbellProps = ReadonlyBarbellProps | RemovableBarbellProps

export interface BarbellHandle {
  focusPlate(index: number): void
  revealPlate(index: number): void
  resetScroll(): void
}

type PlateStyle = CSSProperties & {
  '--plate-background': string
  '--plate-label-color': string
  '--plate-height': string
}

export const Barbell = forwardRef<BarbellHandle, BarbellProps>(
  function Barbell({ plates, mode, accessibleLabel, onRemovePlate }, ref) {
    const viewportRef = useRef<HTMLDivElement>(null)
    const plateRefs = useRef<Array<HTMLElement | null>>([])
    const [overflowing, setOverflowing] = useState(false)
    const hintId = useId()

    const measureOverflow = useCallback(() => {
      const viewport = viewportRef.current
      if (!viewport) {
        return
      }

      const nextOverflowing = viewport.scrollWidth > viewport.clientWidth
      setOverflowing((current) =>
        current === nextOverflowing ? current : nextOverflowing,
      )
    }, [])

    const revealPlate = useCallback((index: number) => {
      const viewport = viewportRef.current
      const plate = plateRefs.current[index]
      if (!viewport || !plate) {
        return
      }

      const viewportRect = viewport.getBoundingClientRect()
      const plateRect = plate.getBoundingClientRect()
      const inset = 8

      if (plateRect.left < viewportRect.left + inset) {
        viewport.scrollLeft -= viewportRect.left + inset - plateRect.left
      } else if (plateRect.right > viewportRect.right - inset) {
        viewport.scrollLeft += plateRect.right - (viewportRect.right - inset)
      }
    }, [])

    const focusPlate = useCallback(
      (index: number) => {
        const plate = plateRefs.current[index]
        if (!(plate instanceof HTMLButtonElement)) {
          return
        }

        plate.focus({ preventScroll: true })
        revealPlate(index)
      },
      [revealPlate],
    )

    const resetScroll = useCallback(() => {
      if (viewportRef.current) {
        viewportRef.current.scrollLeft = 0
      }
    }, [])

    useImperativeHandle(
      ref,
      () => ({ focusPlate, revealPlate, resetScroll }),
      [focusPlate, resetScroll, revealPlate],
    )

    useLayoutEffect(() => {
      plateRefs.current.length = plates.length
      if (mode === 'readonly') {
        resetScroll()
      }
      measureOverflow()
    }, [measureOverflow, mode, plates, resetScroll])

    useLayoutEffect(() => {
      const viewport = viewportRef.current
      if (!viewport) {
        return
      }

      const resizeObserver =
        typeof ResizeObserver === 'undefined'
          ? null
          : new ResizeObserver(measureOverflow)
      resizeObserver?.observe(viewport)
      window.addEventListener('resize', measureOverflow)

      return () => {
        resizeObserver?.disconnect()
        window.removeEventListener('resize', measureOverflow)
      }
    }, [measureOverflow])

    const summary =
      plates.length === 0
        ? 'One side: no plates'
        : `One side: ${plates.map((weight) => `${weight} lb`).join(', ')}`
    const occurrences = new Map<PlateWeight, number>()

    return (
      <div className="barbell" data-barbell-mode={mode}>
        <div
          ref={viewportRef}
          className="barbell__viewport"
          role={mode === 'readonly' ? 'img' : 'group'}
          aria-label={
            mode === 'readonly'
              ? `${accessibleLabel}. ${summary}`
              : accessibleLabel
          }
          aria-describedby={overflowing ? hintId : undefined}
          data-barbell-viewport="true"
          data-overflowing={overflowing ? 'true' : 'false'}
          tabIndex={mode === 'readonly' && overflowing ? 0 : undefined}
        >
          <div className="barbell__track">
            <span
              className="barbell__shaft"
              data-barbell-part="shaft"
              aria-hidden="true"
            />
            <span
              className="barbell__collar"
              data-barbell-part="collar"
              aria-hidden="true"
            />
            <div className="barbell__plates">
              {plates.map((weight, index) => {
                const definition = getPlateDefinition(weight)
                const colors = PLATE_COLOR_TOKENS[definition.color]
                const occurrence = (occurrences.get(weight) ?? 0) + 1
                occurrences.set(weight, occurrence)
                const style: PlateStyle = {
                  '--plate-background': colors.background,
                  '--plate-label-color': colors.label,
                  '--plate-height': `${PLATE_HEIGHTS[weight]}px`,
                }
                const commonProps = {
                  className: 'barbell__plate',
                  'data-plate-weight': String(weight),
                  'data-plate-color': definition.color,
                  style,
                }

                if (mode === 'removable') {
                  return (
                    <button
                      {...commonProps}
                      key={`${weight}-${occurrence}`}
                      ref={(element) => {
                        plateRefs.current[index] = element
                      }}
                      type="button"
                      aria-label={`Remove ${weight} lb plate`}
                      onClick={() => onRemovePlate(index, weight)}
                    >
                      <span className="barbell__plate-label" aria-hidden="true">
                        {weight} lb
                      </span>
                    </button>
                  )
                }

                return (
                  <span
                    {...commonProps}
                    key={`${weight}-${occurrence}`}
                    ref={(element) => {
                      plateRefs.current[index] = element
                    }}
                    aria-hidden="true"
                  >
                    <span className="barbell__plate-label">{weight} lb</span>
                  </span>
                )
              })}
            </div>
            <span
              className="barbell__sleeve-end"
              data-barbell-part="sleeve"
              aria-hidden="true"
            />
          </div>
        </div>

        {overflowing && (
          <p id={hintId} className="barbell__overflow-hint">
            More plates — scroll horizontally
          </p>
        )}
      </div>
    )
  },
)
