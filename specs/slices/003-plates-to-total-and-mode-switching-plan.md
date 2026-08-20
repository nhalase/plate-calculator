# Slice 003: Plates to Total Weight and Mode Switching — Implementation Plan

## Status

Approved and implemented

## Source specification

[Slice 003: Plates to Total Weight and Mode Switching](003-plates-to-total-and-mode-switching.md)

This plan implements the approved behavioral contract without adding product behavior.

## Scope

Extend the existing React application with a persistent two-choice mode selector and a textual Plates → Total Weight calculator. Preserve the complete Slice 001 calculation boundary and the existing Slice 002 target workflow. Derive and apply reverse-mode greedy optimization through existing Slice 001 functions.

Implement session-only state retention while switching modes. Do not add the shared graphical barbell visualization, plate colors, persistence, routing, PWA support, offline behavior, GitHub Pages configuration, deployment, or any later-slice placeholder.

## Files to modify

### `src/App.tsx`

- Add application-level selected-mode state.
- Render the persistent mode selector after the application heading.
- Keep both calculator components mounted so their session state survives mode switches.
- Hide the inactive panel with the native `hidden` attribute so it is absent visually and from the accessibility tree.
- Pass an active/inactive signal to `TargetCalculator` so switching away cancels an unfinished draft.
- Do not introduce routing, URL state, storage, or a global state library.

### `src/components/TargetCalculator.tsx`

- Add an optional `active` prop whose default is `true`.
- When `active` changes to `false`, cancel editing by restoring `draftInput` from `activeTarget` and setting `editing` to `false`.
- Preserve `activeTarget`, `requestedTarget`, and `configuration` when deactivated.
- Preserve every existing Slice 002 transition and public no-prop rendering behavior.
- Do not move calculation rules or direct-entry parsing into `App`.

### `src/styles.css`

- Add styles for the mode selector and its selected state.
- Add reverse-calculator total, explanation, add-control, and selected-plate layouts.
- Use wrapping grids or flex layouts that remain within 320 CSS pixels.
- Preserve the existing global minimum 44 by 44 CSS-pixel button target and visible focus treatment.
- Use text and borders for meaning; do not introduce denomination colors, graphical plate shapes, or barbell imagery.

## Files to create

```text
src/components/ModeSelector.tsx
src/components/PlateCalculator.tsx
src/components/PlateCalculator.test.tsx
src/App.test.tsx
```

No files under `src/domain/` shall change. No package, lockfile, TypeScript, Vite, Vitest, PWA, or deployment configuration change is expected.

## Exported types and component interfaces

### `src/components/ModeSelector.tsx`

Export:

```ts
export type CalculatorMode =
  | 'target-to-plates'
  | 'plates-to-total'

export interface ModeSelectorProps {
  mode: CalculatorMode
  onModeChange: (mode: CalculatorMode) => void
}

export function ModeSelector(props: ModeSelectorProps): JSX.Element
```

No mode labels or values shall be duplicated outside this component except in tests. Keep its two choices in a private ordered constant if mapping is useful.

### `src/components/PlateCalculator.tsx`

Export:

```ts
export function PlateCalculator(): JSX.Element
```

The reverse calculator owns its selected one-side plate collection. Do not export its reducer, focus bookkeeping, or internal state type unless implementation pressure demonstrates a concrete reusable need.

### `src/components/TargetCalculator.tsx`

Add and export only if useful to callers:

```ts
export interface TargetCalculatorProps {
  active?: boolean
}

export function TargetCalculator(
  props?: TargetCalculatorProps,
): JSX.Element
```

`active` defaults to `true`, so every existing `render(<TargetCalculator />)` test remains valid.

No new domain exports are required. Consume the existing exports:

```ts
BAR_WEIGHT
PLATE_WEIGHTS
PlateConfiguration
PlateWeight
calculateDefaultPlates
calculateTotalWeight
sortPlates
```

## Component boundaries

### `App`

Responsibilities:

- own only the selected `CalculatorMode`;
- render the application heading;
- render `ModeSelector` persistently;
- keep `TargetCalculator` and `PlateCalculator` mounted;
- mark exactly one calculator wrapper as hidden;
- pass `active={mode === 'target-to-plates'}` to `TargetCalculator`.

`App` shall not calculate totals, sort plates, parse targets, or own per-calculator domain state.

### `ModeSelector`

Responsibilities:

- render a native-button group labeled `Calculator mode`;
- render choices in this order:
  1. Target Weight → Plates;
  2. Plates → Total Weight;
- expose selection with `aria-pressed` on each button;
- apply a selected styling hook without relying on styling alone;
- call `onModeChange` with the exact corresponding mode value;
- do nothing else.

Native pressed buttons are selected instead of a custom tab implementation because the slice requires one-action choices but does not require arrow-key tab navigation. This preserves ordinary Tab and activation behavior without reimplementing a tab pattern.

### `TargetCalculator`

Continue owning all Slice 002 state and behavior. The only new responsibility is responding to deactivation by cancelling any unfinished edit.

### `PlateCalculator`

Responsibilities:

- own the selected one-side plate collection;
- derive ordered plates with `sortPlates`;
- derive current total with `calculateTotalWeight`;
- render all add controls from `PLATE_WEIGHTS`;
- render one removal button per selected instance;
- manage deterministic post-removal focus;
- derive the greedy configuration for the current total and expose Optimize only when the manual selection differs;
- replace a non-greedy selection with the greedy configuration while preserving total and focusing the first resulting plate;
- keep a fixed-size configuration-action slot mounted whether or not Optimize is available;
- announce total changes.

Derive `greedyPlates` with `calculateDefaultPlates(total)`. Because both arrays are domain-sorted, availability is a length and element-by-element equality comparison between `selectedPlates` and `greedyPlates`; the UI shall not reproduce the greedy algorithm.

Render one persistent `.configuration-action-slot` after the selected-plate output. Give it a minimum block size equal to the rendered action button while preserving at least the 44 CSS-pixel touch target. When Optimize is unavailable, render no button inside it. When Optimize is activated, replace state with `greedyPlates` and route the existing post-render focus mechanism to graphical plate index 0.

Do not create a generalized plate visualization or shared graphical plate component in this slice.

## Application state and transitions

### App mode state

Initialize:

```ts
const [mode, setMode] = useState<CalculatorMode>('target-to-plates')
```

Mode activation behaves as follows:

| Current mode | Requested mode | Result |
| --- | --- | --- |
| Target | Target | No state change |
| Target | Reverse | Target draft cancels; reverse becomes visible |
| Reverse | Reverse | No state change |
| Reverse | Target | Target becomes visible with committed state intact |

The handler shall avoid unnecessary mode updates when the requested mode already matches the current mode. Native click focus therefore remains on the activated selector button.

### Mounted-but-hidden panels

Render both calculator wrappers on every application render:

```tsx
<section hidden={mode !== 'target-to-plates'}>...</section>
<section hidden={mode !== 'plates-to-total'}>...</section>
```

This preserves each component's local state without speculative state lifting. The HTML `hidden` attribute removes inactive content from layout and the accessibility tree.

Do not simulate hiding with opacity, off-screen positioning, or `aria-hidden` alone.

### Target deactivation

Add an effect keyed by `active`. When `active` is false and editing is true, dispatch the existing cancel transition. The transition shall:

- restore the last committed target string;
- set editing false;
- leave active target unchanged;
- preserve rounding feedback;
- preserve default-versus-optimized selection.

The effect must not commit or normalize the current draft. It is acceptable for cancellation to complete in React's post-render effect phase because the entire target wrapper is already hidden during that phase.

### Reverse calculator state

Use:

```ts
const [selectedPlates, setSelectedPlates] =
  useState<PlateConfiguration>(() => Object.freeze([]))
```

The exact empty initializer may use an immutable typed empty array. Every state update shall create a new collection and shall not mutate the prior state or domain-returned arrays.

Because the reverse component remains mounted across mode switches, no separate caching or state synchronization is needed. A full remount naturally restores the empty state.

## Domain integration

### Add transition

For plate `P`:

```ts
setSelectedPlates((current) => sortPlates([...current, P]))
```

This uses the domain ordering function as the sole ordering rule. The add button remains mounted and focused, so no focus call is necessary after addition.

### Remove transition

Because the stored array is maintained in displayed order, remove the rendered index:

```ts
const next = current.filter((_, candidateIndex) =>
  candidateIndex !== removedIndex,
)

return sortPlates(next)
```

Filtering by index removes exactly one instance, including for duplicates. Calling `sortPlates` after removal keeps the domain function authoritative even though removal cannot otherwise disturb ordering.

### Total derivation

On every render:

```ts
const total = calculateTotalWeight(selectedPlates)
```

Do not maintain a separate total state. This prevents selected plates and the total from diverging.

### Denominations

Map add controls directly from `PLATE_WEIGHTS`. Do not write a second denomination array, accept arbitrary input, or add unsupported choices.

## Reverse-calculator rendering

### Current total

- Render a visible `Current total` label.
- Render the derived value prominently as `{total} lb`.
- Use an `output` element with `aria-live="polite"` or equivalent polite announcement behavior.
- Do not make the value editable.

### One-side explanation

Render concise visible text stating that the selected plates represent one side and matching plates are assumed on the other side.

### Add controls

- Place controls under a visible `Add a plate` heading or group label.
- Render from `PLATE_WEIGHTS` in its existing descending order.
- Give each button visible text such as `45 lb`.
- Give each button an accessible name `Add 45 lb plate`.
- Do not disable or replace a button after activation.

### Empty state

When `selectedPlates.length === 0`, render `No plates loaded` and no removal buttons.

### Removal controls

- Place controls under a visible `Plates on one side` heading.
- Render one native button per ordered array element.
- Use accessible names `Remove {weight} lb plate`.
- Include `{weight} lb` visibly.
- Use a stable-enough key combining weight, occurrence, and rendered index. The key does not create persistent product identity; duplicates remain observably interchangeable.
- Do not aggregate duplicates into counts.

## Deterministic removal focus

Maintain:

- an array of removal-button refs indexed by displayed position;
- a map or record of add-button refs keyed by `PlateWeight`;
- a pending focus target stored in a ref, not React presentation state.

Before updating selected plates, compute the post-removal focus destination:

1. If the resulting array has an item at the removed index, target that removal index.
2. Otherwise, if the resulting array is non-empty, target its final removal index.
3. Otherwise, target the add button for the removed denomination.

After React commits the new removal controls, a layout effect shall consume the pending target and call `focus()` once. Clear the pending target immediately so unrelated renders do not move focus.

Examples:

- Removing index 1 from `45 | 25 | 10` focuses the new index 1, `10`.
- Removing index 2 from `45 | 25 | 10` focuses the new final index 1, `25`.
- Removing the only `10` focuses Add 10 lb plate.

Do not use a timeout for focus recovery.

## Reload behavior

No persistence mechanism will be introduced. A test shall unmount a stateful `App`, render a new `App`, and verify the initial mode and both initial calculators. The implementation itself requires no explicit reload listener or reset code.

## Styling plan

- Place the mode selector between the header and calculator panels.
- Use a two-column grid where space permits and allow safe stacking or wrapping at narrow widths.
- Give selected mode buttons a visible background, border, or inset treatment in addition to `aria-pressed`.
- Use existing neutral and green design tokens; do not map colors to denominations.
- Style the reverse total with hierarchy comparable to the existing target value.
- Lay out six add buttons in a wrapping grid with `minmax(0, 1fr)` tracks.
- Lay out removal buttons with wrapping flex or grid behavior.
- Set `min-width: 0` on nested containers that could otherwise overflow.
- Preserve visible focus outlines and 44-pixel minimum targets.
- Confirm long accessible wording does not need to be visible inside compact buttons; visible denomination plus accessible action text is sufficient.

## Acceptance-test implementation

### Test-file responsibilities

Create `src/components/PlateCalculator.test.tsx` for isolated reverse-calculator behavior and `src/App.test.tsx` for mode integration and state retention.

Use React Testing Library and `user-event`. Interact through roles, accessible names, pressed states, headings, and visible text. Do not inspect component state, reducers, or refs.

### S3-AC-001 — Initial mode

In `App.test.tsx`:

- Assert Target Weight → Plates has `aria-pressed="true"`.
- Assert Plates → Total Weight has `aria-pressed="false"`.
- Assert the Slice 002 target content is accessible.
- Assert reverse headings and add controls are absent from accessible queries.

### S3-AC-002 — Empty reverse calculator

In `App.test.tsx`:

- Activate Plates → Total Weight.
- Assert its pressed state changes immediately.
- Assert current total is 45 lb and `No plates loaded` is visible.
- Assert all six add controls appear in descending DOM order.
- Record and assert `window.location.href` is unchanged.

### S3-AC-003 — Every denomination

In `PlateCalculator.test.tsx`:

- Derive expected controls from `PLATE_WEIGHTS`.
- Activate each once.
- Assert six separate removal controls in descending order.
- Assert no seventh or unsupported add denomination.
- Assert the total is 290 lb.

### S3-AC-004 — Repeated plates

- Activate Add 45 lb plate twice.
- Assert two Remove 45 lb plate buttons.
- Assert total 225 lb.
- Assert the add button remains enabled and focused after both activations.

### S3-AC-005 — Required totals

Use table-driven cases for:

- none → 45;
- `45` → 135;
- `45, 10` → 155;
- `45, 45` → 225;
- `45, 35, 2.5` → 210.

Construct each case through visible add controls and assert the labeled output.

### S3-AC-006 — Display ordering

- Activate add controls in the order 10, 45, 5, 25.
- Query the removal buttons within the selected-plates region.
- Assert their accessible-name order is 45, 25, 10, 5.

### S3-AC-007 — Remove one duplicate

- Add 45 twice and 10 once.
- Assert total 245 lb.
- Activate one Remove 45 lb plate button.
- Assert one 45 and one 10 removal button remain.
- Assert total 155 lb.

### S3-AC-008 — Removal focus

- For `45 | 25 | 10`, focus and activate Remove 25 lb plate; assert Remove 10 lb plate receives focus.
- In a fresh render with only 10 selected, activate Remove 10 lb plate; assert Add 10 lb plate receives focus.
- Add a separate assertion for removing the final array item from a multi-plate collection and focusing the preceding removal control.

### S3-AC-009 — Reverse state retention

In `App.test.tsx`:

- Select reverse mode and add 45 and 10.
- Switch to target mode and back.
- Assert the two removal controls and 155 lb total remain.

### S3-AC-010 — Committed target retention

- In target mode, commit 163 and activate Reduce plates.
- Switch to reverse mode and back.
- Assert active target 165, feedback for 163, and optimized `35 + 25` remain.

### S3-AC-011 — Draft cancellation

- Commit 155.
- Begin editing and replace the draft with 225 without committing.
- Activate reverse mode, then return.
- Assert no target input exists, active target is 155, and the 155 default result remains.

Repeat with an invalid or empty draft if needed to protect the unconditional cancellation rule.

### S3-AC-012 — Current-mode no-op

- Build non-initial state in each mode.
- Activate that mode's already-pressed selector button.
- Assert state is unchanged and the mode button retains focus.

### S3-AC-013 — Mobile and keyboard usability

- Assert the mode selector, add controls, and removal controls use native buttons.
- Assert selected mode state and all action names are programmatically exposed.
- Assert the inactive panel is hidden from accessible queries.
- Cover dynamic focus recovery through the S3-AC-008 component tests.
- Complete target-size, wrapping, focus-visibility, hover-independence, and horizontal-overflow checks through the focused 320 CSS-pixel browser verification.

### S3-AC-014 — Reload boundary

- Build non-initial state in both calculators.
- Unmount the application and render a fresh `App`.
- Assert target mode is selected, the target is 45, and reverse mode later opens empty at 45 lb.

### S3-AC-015 — Reverse greedy optimization

- Add 35 and 25; assert total 165 and visible Optimize.
- Capture the persistent action-slot element before activation.
- Activate Optimize and assert graphical plates `45 | 10 | 5`, unchanged 165 total, absent Optimize, focus on Remove 45 lb plate, and the same action-slot element still mounted.
- Build `45 | 10 | 5` manually and assert Optimize never appears.
- Add or remove a plate to make a configuration non-greedy and assert Optimize appears inside the reserved slot without changing the slot's structural position.

### Cross-cutting regression assertions

- Keep all existing `TargetCalculator.test.tsx` cases unchanged.
- Assert only the active panel is accessible.
- Assert there are no Calculate, Apply, Submit, Clear, Reset, bar-setting, persistence, visualization, or deployment controls.
- Keep all Slice 001 tests unchanged.

## Manual browser verification

Run the production-equivalent UI locally and inspect both modes at a 320 CSS-pixel viewport:

1. Confirm the mode selector and both panels fit without horizontal scrolling.
2. Confirm all mode, add, and removal controls measure at least 44 by 44 CSS pixels.
3. Complete mode switching using keyboard only and confirm visible focus.
4. Add every denomination and repeated plates; confirm wrapping and readable labels.
5. Remove a middle, final, and sole selected plate; confirm focus follows the contract.
6. Begin a target edit, switch away, and confirm returning shows the committed value rather than the draft.
7. Confirm each mode's committed state survives repeated switching.
8. Confirm no behavior depends on hover.
9. Add 35 and 25, measure the selected-plates section and action slot, activate Optimize, and confirm the total and surrounding element positions do not change.

Record the result in the implementation handoff. Do not add a visual-regression framework in this slice.

## Verification commands

Install is not expected because no dependencies change. Run:

```text
pnpm run typecheck
pnpm test
pnpm run build
```

Then inspect the production bundle and preview to confirm:

- no manifest or service worker was introduced;
- no remote font, API, backend, storage, router, or deployment configuration was introduced;
- switching, adding, and removing perform no network requests;
- inactive panel content is absent from accessible browser queries;
- the production preview satisfies the manual browser checklist.

## Implementation order

1. Create `ModeSelector` with typed controlled props and pressed-button semantics.
2. Update `App` to own mode state and render both hidden/visible calculator wrappers.
3. Add the optional `active` contract and deactivation cancellation to `TargetCalculator`.
4. Add App integration tests for initial mode, switching, target retention, draft cancellation, no-op behavior, and reload reset.
5. Create `PlateCalculator` with denomination-driven add controls, domain-derived ordering, and domain-derived total.
6. Implement index-based removal, reverse greedy optimization, and deterministic ref-driven focus recovery.
7. Add isolated reverse-calculator acceptance tests, including S3-AC-015.
8. Extend plain CSS for selector, reverse layouts, and the persistent action slot.
9. Run type checking and the complete test suite.
10. Build and inspect the production output.
11. Perform the focused 320 CSS-pixel browser and keyboard verification.

## Risks and controls

- **Slice 002 regression:** default `active` to true and leave existing target transitions intact; require the existing test file to pass unchanged.
- **Hidden content remains accessible:** use the native `hidden` attribute on wrappers and verify with accessible queries.
- **Draft accidentally commits on mode switch:** dispatch cancellation only; never blur as the switching mechanism or invoke the commit function.
- **State resets on switching:** keep both calculators mounted and test round-trip retention for each mode.
- **Duplicate removal deletes too much:** remove by rendered index, not by weight, and test duplicate counts.
- **UI duplicates domain rules:** map denominations from `PLATE_WEIGHTS`, order through `sortPlates`, derive totals through `calculateTotalWeight`, and derive the reverse canonical configuration through `calculateDefaultPlates`.
- **Derived total drifts from selection:** calculate total during render rather than storing it independently.
- **Dynamic removal loses focus:** compute the destination before state update and focus through refs in a layout effect.
- **Unstable duplicate keys:** use deterministic rendered-position keys only for rendering; do not invent product identity or expose it as state.
- **Mobile overflow:** use `minmax(0, 1fr)`, wrapping containers, `min-width: 0`, and a measured 320-pixel check.
- **Scope growth:** reject graphical plates, colors, reset controls, persistence, PWA, routing, deployment, and later-slice abstractions.

## Ambiguities and contradictions

No ambiguity prevents deterministic implementation.

The specification deliberately resolves the potentially ambiguous cases:

- pressed native buttons are used for the two one-action mode choices;
- both panels remain mounted, while `hidden` controls visibility and accessibility;
- unfinished target drafts cancel rather than commit when switching away;
- committed target and reverse states persist only for the mounted application session;
- removal targets a rendered index and removes one duplicate only;
- post-removal focus follows next, previous, then corresponding-add priority;
- graphical portions of AC-CALC-005-3 and AC-UI-004-2 remain deferred and are not claimed complete.

## Plan completeness

The plan is ready for implementation when approved. It changes only Slice 003 behavior, preserves the Slice 001 domain boundary and Slice 002 interaction contract, and introduces no Slice 004 or later functionality.
