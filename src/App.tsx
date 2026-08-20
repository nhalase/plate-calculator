import { useState } from 'react'

import {
  ModeSelector,
  type CalculatorMode,
} from './components/ModeSelector'
import { PlateCalculator } from './components/PlateCalculator'
import { TargetCalculator } from './components/TargetCalculator'

export function App() {
  const [mode, setMode] = useState<CalculatorMode>('target-to-plates')

  return (
    <main className="app-shell">
      <header className="app-header">
        <span
          className="brand-mark"
          data-brand-mark="barbell"
          aria-hidden="true"
        >
          <span className="brand-mark__bar" />
        </span>
        <h1>Plate Calculator</h1>
      </header>

      <ModeSelector mode={mode} onModeChange={setMode} />

      <div hidden={mode !== 'target-to-plates'}>
        <TargetCalculator active={mode === 'target-to-plates'} />
      </div>

      <div hidden={mode !== 'plates-to-total'}>
        <PlateCalculator />
      </div>
    </main>
  )
}
