import { TargetCalculator } from './components/TargetCalculator'

export function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Strength tools</p>
        <h1>Barbell Plate Calculator</h1>
      </header>

      <TargetCalculator />
    </main>
  )
}
