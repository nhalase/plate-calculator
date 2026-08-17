# Barbell Plate Calculator — Requirements

## 1. Domain rules

### REQ-DOM-001 — Fixed bar

The application shall use a fixed 45 lb bar in every calculation.

Acceptance criteria:

- **AC-DOM-001-1:** An empty bar displays 45 lb.
- **AC-DOM-001-2:** The user cannot configure bar weight.
- **AC-DOM-001-3:** Every displayed total includes the bar.

### REQ-DOM-002 — Plates

The application shall support unlimited quantities of 45, 35, 25, 10, 5, and 2.5 lb plates.

Acceptance criteria:

- **AC-DOM-002-1:** No other denomination is selectable.
- **AC-DOM-002-2:** Multiple plates of one denomination are allowed.
- **AC-DOM-002-3:** Inventory never prevents a valid calculation.

### REQ-DOM-003 — Colors

The application shall consistently map 45 to red, 35 to blue, 25 to yellow, 10 to green, 5 to black, and 2.5 to gray.

Acceptance criteria:

- **AC-DOM-003-1:** Each denomination uses its assigned color in both modes.
- **AC-DOM-003-2:** Weight labels remain readable on every plate color.
- **AC-DOM-003-3:** Color is not the only way a denomination is communicated.

## 2. Target Weight → Plates

### REQ-CALC-001 — Resolve target

The application shall resolve a requested target to the nearest achievable total. Achievable totals are 45 lb and every 5 lb increment above it. A midpoint tie resolves downward, and any finite target below 45 resolves to 45.

Acceptance criteria:

- **AC-CALC-001-1:** `137` resolves to `135`.
- **AC-CALC-001-2:** `138` resolves to `140`.
- **AC-CALC-001-3:** `137.5` resolves to `135`.
- **AC-CALC-001-4:** `142.5` resolves to `140`.
- **AC-CALC-001-5:** `42` resolves to `45`.
- **AC-CALC-001-6:** An achievable value remains unchanged.
- **AC-CALC-001-7:** Empty, non-numeric, and non-finite input is rejected without replacing the last valid target.

### REQ-CALC-002 — Derive side weight

For a resolved total `T`, the required load on one side shall be `(T − 45) / 2`.

Acceptance criteria:

- **AC-CALC-002-1:** 45 lb requires 0 lb per side.
- **AC-CALC-002-2:** 135 lb requires 45 lb per side.
- **AC-CALC-002-3:** 155 lb requires 55 lb per side.
- **AC-CALC-002-4:** 225 lb requires 90 lb per side.

### REQ-CALC-003 — Default greedy configuration

The default configuration shall use a greedy, heaviest-first algorithm over `[45, 35, 25, 10, 5, 2.5]`. For each denomination, it shall add as many plates as fit before considering the next denomination. Results shall be ordered heaviest to lightest.

Acceptance criteria:

- **AC-CALC-003-1:** 55 lb per side produces `45 + 10`.
- **AC-CALC-003-2:** 60 lb per side produces `45 + 10 + 5`.
- **AC-CALC-003-3:** 70 lb per side produces `45 + 25`.
- **AC-CALC-003-4:** 80 lb per side produces `45 + 35`.
- **AC-CALC-003-5:** 90 lb per side produces `45 + 45`.
- **AC-CALC-003-6:** The sum of returned plates exactly equals the required side weight.

### REQ-CALC-004 — Optional optimization

The application shall determine a valid configuration with the minimum number of plates. If it uses fewer plates than the default configuration, the UI shall offer an Optimize action. Among equally minimal configurations, it shall prefer heavier plates lexicographically in denomination order.

Acceptance criteria:

- **AC-CALC-004-1:** For 60 lb per side, default is `45 + 10 + 5` and optimized is `35 + 25`.
- **AC-CALC-004-2:** Optimize is available for that 60 lb side load.
- **AC-CALC-004-3:** Selecting Optimize replaces the displayed configuration without changing total weight.
- **AC-CALC-004-4:** Optimize is absent when the default already has the minimum plate count.
- **AC-CALC-004-5:** Optimized results are ordered heaviest to lightest.

## 3. Target input

### REQ-UI-001 — Increment controls

The target view shall provide `−5` and `+5` controls that update the calculation immediately.

Acceptance criteria:

- **AC-UI-001-1:** `+5` increases the active target by 5 lb.
- **AC-UI-001-2:** `−5` decreases it by 5 lb but never below 45 lb.
- **AC-UI-001-3:** No Calculate or Submit action is required.

### REQ-UI-002 — Direct numeric entry

Tapping the displayed target shall activate an input intended to show a decimal numeric keypad on supported mobile browsers. The application shall parse and validate the value itself.

Acceptance criteria:

- **AC-UI-002-1:** The control uses `inputmode="decimal"` or equivalent behavior.
- **AC-UI-002-2:** Decimal values such as `137.5` can be entered.
- **AC-UI-002-3:** The existing value is easy to replace and the input receives focus immediately.
- **AC-UI-002-4:** Committing valid input immediately applies REQ-CALC-001.
- **AC-UI-002-5:** Invalid or empty input leaves the last valid target and calculator usable.
- **AC-UI-002-6:** No separate Calculate button is required.

### REQ-UI-003 — Rounding feedback

When the resolved target differs from the request, the resolved value shall be primary and a secondary message shall identify the requested value or explain that it was adjusted.

## 4. Plates → Total Weight

### REQ-CALC-005 — Manual selection

The plate mode shall let the user add one plate of any supported denomination to the represented side with one action.

Acceptance criteria:

- **AC-CALC-005-1:** Every supported denomination has an add control.
- **AC-CALC-005-2:** Repeated taps add repeated plates.
- **AC-CALC-005-3:** Additions immediately update the total and visualization.

### REQ-CALC-006 — Total calculation

Total loaded weight shall equal `45 + (sum of plates on one side × 2)`.

Acceptance criteria:

- **AC-CALC-006-1:** No plates produces 45 lb.
- **AC-CALC-006-2:** `[45]` produces 135 lb.
- **AC-CALC-006-3:** `[45, 10]` produces 155 lb.
- **AC-CALC-006-4:** `[45, 45]` produces 225 lb.
- **AC-CALC-006-5:** `[45, 35, 2.5]` produces 210 lb.

### REQ-UI-004 — Removal and ordering

A displayed plate shall be removable by tapping it. Selected plates shall always display heaviest to lightest, regardless of insertion order.

Acceptance criteria:

- **AC-UI-004-1:** Tapping a plate removes exactly that one displayed instance without confirmation.
- **AC-UI-004-2:** Removal immediately updates total and visualization.
- **AC-UI-004-3:** Adding `10, 45, 5, 25` displays `45 | 25 | 10 | 5`.

## 5. Shared experience

### REQ-UI-005 — Mode switching

A persistent, one-action control shall switch between Target Weight → Plates and Plates → Total Weight without a reload. The selected mode shall be visually obvious.

### REQ-UI-006 — Visualization

Both modes shall show one side of a simplified barbell. Each plate shall display its weight, use its assigned color, and be visually sized so larger denominations generally appear larger.

### REQ-UI-007 — Current total

Both modes shall prominently display the current total in pounds, consistent with the visualization.

### REQ-UX-001 — Mobile interaction

The primary layout shall target portrait phone screens, avoid horizontal scrolling and hover-only interactions, and provide touch targets suitable for quick one-handed use.

## 6. PWA and deployment

### REQ-PWA-001 — Installability

The application shall provide a valid manifest, application name, icons, and standalone launch behavior where the platform supports PWA installation.

### REQ-PWA-002 — Offline operation

After a successful online load has cached the current application assets, every version 1 calculator behavior shall work without a network connection, including launch, mode switching, target entry, rounding, default and optimized calculations, adding/removing plates, totals, and visualization.

### REQ-PWA-003 — Static hosting

The production application shall be deployable to a GitHub Pages project path as static assets. Core behavior shall not require remotely hosted scripts, styles, fonts, or APIs.

## 7. Non-requirements

Version 1 does not include accounts, synchronization, persistence, favorites, kilograms, configurable equipment, constrained inventory, asymmetric loading, workout features, or a backend.

