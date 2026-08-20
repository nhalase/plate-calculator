# Barbell Plate Calculator — Architecture

## Summary

The application is a fully client-side React Progressive Web App built as static assets. Framework-independent TypeScript modules own the barbell domain and calculation rules. React owns interaction and presentation state. `vite-plugin-pwa` supplies the manifest and service-worker integration. GitHub Pages is the initial hosting target.

The application has no backend, database, authentication, or runtime API dependency.

## Technology stack

- React for the component and UI-state model
- TypeScript for domain and UI code
- Vite for local development and production builds
- Vitest for unit tests
- `vite-plugin-pwa` for manifest generation and service-worker precaching
- Plain application-local CSS for layout and styling
- GitHub Actions for GitHub Pages deployment

No router, global state library, CSS framework, or component library is required for version 1.

## Logical structure

```text
src/
├── domain/
│   ├── plates.ts          fixed bar, denominations, colors, types
│   └── calculations.ts    pure calculation functions
├── components/
│   ├── ModeSelector.tsx
│   ├── Barbell.tsx
│   ├── TargetCalculator.tsx
│   └── PlateCalculator.tsx
├── App.tsx                mode and shared application state
├── main.tsx               browser entry point
└── styles.css             application-local styles
```

Exact UI file boundaries may change during later slices. The domain boundary is required: core calculations must not import React, browser APIs, storage, or PWA modules.

## Domain model

```ts
type PlateWeight = 45 | 35 | 25 | 10 | 5 | 2.5

interface PlateDefinition {
  weight: PlateWeight
  color: 'red' | 'blue' | 'yellow' | 'green' | 'black' | 'gray'
}

type PlateConfiguration = readonly PlateWeight[]
```

Shared constants:

```ts
const BAR_WEIGHT = 45
const PLATE_WEIGHTS = [45, 35, 25, 10, 5, 2.5] as const
```

## Calculation boundary

The domain exposes pure functions equivalent to:

```ts
normalizeTargetWeight(requested: number): number
calculateSideWeight(total: number): number
calculateDefaultPlates(total: number): PlateConfiguration
calculateOptimizedPlates(total: number): PlateConfiguration
hasOptimization(total: number): boolean
calculateTotalWeight(plates: readonly PlateWeight[]): number
sortPlates(plates: readonly PlateWeight[]): PlateConfiguration
```

Functions must not mutate caller-owned arrays. Invalid programmatic inputs should fail explicitly; UI parsing and recovery remain UI responsibilities.

## Algorithms

### Target normalization

Clamp finite values to at least 45, then choose the nearest value in the 5 lb sequence beginning at 45. When exactly halfway, choose the lower value. The implementation should avoid relying on default language rounding because its midpoint behavior does not express this rule directly.

### Default selection

Subtract the bar, divide by two, then greedily take as many plates as possible in descending denomination order. This intentionally makes `45 + 10 + 5` the default for 60 lb per side.

### Optimized selection

Find an exact configuration with the smallest number of plates. Because inventory is unlimited and all denominations are multiples of 2.5 lb, calculations may use integer units of 2.5 lb to avoid floating-point drift. Tie-breaking compares counts from heaviest denomination to lightest and prefers more heavy plates at the first difference.

Target-mode plate reduction is offered only when the minimum-count configuration has fewer plates than the greedy configuration. Its action label is `Reduce plates`.

### Reverse calculation

The total is `45 + 2 × sum(one-side plates)`. Display order is descending denomination order and does not affect the calculation.

Reverse-mode greedy optimization derives the canonical configuration by passing the current total to `calculateDefaultPlates`. The UI compares that frozen domain result with the already-sorted selected plates by denomination and occurrence. It offers `Optimize` only when the arrays differ, and applying it replaces the selected collection without changing the total. This comparison does not duplicate the greedy algorithm.

## React state

Version 1 state can remain local to `App` and the two calculator views:

- selected mode;
- active valid target and optional last requested value;
- whether the default or optimized result is displayed;
- manually selected one-side plates.

Switching modes does not require navigation or URL routing. Each mode should retain its state while the user switches during the current session. Persistent preferences and favorites are deferred and should later sit behind a small storage adapter rather than being embedded in calculation functions.

## Input handling

Direct target entry should use a text-compatible input with `inputmode="decimal"` (and an appropriate numeric pattern where helpful) to request a mobile numeric keypad. The UI parses the string itself, commits valid finite values, and recovers from empty or invalid input by retaining the last valid target.

## Styling and accessibility

Plain CSS owns responsive layout, plate sizing, focus states, and touch-target dimensions. Plate labels must remain legible, and denomination text must accompany color. Native interactive elements are preferred so keyboard and assistive-technology behavior does not require reimplementation.

## PWA and offline boundary

`vite-plugin-pwa` generates the web manifest and service worker. The production build precaches the application shell and every asset required for both calculator modes. Core runtime assets must be local; there are no remote fonts, CDNs, or APIs.

Offline acceptance must be verified against a production build after one successful online load. Update behavior must allow a newly deployed application version to replace an older cached version without leaving incompatible asset combinations.

## GitHub Pages deployment

Vite must be configured for the repository project path rather than assuming `/`. A GitHub Actions workflow builds the production bundle and publishes the static output to GitHub Pages. The calculator has no route-dependent deep links, so a client-side routing fallback is unnecessary.

## Testing strategy

- Vitest unit tests cover every calculation acceptance criterion and edge case.
- UI tests in later slices cover mode controls, direct-entry commit/recovery, add/remove behavior, target-mode Reduce plates visibility, reverse-mode Optimize behavior, focus recovery, and stable action-slot layout.
- Production checks cover build success, GitHub Pages base paths, manifest validity, service-worker registration, installability, and offline reload.
- Test names should include the relevant acceptance-criteria identifiers where practical.

## Architectural decisions

- [ADR-001: Fully client-side application](adr/001-client-side-only.md)
- [ADR-002: React, TypeScript, Vite, Vitest, and plain CSS](adr/002-react-typescript-vite.md)
- [ADR-003: Offline PWA on GitHub Pages](adr/003-pwa-github-pages.md)

