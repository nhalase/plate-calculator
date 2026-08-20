# Slice 004: Shared Barbell Visualization — Implementation Plan

## Status

Approved and implemented

## Source specification

[Slice 004: Shared Barbell Visualization](../slices/004-shared-barbell-visualization.md)

This plan implements the approved behavioral contract without adding product behavior.

## Scope

Add one shared, controlled one-sided barbell visualization to the existing target and reverse calculators. Extend the domain plate metadata with the required color names, keep visual tokens in a presentation-only module, and preserve all Slice 001 through Slice 003 calculations, state transitions, accessibility, and focus behavior.

Do not implement the Slice 005 polish pass, animation, persistence, routing, PWA support, offline behavior, GitHub Pages configuration, deployment, or later-slice placeholders.

## Files to modify

### `src/domain/plates.ts`

- Add the `PlateColor` union.
- Add the `PlateDefinition` interface.
- Add immutable ordered `PLATE_DEFINITIONS` covering exactly `PLATE_WEIGHTS`.
- Add `getPlateDefinition(weight)` so UI code does not reproduce the denomination-to-color mapping.
- Preserve the existing `BAR_WEIGHT`, `PLATE_WEIGHTS`, `PlateWeight`, and `PlateConfiguration` exports and values.
- Freeze both the definition array and each definition object.

### `src/components/TargetCalculator.tsx`

- Render the shared `Barbell` in the existing result section after the textual plate result and before Reduce plates.
- Pass the exact `plates` array already selected for textual output.
- Use read-only mode and an accessible label equivalent to `Plates required on one side`.
- Preserve target parsing, target state, rounding feedback, default/optimized selection, and mode-deactivation behavior unchanged.

### `src/components/PlateCalculator.tsx`

- Replace the text-only selected-plate button grid with the shared removable `Barbell`.
- Preserve `selectedPlates`, domain sorting, domain total derivation, add controls, empty text, and removal-by-index behavior.
- Replace parent-owned removal-button refs with the shared barbell imperative handle.
- Retain add-button refs for the empty-after-removal focus destination.
- Coordinate post-add reveal and post-removal focus without moving add-button focus.
- Preserve every existing accessible removal name.

### `src/components/TargetCalculator.test.tsx`

- Add Slice 004 target integration assertions for empty, default, optimized, and reset configurations.
- Keep every existing Slice 002 assertion passing.

### `src/components/PlateCalculator.test.tsx`

- Extend reverse-calculator assertions to verify graphical metadata, required order, colors, duplicate instances, and graphical removal.
- Preserve every existing Slice 003 total, ordering, and focus assertion.

### `src/App.test.tsx`

- Extend the existing mode-retention test to verify each mode restores its own matching visualization.
- Preserve every existing Slice 003 mode and reload assertion.

### `src/styles.css`

- Add the shaft, collar, sleeve, viewport, plate, label, overflow-hint, and forced-colors rules.
- Replace obsolete text-grid-specific removal styling without changing add controls.
- Use CSS custom properties supplied by the visual-token module for background, label color, and height.
- Keep the visualization width bounded by its calculator panel.
- Preserve existing application layout, focus treatment, and minimum control sizes.

## Files to create

```text
src/domain/plates.test.ts
src/components/plateVisuals.ts
src/components/Barbell.tsx
src/components/Barbell.test.tsx
```

No package, lockfile, TypeScript, Vite, Vitest, PWA, or deployment configuration change is expected.

## Exported domain types, constants, and functions

Add to `src/domain/plates.ts`:

```ts
export type PlateColor =
  | 'red'
  | 'blue'
  | 'yellow'
  | 'green'
  | 'black'
  | 'gray'

export interface PlateDefinition {
  readonly weight: PlateWeight
  readonly color: PlateColor
}

export const PLATE_DEFINITIONS: readonly PlateDefinition[]

export function getPlateDefinition(
  weight: PlateWeight,
): PlateDefinition
```

Implementation rules:

- Keep `PLATE_WEIGHTS` as the established denomination tuple so its inferred `PlateWeight` union and existing imports do not change.
- Construct `PLATE_DEFINITIONS` explicitly in `PLATE_WEIGHTS` order.
- Freeze each entry before freezing the containing array.
- `getPlateDefinition` shall return the matching shared frozen entry.
- A missing definition is a programming error; the exhaustive data and `PlateWeight` input make user-facing recovery unnecessary.
- Do not place CSS values or plate heights in the domain module.

## Exported presentation tokens

Create `src/components/plateVisuals.ts` and export:

```ts
export interface PlateColorToken {
  readonly background: string
  readonly label: string
}

export const PLATE_COLOR_TOKENS:
  Readonly<Record<PlateColor, PlateColorToken>>

export const PLATE_HEIGHTS:
  Readonly<Record<PlateWeight, number>>
```

Use exactly the Slice 004 values:

```text
red:    #b42318 / #ffffff
blue:   #175cd3 / #ffffff
yellow: #fdb022 / #17201c
green:  #067647 / #ffffff
black:  #1f2937 / #ffffff
gray:   #98a2b3 / #17201c

45: 136
35: 124
25: 112
10: 100
5: 88
2.5: 76
```

Freeze nested color-token objects and both exported records. The module is presentation-only and shall not import calculations or React.

`Barbell` shall combine the domain definition and presentation records. No calculator component shall select colors or heights.

## Shared component API

Create `src/components/Barbell.tsx` with a discriminated prop contract:

```ts
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
  onRemovePlate: (
    index: number,
    weight: PlateWeight,
  ) => void
}

export type BarbellProps =
  | ReadonlyBarbellProps
  | RemovableBarbellProps

export interface BarbellHandle {
  focusPlate(index: number): void
  revealPlate(index: number): void
  resetScroll(): void
}

export const Barbell: React.ForwardRefExoticComponent<...>
```

The exact inferred `forwardRef` type syntax may follow project conventions. The observable prop names and handle responsibilities should remain equivalent.

The discriminated union prevents a removal callback from appearing in read-only mode and requires it in removable mode.

## Barbell component boundary

`Barbell` owns only presentation mechanics:

- plate DOM rendering;
- domain metadata lookup through `getPlateDefinition`;
- visual-token lookup;
- shaft, collar, sleeve, and plate structure;
- its internal horizontal scroll position;
- its own plate-element refs;
- overflow measurement and hint visibility;
- focusing or revealing a requested rendered index.

It shall not own:

- calculator plate state;
- sorting;
- target or total calculations;
- addition or removal decisions;
- mode selection;
- persistence;
- live-total announcements.

## Rendering structure

Render a bounded outer visualization container followed by an optional visible overflow hint.

The viewport contains one unwrapped horizontal track:

```text
viewport
└── track
    ├── shaft
    ├── collar
    ├── plate stack
    │   ├── visual plate 0
    │   ├── visual plate 1
    │   └── ...
    └── sleeve end
```

Implementation requirements:

- Use ordinary HTML and CSS; do not add SVG, canvas, icon, or visualization dependencies.
- Mark shaft, collar, sleeve, and purely decorative plate sub-elements `aria-hidden="true"` where appropriate.
- Apply stable semantic attributes to each plate:

```text
data-plate-weight="45"
data-plate-color="red"
```

- Supply CSS custom properties from `plateVisuals.ts`:

```text
--plate-background
--plate-label-color
--plate-height
```

- Render plate labels from `weight`; do not encode label text in CSS.
- Render plates in the exact incoming array order.
- Use a non-wrapping track and preserve a visible sleeve end after the final plate.

## Read-only accessibility

For `mode="readonly"`:

- expose the visualization as one named image-like object using `role="img"` or an equivalent figure contract;
- generate a concise accessible description from the supplied order:
  - empty: `One side: no plates`;
  - loaded: `One side: 45 lb, 10 lb`;
- combine or associate the caller-provided accessible label with that description;
- render each visual plate as a non-interactive element;
- hide decorative internals from separate accessibility traversal;
- introduce no live region because the existing textual result already announces changes.

The visible numeric labels remain in the DOM even when their decorative descendants are hidden from assistive technology.

## Removable accessibility

For `mode="removable"`:

- expose the visualization as a group named by `accessibleLabel`;
- render every plate instance as a native button;
- preserve accessible names `Remove {weight} lb plate`;
- keep button DOM order identical to `plates` order;
- render duplicate entries as duplicate buttons;
- call `onRemovePlate(index, weight)` with the rendered index;
- do not add a second live region;
- keep the existing `No plates loaded` text in `PlateCalculator` for the empty state.

Do not render a hidden duplicate set of removal buttons.

## Imperative focus and reveal behavior

`Barbell` shall keep refs to rendered removable plate buttons by array index.

### `revealPlate(index)`

- Locate the rendered plate and viewport.
- Compare their bounding rectangles.
- Adjust only `viewport.scrollLeft`, and only enough to place the plate fully inside the viewport's visible horizontal bounds.
- Do not call global `scrollIntoView`, because it may move the document vertically or horizontally.
- Do nothing for a missing index or a plate that is already fully visible.
- Do not move focus.

### `focusPlate(index)`

- Focus the matching removal button with `preventScroll` where supported.
- Immediately apply the same internal reveal calculation.
- Do nothing for a missing index.

### `resetScroll()`

- Set only the visualization viewport's `scrollLeft` to zero.
- Do not affect document scroll.

In read-only target mode, reset internal scroll to zero whenever the supplied configuration changes so the collar and heaviest plate remain the initial view.

## Overflow measurement and affordance

Inside `Barbell`, track whether:

```ts
viewport.scrollWidth > viewport.clientWidth
```

Measure after plate changes and when the viewport resizes. Prefer `ResizeObserver` when available and register a window-resize fallback. Clean up observers and listeners on unmount.

When overflowing:

- keep `overflow-x: auto` on the viewport;
- render visible text equivalent to `More plates — scroll horizontally`;
- make a read-only overflowing viewport keyboard-focusable so keyboard users can scroll it;
- retain focusable removal buttons in removable mode without adding an unnecessary extra tab stop unless the overflow hint itself needs association;
- use an edge fade or equivalent nonessential visual cue in addition to the text hint.

When not overflowing, do not display the hint or add a read-only viewport tab stop.

JSDOM cannot perform real layout. Unit tests shall verify structure and controlled overflow-state behavior using mocked element dimensions; the production browser check shall verify actual widths and scrolling.

## Target-calculator integration

Use the existing derived `plates` variable for both text and visualization:

```tsx
<output>{plateText}</output>
<Barbell
  mode="readonly"
  plates={plates}
  accessibleLabel="Plates required on one side"
/>
```

Do not call `calculateDefaultPlates` or `calculateOptimizedPlates` a second time for the visualization.

Expected transitions:

- 45 displays empty text and empty sleeve.
- 155 displays text `45 + 10` and visual weights `[45, 10]`.
- 165 initially displays `[45, 10, 5]`.
- Reduce plates replaces both outputs with `[35, 25]`.
- Any target change restores both outputs to the new default result.

## Reverse-calculator integration

Keep `selectedPlates` domain-sorted as Slice 003 already requires. Pass it directly:

```tsx
<Barbell
  ref={barbellRef}
  mode="removable"
  plates={selectedPlates}
  accessibleLabel="Plates on one side"
  onRemovePlate={removePlate}
/>
```

### Add coordination

When adding `weight`:

1. create and domain-sort the next array;
2. identify the last index of `weight` in that sorted array so one instance of the newly added denomination is selected deterministically;
3. record a pending reveal index in a ref;
4. commit the next plate state.

After render, call `barbellRef.current?.revealPlate(index)` once and clear the pending value. Do not focus the plate; the add button remains focused.

### Remove coordination

Retain the Slice 003 next/previous/add destination calculation.

- If a removal button remains at the destination index, call `barbellRef.current?.focusPlate(index)` after render.
- If no plates remain, focus the corresponding add button through the existing add ref.
- Remove the now-obsolete parent array of removal-button refs.
- Keep removal by rendered index and pass the removed denomination for the empty-state focus fallback.

The graphical component must not alter total calculation or selected state itself.

## Visual token application

For each plate:

1. obtain `{ weight, color }` from `getPlateDefinition(weight)`;
2. obtain background and label values from `PLATE_COLOR_TOKENS[color]`;
3. obtain height from `PLATE_HEIGHTS[weight]`;
4. pass values as CSS custom properties;
5. expose weight and color data attributes for semantic tests.

Use one generic `.barbell__plate` CSS rule. Do not create six JSX branches or weight-specific component classes.

## CSS implementation

### Viewport and track

- Set every visualization wrapper and ancestor to `min-width: 0` where needed.
- Set viewport width and max-width to 100%.
- Use `overflow-x: auto` and `overflow-y: hidden`.
- Use `overscroll-behavior-inline: contain` where supported.
- Use a single non-wrapping flex track with a minimum height sufficient for the 136 px plate plus focus outline and padding.
- Do not set a track width from JavaScript.

### Bar hardware

- Render the shaft and sleeve as neutral horizontal rectangles centered on one shared axis.
- Render the collar as a neutral vertical rectangle between shaft and plates.
- Keep hardware distinguishable through border or luminance, not through texture assets.
- Preserve a visible sleeve end after the last plate.

### Plates

- Use `height: var(--plate-height)`.
- Use a fixed or minimum 44 px width in removable mode; using the same width in both modes is preferred for structural consistency.
- Set `flex: 0 0 auto` so plates never shrink or wrap.
- Use `background: var(--plate-background)` and `color: var(--plate-label-color)`.
- Center the visible numeric label.
- Retain a border so neighboring duplicate colors remain distinguishable.
- Use a plate-specific `:focus-visible` outline with sufficient separation from every background.

### Overflow affordance

- Keep the textual hint visible only while measured overflow is true.
- Use a subtle edge fade as a secondary cue; do not let it cover controls or labels.
- Ensure the hint does not become a live announcement on every addition.

### Forced colors

Add `@media (forced-colors: active)` rules that:

- preserve a visible border around each plate;
- allow system colors to replace authored backgrounds;
- retain visible label text;
- preserve the native focus outline.

Do not add Slice 005 typography, branding, animation, or decorative treatments.

## Domain and token tests

### `src/domain/plates.test.ts`

Verify:

- `PLATE_DEFINITIONS` contains exactly six entries;
- weights equal `PLATE_WEIGHTS` in the same order;
- mapping is exactly 45/red, 35/blue, 25/yellow, 10/green, 5/black, 2.5/gray;
- the array and every entry are frozen;
- `getPlateDefinition` returns the shared matching entry;
- existing constants remain frozen and unchanged.

### Visual-token assertions

In `Barbell.test.tsx` or a focused token test:

- verify exact color and label hex values;
- verify exact heights;
- verify heights are strictly descending in `PLATE_WEIGHTS` order;
- calculate WCAG relative luminance and contrast in test code;
- assert every background/label pair is at least 4.5:1.

The contrast helper belongs in tests, not production code.

## Barbell component tests

Create `src/components/Barbell.test.tsx` and group tests by Slice 004 criteria.

Tests shall verify:

- empty read-only rendering includes shaft, collar, sleeve, and no plate elements;
- read-only configuration renders one non-button plate per input entry in unchanged order;
- read-only accessible summary includes every weight and handles empty state;
- removable configuration renders one native button per entry with correct names;
- clicking a removable plate reports its exact rendered index and weight;
- duplicate entries remain separate;
- data weight, data color, visible label, custom background, label, and height values match definitions;
- no `aria-live` appears inside the visualization;
- caller input arrays are not mutated;
- focus and reveal methods adjust only internal viewport state;
- a mocked overflow viewport displays the scroll hint and read-only keyboard affordance;
- a non-overflowing viewport hides the hint.

Do not assert decorative pixel layout through JSDOM.

## Acceptance-test implementation

### S4-AC-001 — Empty target barbell

In `TargetCalculator.test.tsx`:

- assert initial text remains `No plates required`;
- assert the named read-only visualization exists;
- assert shaft, collar, and sleeve hooks exist;
- assert no visual plate or removal button exists.

### S4-AC-002 — Default target visualization

- Commit 155 through the existing UI.
- Assert textual result `45 + 10`.
- Assert visual data weights `[45, 10]` in DOM order.
- Assert colors `[red, green]`.
- Assert 45's declared height exceeds 10's.
- Assert neither target plate has a button role.

### S4-AC-003 — Optimized target visualization

- Commit 165 and assert default visual weights `[45, 10, 5]`.
- Activate Reduce plates.
- Assert text `35 + 25`, visual weights `[35, 25]`, colors `[blue, yellow]`, and unchanged target 165.

### S4-AC-004 — Target reset synchronization

- Starting from optimized 165, activate `+5`.
- Assert text and visual weights both equal the Slice 001 default result for 170.
- Assert no stale optimized-only element remains.

### S4-AC-005 — Empty reverse barbell

In `PlateCalculator.test.tsx`:

- assert 45 lb total and `No plates loaded` remain;
- assert empty hardware renders;
- assert no removal button exists.

### S4-AC-006 — Reverse addition synchronization

- Add 45 and 10 through existing controls.
- Assert total 155, graphical button order `[45, 10]`, colors `[red, green]`, and visible labels.
- Assert Add 10 lb plate retains focus.

### S4-AC-007 — Reverse domain ordering

- Add 10, 45, 5, and 25.
- Assert graphical order `[45, 25, 10, 5]` and colors `[red, yellow, green, black]`.

### S4-AC-008 — Graphical removal

- Build `[45, 25, 10]`.
- Activate the graphical 25 button.
- Assert `[45, 10]`, a 50 lb total reduction, and focus on graphical 10.

### S4-AC-009 — Duplicate graphical plates

- Add 45 twice.
- Assert two red 45 removal buttons.
- Remove one and assert exactly one remains.

### S4-AC-010 — Complete mapping

- Render one of every denomination through `Barbell`.
- Assert exact order, color data, height tokens, visible labels, and automated contrast ratios.

### S4-AC-011 — Non-color communication

- Assert all plates contain visible numeric text.
- Assert target retains its textual sequence.
- Assert reverse buttons retain denomination and unit in accessible names.
- Assert forced-colors CSS exists through a source-level or production-style inspection rather than attempting to emulate forced-colors in JSDOM.

### S4-AC-012 — Bounded overflow

- Render twelve removable plate instances and assert none are aggregated or omitted.
- Mock viewport client and scroll widths to exercise overflow-hint state.
- Assert the overflow viewport is a distinct bounded element.
- Complete actual document-width, internal-scroll-width, minimum-size, and reachability assertions in the 320 px browser check.

### S4-AC-013 — Mode retention

In `App.test.tsx`:

- create an optimized target visualization;
- create a non-empty reverse visualization;
- switch modes repeatedly;
- assert each textual and visual configuration returns unchanged.

### S4-AC-014 — Mobile and keyboard usability

- Use component tests for native removal buttons, accessible names, and focus recovery.
- Use production browser verification for measured 44 px targets, visible focus on all six colors, internal-only overflow, automatic reveal, and absence of hover dependence.

### S4-AC-015 — Reverse optimization visualization

- Add 35 and 25 in `PlateCalculator.test.tsx` and assert blue/yellow graphical plates.
- Activate Optimize and assert red 45, green 10, and black 5 graphical plates, unchanged 165 total, and focus on graphical 45.
- Assert the persistent action-slot element remains mounted across the graphical replacement.

### Cross-slice regression assertions

- Keep all existing calculation results unchanged.
- Keep all Slice 002 target-input and Reduce plates tests passing.
- Keep all Slice 003 switching, addition, removal, total, focus, and reload tests passing.
- Assert visualization code introduces no Calculate, Apply, Clear, Reset, persistence, or settings control.

## Manual browser verification

Build and run the production preview. At a 320 CSS-pixel viewport:

1. Inspect the empty target barbell and confirm hardware is recognizable.
2. Set target 155 and confirm red 45 then green 10, correct labels, strict size difference, matching text, and no plate interaction.
3. Set target 165, activate Reduce plates, and confirm the visual changes from 45/10/5 to 35/25 without total change.
4. Open the empty reverse calculator and confirm empty hardware and 45 lb total.
5. Add every denomination and confirm order, colors, sizes, labels, total synchronization, and retained add-button focus.
6. Use keyboard navigation to remove middle, final, and sole plates; confirm focus and internal reveal behavior.
7. Add at least twelve plates and confirm:
   - visualization `scrollWidth` exceeds its `clientWidth`;
   - document `scrollWidth` equals document `clientWidth`;
   - overflow hint is visible;
   - all removal buttons remain at least 44 by 44 CSS pixels;
   - first and last plates can be reached;
   - document scroll position does not change during internal reveal.
8. Confirm focus outlines remain visible on red, blue, yellow, green, black, and gray plates.
9. Switch modes repeatedly and confirm each visualization matches its retained state.
10. In reverse mode, add 35 and 25, activate Optimize, and confirm the visual changes to 45/10/5 without total or surrounding-layout movement.
11. Confirm browser console errors are absent.

Record measured results in the implementation handoff. Do not add a screenshot or visual-regression framework in this slice.

## Verification commands

No dependency installation is expected. Run:

```text
pnpm run typecheck
pnpm test
pnpm run build
```

Then inspect authored source and `dist/` to confirm:

- no manifest or service worker was introduced;
- no remote font, image, API, backend, storage, router, or deployment configuration was introduced;
- no SVG, canvas, visualization package, CSS framework, or component library was introduced;
- the production preview satisfies the complete browser checklist.

## Implementation order

1. Extend `src/domain/plates.ts` with frozen color definitions and lookup.
2. Add domain mapping and immutability tests.
3. Create `plateVisuals.ts` with frozen color and height tokens.
4. Create the controlled `Barbell` component with read-only and removable modes.
5. Implement internal refs, focus/reveal handle, overflow measurement, and affordance.
6. Add focused `Barbell` and token tests.
7. Integrate the same `plates` result into `TargetCalculator` and add target visualization tests.
8. Replace reverse text buttons with removable `Barbell`, preserving domain state, total, and focus logic.
9. Extend reverse and App integration tests.
10. Add plain CSS for hardware, plates, overflow, focus, mobile sizing, and forced colors.
11. Run type checking and the full test suite.
12. Build and inspect production output.
13. Perform focused 320 px visual, overflow, touch-target, keyboard, state-retention, and console verification.

## Risks and controls

- **Visualization becomes a second state source:** pass existing arrays as controlled props and store no plate configuration inside `Barbell`.
- **UI duplicates domain color mapping:** resolve every weight through `getPlateDefinition`; keep only color-name-to-CSS-token mapping in presentation code.
- **Calculations run twice or diverge:** reuse existing target `plates` and reverse `selectedPlates`; do not call calculation functions from `Barbell`.
- **Graphical replacement breaks Slice 003:** preserve exact removal names, one button per instance, index removal, totals, add focus, and post-removal focus tests.
- **Duplicate plates lose identity:** continue treating equal entries as observably interchangeable and remove by rendered index.
- **Imperative API takes ownership of state:** restrict the handle to focus and internal scroll only.
- **Global scroll moves during reveal:** calculate viewport-relative deltas and modify only `viewport.scrollLeft`; prohibit global `scrollIntoView`.
- **Add action steals focus:** reveal the inserted index without calling focus.
- **Overflow measurement loops:** update overflow state only when the boolean changes and clean up observers/listeners.
- **JSDOM gives false layout confidence:** mock layout only for component control flow and require real browser measurements.
- **Color becomes the only cue:** retain visible weights, target text, and reverse accessible action names.
- **Contrast regression:** calculate and assert every token pair at or above 4.5:1.
- **Target visualization is accidentally interactive:** use the discriminated read-only mode and assert absence of button roles.
- **Document overflow:** apply `min-width: 0`, bounded viewport width, nonshrinking internal track, and measured 320 px checks.
- **Scope growth:** reject visual polish, animation, assets, persistence, PWA, deployment, and later-slice abstractions.

## Ambiguities and contradictions

No ambiguity prevents deterministic implementation.

The specification and this plan resolve the important implementation choices:

- domain metadata maps weights to semantic color names, while presentation tokens map color names to CSS values;
- one shared controlled component renders both modes;
- target plates are non-interactive and reverse plates are native removal buttons;
- the old reverse removal grid is replaced, not duplicated;
- the component preserves incoming order and never sorts;
- the heaviest plate is closest to the left-side collar;
- graphical removal retains Slice 003's exact focus-destination priority;
- reverse additions reveal one deterministic instance without moving focus;
- long configurations scroll only inside the visualization and never wrap or aggregate;
- visible overflow text supplements native scrolling;
- exact colors and sizes are functional Slice 004 tokens and may be aesthetically refined only in Slice 005.

## Plan completeness

The plan is ready for implementation when approved. It changes only Slice 004 behavior, completes the previously deferred visualization requirements, preserves every established calculation and interaction contract, and introduces no Slice 005 or later functionality.
