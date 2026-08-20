# Slice 002: Target Weight to Plates UI — Implementation Plan

## Status

Approved and implemented

## Source specification

[Slice 002: Target Weight to Plates UI](002-target-to-plates-ui.md)

This plan implements the approved behavioral contract without adding product behavior.

## Scope

Build a minimal React and Vite browser application containing only the Target Weight → Plates workflow. Preserve the Slice 001 domain implementation unchanged and use it as the exclusive source of calculation behavior.

Do not implement the reverse calculator, mode switching, graphical plates, plate colors, persistence, routing, PWA support, offline behavior, GitHub Pages configuration, or deployment.

## Files to modify

### `package.json`

Add:

- runtime dependencies: `react`, `react-dom`;
- development dependencies: `vite`, `@vitejs/plugin-react`, React type declarations, Testing Library, `user-event`, `jest-dom`, and `jsdom`;
- `dev` script for the Vite development server;
- `build` script for the production Vite build.

Preserve the existing `test` and `typecheck` scripts.

### `pnpm-lock.yaml`

Update through pnpm after adding the declared dependencies. Do not hand-edit the lockfile.

### `tsconfig.json`

Extend the existing strict configuration to support:

- the `react-jsx` transform;
- DOM and ES2022 libraries;
- `.tsx` source and test files;
- Vite client types where required.

Keep `strict`, `noEmit`, and bundler-style module resolution enabled.

## Files to create

```text
index.html
vite.config.ts
src/vite-env.d.ts
src/main.tsx
src/App.tsx
src/components/TargetCalculator.tsx
src/components/TargetCalculator.test.tsx
src/test/setup.ts
src/styles.css
```

No file under `src/domain/` should change.

## Tooling configuration

### Vite and Vitest

Use a single `vite.config.ts` to:

- enable the React plugin;
- set the component-test environment to `jsdom`;
- load `src/test/setup.ts` before tests;
- preserve Vite's default root base.

Do not add a PWA plugin, service worker, deployment base path, backend proxy, router, or remote asset configuration.

### Test setup

`src/test/setup.ts` will:

- register `@testing-library/jest-dom/vitest` matchers;
- register Testing Library cleanup after each test if required by the installed versions.

Component tests will use React Testing Library and `user-event` through accessible roles, names, and visible text.

## Application structure

### `index.html`

- Provide the root element.
- Set UTF-8 encoding.
- Set the responsive viewport meta tag.
- Load `src/main.tsx` as the module entry point.

### `src/main.tsx`

- Create the React root.
- Render `App` inside React `StrictMode`.
- Import `src/styles.css`.

### `src/App.tsx`

- Render a `main` landmark.
- Render the Barbell Plate Calculator heading.
- Render exactly one `TargetCalculator`.
- Own no calculation or future mode state.

### `src/components/TargetCalculator.tsx`

Own the Slice 002 UI state and all observable transitions. Import the Slice 001 domain API directly.

Do not create speculative shared components or later-slice placeholders. Small private rendering or parsing helpers may remain in this file unless extraction materially improves clarity.

## Component state design

Use a reducer or equivalent cohesive state update mechanism for:

```ts
interface TargetCalculatorState {
  activeTarget: number
  requestedTarget: number | null
  draftInput: string
  editing: boolean
  configuration: 'default' | 'optimized'
}
```

Initialize `activeTarget` and `draftInput` from the exported `BAR_WEIGHT` constant.

Recommended reducer actions:

```text
BEGIN_EDIT
CHANGE_DRAFT
COMMIT_VALID
END_INVALID
CANCEL_EDIT
INCREMENT
DECREMENT
REDUCE_PLATES
```

Each action will implement one row or closely related rows from the slice's state-transition contract. Reducer tests are not required; acceptance tests exercise transitions through the rendered UI.

Do not store plates or optimization availability in state. Derive them from `activeTarget` and `configuration` on each render.

## Domain integration

Import:

```ts
BAR_WEIGHT
normalizeTargetWeight
calculateDefaultPlates
calculateOptimizedPlates
hasOptimization
```

Use them as follows:

- `BAR_WEIGHT`: initial target and decrement floor;
- `normalizeTargetWeight`: every syntactically valid direct-entry commit;
- `calculateDefaultPlates`: every default result;
- `calculateOptimizedPlates`: the optimized result;
- `hasOptimization`: Reduce plates visibility.

The UI may apply the specified `±5` interaction step. It must not implement side-weight math, target rounding, denomination selection, configuration comparison, or optimization logic.

## Direct-entry implementation

### Starting an edit

Render the active target as a native button named `Edit target weight`. On activation:

1. dispatch `BEGIN_EDIT` to set the draft from the active target;
2. render the controlled input;
3. focus and select it from an effect using an input ref.

The input will be text-compatible, labeled `Target weight`, use `inputMode="decimal"`, and set autocomplete off. Render `lb` adjacent to the input.

### Parsing

Use the exact full-string grammar from the slice:

```regex
^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$
```

The commit handler will trim the draft, test the complete string, convert it with `Number`, and require `Number.isFinite`.

This helper only establishes whether the UI string is a valid request. It must delegate normalization to `normalizeTargetWeight`.

### Valid commit

For a valid request:

1. call `normalizeTargetWeight`;
2. dispatch a single `COMMIT_VALID` action containing both the request and normalized target;
3. let the reducer update active target, feedback, draft, editing state, and default configuration atomically.

### Invalid commit

Dispatch `END_INVALID`. It exits editing and restores the active-target draft while leaving active target, requested target, and configuration unchanged.

### Enter and blur

Both events call the same commit routine. Use a ref scoped to the editing session to mark completion before Enter causes the input to unmount or blur. The blur handler returns without committing when the session is already complete.

Reset this guard in `BEGIN_EDIT`. This satisfies the single-commit guarantee without exposing the mechanism in the UI.

### Escape

Mark the session complete, dispatch `CANCEL_EDIT`, and move focus away only if necessary. The cancellation restores the active-target draft and preserves active target, feedback, and configuration. A following blur observes the completion guard and does nothing.

## Increment and decrement implementation

Render native buttons with:

- visible label `−5` and accessible name `Decrease target by 5 pounds`;
- visible label `+5` and accessible name `Increase target by 5 pounds`.

The actions atomically:

- calculate the next target using the fixed 5 lb step and `BAR_WEIGHT` floor;
- clear requested-target feedback;
- exit editing if the event can occur while editing;
- reset configuration to default;
- reset the draft to the resulting target.

No Apply, Calculate, or Submit control will be rendered.

## Result rendering

Render sections in the sequence required by the slice.

### Target

- Display the active target prominently with `lb`.
- Swap the edit button for the controlled input during editing.
- When `requestedTarget` is non-null, render secondary text equivalent to `Nearest loadable weight to {requestedTarget} lb`.

### Plates per side

Derive:

```ts
const optimizationAvailable = hasOptimization(activeTarget)
const plates = configuration === 'optimized'
  ? calculateOptimizedPlates(activeTarget)
  : calculateDefaultPlates(activeTarget)
```

- Render `No plates required` for an empty configuration.
- Otherwise join the domain result with ` + `.
- Render no duplicate opposite-side list.
- Render no graphical plate, color, icon, or size treatment.

### Reduce plates

Render a persistent, button-sized action slot. Render a native `Reduce plates` button inside it only when optimization is available and default configuration is active. Keep the slot's position and dimensions stable after the button disappears, without leaving an unavailable button in the accessibility tree.

Dispatching `REDUCE_PLATES` changes only configuration. The next successful target change resets configuration to default through its own atomic transition.

## Styling plan

Use only `src/styles.css` and system fonts.

- Apply global border-box sizing and remove default body margin.
- Use a single centered column with a fluid width constrained by the viewport.
- Avoid fixed widths wider than the viewport.
- Lay out `−5` and `+5` in a two-column control row that can fit at 320 CSS pixels.
- Set primary controls to at least 44 by 44 CSS pixels.
- Allow target and result text to wrap safely.
- Provide clear `:focus-visible` outlines that are not clipped.
- Use typography and spacing for hierarchy, without relying on plate colors.
- Add no remote fonts, images, stylesheets, or scripts.

## Acceptance-test implementation

Create `src/components/TargetCalculator.test.tsx` and group tests by slice acceptance scenario.

### S2-AC-001 — Initial empty bar

- Assert 45 lb is the primary target.
- Assert `No plates required`.
- Assert Reduce plates is absent.
- Assert no bar-weight configuration input exists.

### S2-AC-002 and S2-AC-003 — Increment/decrement

- Activate `+5` and assert immediate target/result change without a Calculate control.
- Verify `−5` above 45.
- Verify the 45 lb floor.
- Verify both controls clear existing feedback and restore default mode.

### S2-AC-004 — Begin editing

- Activate `Edit target weight`.
- Assert the `Target weight` input is focused.
- Assert its value matches the active target.
- Assert `inputmode="decimal"`.
- Assert selection where jsdom exposes selection positions.

### S2-AC-005 through S2-AC-007 — Valid commits

- Commit 155 and verify `45 + 10` without feedback.
- Commit 137.5 and verify 135 plus request feedback.
- Commit 138 and verify 140 plus request feedback.
- Cover both Enter and blur paths.

### S2-AC-008 — Invalid recovery

Table-test empty, whitespace-only, `.`, sign-only, repeated-decimal, trailing-unit, trailing-text, scientific, hexadecimal, `NaN`, and `Infinity` drafts.

For each, verify that target, feedback, and default/optimized result are preserved and editing exits.

Also verify below-bar finite input is valid and resolves to 45.

### S2-AC-009 — Escape

- Start from a state with feedback and optimized output.
- Edit the draft and press Escape.
- Assert target, feedback, and optimized output remain.
- Trigger or observe blur and assert no second transition.

### S2-AC-010 and S2-AC-011 — Plate reduction

- At 165, assert default `45 + 10 + 5` and visible Reduce plates.
- Activate Reduce plates and assert `35 + 25`, unchanged total, hidden Reduce plates, and the same persistent action-slot element.
- At a target with an already-minimal greedy result, assert Reduce plates is absent while the non-interactive slot remains.

### S2-AC-012 — Reset after target change

- Reduce plates at 165.
- Activate `+5`.
- Assert 170 and its default greedy result.

### S2-AC-013 — Preserve feedback

- Commit 163 to resolve to 165 with feedback.
- Activate Reduce plates.
- Assert 165, `35 + 25`, and the 163 lb feedback remain.

### Cross-cutting assertions

- Verify target and result correspondence for representative totals.
- Verify no Calculate, Apply, mode-switching, reverse-calculator, or bar-setting controls exist.
- Leave `src/domain/calculations.test.ts` unchanged and run it in the same suite.

S2-AC-014 receives automated structural assertions for labels and control classes where stable, plus the manual check below.

## Manual browser verification

Run the production-equivalent UI locally and inspect at a 320 CSS-pixel viewport:

1. Confirm no horizontal scrolling.
2. Confirm target display and input remain usable.
3. Confirm `−5` and `+5` do not overlap.
4. Confirm long plate output wraps.
5. Confirm primary controls are at least 44 by 44 CSS pixels.
6. Complete the workflow using keyboard only.
7. Confirm focus indicators remain visible and unclipped.

Record the result in the implementation handoff. Do not add a visual-regression framework in this slice.

## Verification commands

Run:

```text
pnpm run typecheck
pnpm test
pnpm run build
git diff --check
```

Then inspect `dist/` to confirm no manifest, service worker, remote font, backend configuration, or deployment-specific base path was introduced.

## Implementation order

1. Update package and TypeScript configuration.
2. Add Vite/Vitest configuration and the browser entry points.
3. Add the static `App` and initial `TargetCalculator` structure.
4. Implement the cohesive state transitions.
5. Wire direct-entry parsing and lifecycle behavior.
6. Integrate the Slice 001 default and optimized results.
7. Add accessible labels and mobile-first CSS.
8. Implement tests in acceptance-scenario order.
9. Run type checking, all tests, and the production build.
10. Perform the 320 CSS-pixel and keyboard browser check.
11. Review the diff against Slice 002 non-goals and report acceptance coverage.

## Risks and controls

- **Enter/blur double commit:** use an editing-session completion guard and cover it with a regression test.
- **Derived-state drift:** never store plates or optimization availability independently.
- **Domain duplication:** import Slice 001 functions directly and keep `src/domain/` unchanged.
- **StrictMode focus behavior:** make the focus/select effect idempotent and verify it in component tests.
- **Fragile tests:** query by role, accessible name, and visible result rather than CSS structure or component internals.
- **Scope growth:** reject components or configuration for later modes, visualization, PWA, persistence, or deployment.

## Plan completeness

The expanded slice resolves the earlier behavioral ambiguities. This plan introduces implementation mechanisms only and adds no product decision beyond the approved Slice 002 contract.

