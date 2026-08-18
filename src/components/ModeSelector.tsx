export type CalculatorMode = 'target-to-plates' | 'plates-to-total'

export interface ModeSelectorProps {
  mode: CalculatorMode
  onModeChange: (mode: CalculatorMode) => void
}

const MODE_CHOICES: ReadonlyArray<{
  mode: CalculatorMode
  label: string
}> = [
  { mode: 'target-to-plates', label: 'Target Weight → Plates' },
  { mode: 'plates-to-total', label: 'Plates → Total Weight' },
]

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="mode-selector" role="group" aria-label="Calculator mode">
      {MODE_CHOICES.map((choice) => (
        <button
          key={choice.mode}
          className="mode-selector__choice"
          type="button"
          aria-pressed={mode === choice.mode}
          data-calculator-mode={choice.mode}
          onClick={() => {
            if (choice.mode !== mode) {
              onModeChange(choice.mode)
            }
          }}
        >
          {choice.label}
        </button>
      ))}
    </div>
  )
}
