export type CalculatorMode = 'target-to-plates' | 'plates-to-total'

export interface ModeSelectorProps {
  mode: CalculatorMode
  onModeChange: (mode: CalculatorMode) => void
}

const MODE_CHOICES: ReadonlyArray<{
  mode: CalculatorMode
  visibleLabel: string
  accessibleLabel: string
}> = [
  {
    mode: 'target-to-plates',
    visibleLabel: 'Target → Plates',
    accessibleLabel: 'Target Weight → Plates',
  },
  {
    mode: 'plates-to-total',
    visibleLabel: 'Plates → Total',
    accessibleLabel: 'Plates → Total Weight',
  },
]

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="mode-selector" role="group" aria-label="Calculator mode">
      {MODE_CHOICES.map((choice) => (
        <button
          key={choice.mode}
          className="mode-selector__choice"
          type="button"
          aria-label={choice.accessibleLabel}
          aria-pressed={mode === choice.mode}
          data-calculator-mode={choice.mode}
          onClick={() => {
            if (choice.mode !== mode) {
              onModeChange(choice.mode)
            }
          }}
        >
          {choice.visibleLabel}
        </button>
      ))}
    </div>
  )
}
