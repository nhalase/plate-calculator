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
        <p className="eyebrow">Strength tools</p>
        <h1>Barbell Plate Calculator</h1>
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
