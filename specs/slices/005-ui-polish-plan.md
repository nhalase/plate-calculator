# Slice 005: UI Polish — Implementation Plan

## Status

Approved and implemented

## Source specification

[Slice 005: UI Polish](005-ui-polish.md)

This plan implements the approved Slice 005 visual contract without changing product behavior from Slices 001 through 004.

## Scope

Apply one shared dark visual system to both existing calculator modes. Refine the current header, segmented mode selector, cards, controls, reserved action slots, and shared one-sided barbell. Add a non-interactive fixed-bar notch, left-anchor the bar assembly, split visible plate labels into centered number/unit lines, and retain every existing calculation and interaction boundary.

Do not add a theme switcher, navigation, settings, persistence, PWA behavior, offline support, deployment changes, new calculations, new modes, animation of results, external fonts, icon packages, component libraries, raster assets, SVG, canvas, or later-slice placeholders.

## Package and configuration changes

No package or configuration change is planned.

Do not modify:

- `package.json`;
- `pnpm-lock.yaml`;
- TypeScript configuration;
- Vite configuration;
- Vitest configuration;
- PWA or service-worker configuration;
- GitHub Actions or GitHub Pages configuration.

The existing React, TypeScript, Vite, Vitest, Testing Library, and plain-CSS stack is sufficient.

## Files to modify

### `specs/slices/005-ui-polish.md`

- Set status to `Approved` before implementation begins.
- Do not merge plan content into the slice.
- After implementation and verification, change status to `Approved and implemented`.

### `specs/slices/005-ui-polish-plan.md`

- Keep this implementation plan separate from the behavioral specification.
- After implementation and verification, change status to `Approved and implemented`.

### `src/App.tsx`

- Replace the current `Strength tools` eyebrow and oversized heading with the approved compact brand header.
- Render one decorative CSS logo element followed by a visible `h1` whose exact text is `PLATE CALCULATOR`.
- Mark only the decorative logo `aria-hidden="true"`; keep the wordmark as real heading text.
- Preserve mode state, hidden-panel behavior, calculator mounting, and state retention unchanged.

### `src/components/ModeSelector.tsx`

- Preserve the existing `CalculatorMode`, prop interface, choice order, native buttons, `aria-pressed`, and guarded mode-change callback.
- Separate visible compact labels from full accessible names:
  - visible left label: `Target → Plates`;
  - accessible left name: `Target Weight → Plates`;
  - visible right label: `Plates → Total`;
  - accessible right name: `Plates → Total Weight`.
- Add explicit `aria-label` values so the Slice 003 accessible names and existing behavior remain intact while Slice 005 uses the approved compact visible copy.
- Do not reorder choices when the active mode changes.

### `src/components/Barbell.tsx`

- Add the decorative fixed-bar notch directly before the plate stack.
- Keep the notch outside the plate array and all plate refs.
- Update the visualization summary to identify the fixed 45 lb bar.
- Preserve the existing controlled props, imperative handle, overflow measurement, internal reveal behavior, input order, duplicate handling, and removal-by-index behavior.
- Split every visible plate label into a number line and an uppercase `LB` line.
- Add stable semantic hooks for the notch and label block so component and browser checks can target meaning rather than incidental DOM position.
- Preserve `data-plate-weight` and `data-plate-color`.
- Render no image, SVG, canvas, or duplicated hidden plate list.

### `src/components/plateVisuals.ts`

- Keep the exported `PlateColorToken`, `PLATE_COLOR_TOKENS`, and `PLATE_HEIGHTS` API unchanged.
- Preserve every Slice 004 height.
- Retain established red, blue, yellow, and green fills unless a contrast test requires a small correction.
- Refine the black and gray fills to the approved dark system while retaining semantic names and compliant label contrast.
- Freeze all records and nested token objects as before.

### `src/styles.css`

- Replace the light visual system with the approved dark tokens.
- Add the CSS-rendered brand mark.
- Implement the exact shell, card, typography, segmented-control, control, action, and responsive contracts.
- Refine the barbell track into a left-anchored notch/plates/sleeve visual assembly.
- Center complete label blocks on the sleeve centerline through shared grid or flex rules.
- Remove the current plate-stack background gradient and use a flat bar axis.
- Add reduced-motion, forced-colors, focus-visible, hover-capable, and active states.
- Preserve internal horizontal overflow and document containment.

### `src/App.test.tsx`

- Add brand-header and fixed mode-order assertions.
- Preserve existing full accessible mode names through the explicit labels.
- Keep all mode switching, state retention, direct-entry cancellation, reload-boundary, and visualization-retention tests passing.

### `src/components/Barbell.test.tsx`

- Add fixed-bar notch, fixed-bar summary, flat markup, label structure, DOM order, and non-interaction assertions.
- Update token assertions if final black or gray presentation values change.
- Preserve all existing read-only, removable, duplicate, focus, reveal, overflow, and immutability coverage.

### `src/components/TargetCalculator.test.tsx`

- Preserve every Slice 002 and Slice 004 workflow assertion.
- Add or refine Slice 005 assertions for the target hierarchy's semantic elements and persistent action slot.
- Do not test pixel layout in jsdom.

### `src/components/PlateCalculator.test.tsx`

- Preserve every Slice 003 and Slice 004 workflow assertion.
- Add or refine Slice 005 assertions for add-control order, reverse hierarchy, fixed-bar semantics, Optimize behavior, and persistent action slot.
- Do not duplicate shared `Barbell` structural assertions unnecessarily.

## Files to create

Create four implementation-verification screenshots:

```text
screenshots/slice-005-target-action-visible.png
screenshots/slice-005-target-action-absent.png
screenshots/slice-005-reverse-action-visible.png
screenshots/slice-005-reverse-action-absent.png
```

Each screenshot shall use a 402 by 874 CSS-pixel viewport. They are evidence of the implemented app, not runtime assets and not imported by application code.

No new production TypeScript, CSS, configuration, package, font, icon, or image asset file is expected.

## Exported types, constants, and functions

No new export is required.

Preserve these existing public boundaries unchanged:

```ts
export type CalculatorMode =
  | 'target-to-plates'
  | 'plates-to-total'

export interface ModeSelectorProps {
  mode: CalculatorMode
  onModeChange: (mode: CalculatorMode) => void
}

export interface BarbellHandle {
  focusPlate(index: number): void
  revealPlate(index: number): void
  resetScroll(): void
}

export type BarbellProps =
  | ReadonlyBarbellProps
  | RemovableBarbellProps

export const PLATE_COLOR_TOKENS:
  Readonly<Record<PlateColor, PlateColorToken>>

export const PLATE_HEIGHTS:
  Readonly<Record<PlateWeight, number>>
```

Do not add design tokens to the domain module. Application-level tokens belong in CSS; denomination fill and label pairs remain in the presentation-only `plateVisuals.ts` module because `Barbell` passes them through CSS custom properties.

## Component boundaries

### `App`

`App` continues to own only active calculator mode. Slice 005 adds decorative header markup but no visual state.

### `ModeSelector`

`ModeSelector` continues to own no state. It receives the active mode and emits one mode-change callback. Compact visible copy and full accessible names are static choice metadata, not application state.

### `TargetCalculator`

`TargetCalculator` keeps all established target, draft, feedback, and configuration state. Slice 005 changes presentation only.

### `PlateCalculator`

`PlateCalculator` keeps all established selected-plate and pending-focus state. Slice 005 changes presentation only.

### `Barbell`

`Barbell` remains the only shared rendering boundary for the notch, plates, sleeve, overflow, and internal plate focus/reveal mechanics. The notch is decorative presentation data and must not enter calculator state or `PlateConfiguration`.

No component shall recalculate, sort, normalize, optimize, or persist data for visual purposes.

## Brand-header implementation

Use markup equivalent to:

```tsx
<header className="app-header">
  <span className="app-mark" aria-hidden="true" />
  <h1>PLATE CALCULATOR</h1>
</header>
```

Render the mark with the element and pseudo-elements only:

- the element supplies the horizontal center bar;
- `::before` and `::after` supply symmetric vertical plate groups;
- use solid `currentColor` strokes or rectangles;
- use no textual barbell glyph, emoji, background image, mask URL, SVG, or canvas;
- fix the mark's box at 36 by 28 CSS pixels at the reference viewport;
- set `flex: 0 0 auto` so the wordmark cannot compress it.

The header uses one row, aligns items centrally, and keeps the wordmark on one line at 320 CSS pixels. The h1 remains the only product heading.

## Mode-selector implementation

Change choice metadata to an equivalent shape:

```ts
interface ModeChoice {
  readonly mode: CalculatorMode
  readonly visibleLabel: string
  readonly accessibleLabel: string
}
```

The DOM order remains target then reverse. Each button renders `visibleLabel` and uses `aria-label={accessibleLabel}`.

This resolves the only copy tension between Slice 003 and Slice 005:

- compact visible copy implements the approved visual contract;
- the full legacy accessible names preserve existing tests, semantics, and voice-control discoverability;
- `aria-pressed` remains the selected-state signal.

Do not replace the group with a tablist. No roving tabindex, arrow-key-only navigation, or swipe behavior is introduced.

## CSS token implementation

Define the following shared values in `:root`:

```text
--color-page: #000000
--color-surface: #1c1c1e
--color-control: #2c2c2e
--color-border: #38383a
--color-text: #f5f5f7
--color-text-secondary: #aeaeb2
--color-text-muted: #8e8e93
--color-accent: #0a5fc4
--color-accent-hover: #0c6fdc
--color-accent-active: #084c9e
--color-focus: #64d2ff
--radius-card: 28px
--radius-card-compact: 22px
--space-section: 16px
--action-height: 56px
```

Also set `color-scheme: dark` so native inputs and browser-controlled UI use an appropriate default presentation.

Do not encode domain denomination colors as global application-role tokens. Continue passing them from `plateVisuals.ts` through `--plate-background` and `--plate-label-color`.

Use the final denomination presentation values:

```text
red:    #b42318 / #ffffff
blue:   #175cd3 / #ffffff
yellow: #fdb022 / #17201c
green:  #067647 / #ffffff
black:  #242426 / #ffffff
gray:   #8e8e93 / #000000
```

Retain exact Slice 004 heights:

```text
45: 136px
35: 124px
25: 112px
10: 100px
5: 88px
2.5: 76px
```

The existing contrast test helper shall prove every final plate pair is at least 4.5:1. Add equivalent test-side contrast assertions for ordinary text, secondary text, and white primary-action text against their specified surfaces.

## Shell and responsive CSS

Implement a mobile-first single-column shell:

```text
width: min(100%, 480px)
margin-inline: auto
padding: 20px at 402px
padding: 12px at 320px
```

- Use `min-width: 0` on every grid, flex, card, calculator, and visualization ancestor that could otherwise force overflow.
- Use a 16 px gap between primary cards and mode selector groups.
- Use 24 px card padding and 28 px radii at 402 px.
- At the existing compact breakpoint, use 16 px card padding and 22 px radii.
- Keep the same centered 480 px column at 1024 px and wider.
- Do not introduce a desktop card grid.
- Preserve natural vertical document scrolling and prohibit document-level horizontal scrolling.

## Card and typography CSS

Apply one shared card treatment to `.target-section`, `.result-section`, `.total-section`, and `.plate-control-section`:

- solid `--color-surface` background;
- one-pixel `--color-border` border;
- no texture or background image;
- no strong or colored shadow;
- content-driven height;
- unclipped focus rings and overflow affordances.

Typography rules:

- h1 is compact uppercase semibold text with positive tracking;
- card h2 text remains title case and uses secondary color;
- target and total use heavy tabular numerals, compact line height, and responsive `clamp()` sizing;
- units remain baseline-aligned and visually subordinate;
- plate expressions use large semibold text;
- support copy and rounding feedback use secondary text and readable line height.

Remove the old uppercase transformation from card h2 elements. Retain the existing visible phrases and units unless Slice 005 explicitly shortens mode copy.

## Control CSS

### Mode choices

- Use one rounded charcoal container with two equal columns.
- Give each button at least 44 px height.
- Use blue fill and white text only for `[aria-pressed="true"]`.
- Keep the inactive surface charcoal with secondary text.
- Do not change padding or border width between states.

### Target display and input

- Keep display and input in the same target-control region.
- Give both equivalent block dimensions so entering edit mode does not move later content.
- Use white heavy numerals and a visible blue focus ring.
- Preserve numeric input attributes and all event handling.

### Step and add controls

- Use raised charcoal fills and subtle borders.
- Keep two equal step columns and the existing three-by-two add grid.
- Preserve visible `lb` on add controls to satisfy Slice 003.
- Use blue text for target step controls and near-white text for add controls.

### Primary actions

- Set `.configuration-action-slot` height to the same responsive action token as its button.
- Set `.optimize-button` to full width and the exact slot height.
- Use blue, hover-blue, and active-blue tokens without changing dimensions.
- Keep the button absent, rather than disabled or visibility-hidden, when unavailable.
- Verify the target and reverse slot elements remain the same DOM instances across action transitions.

## Barbell markup changes

Change the track to the following semantic order:

```text
viewport
└── track
    ├── fixed-bar notch
    ├── plate stack
    │   ├── plate 0
    │   │   └── centered label block
    │   │       ├── numeric weight
    │   │       └── LB
    │   └── ...
    └── remaining sleeve
```

Use hooks equivalent to:

```text
data-barbell-part="bar-weight-notch"
data-barbell-part="sleeve"
data-plate-label="true"
```

The notch markup is a non-interactive `span` before all plate elements. It visibly contains `45` and a compact `LB BAR` line, with both descendants decorative to assistive technology because the parent visualization supplies the fixed-bar description.

The notch shall not:

- receive a plate weight/color data attribute;
- enter `plateRefs`;
- increment occurrence keys;
- be passed to `onRemovePlate`;
- be included in `plates.length` or overflow plate counts;
- receive button semantics or tabindex.

## Barbell accessible summary

Build two strings without changing calculator state:

```ts
const fixedBarSummary = 'Fixed bar: 45 lb'
const sideSummary = plates.length === 0
  ? 'One side: no plates'
  : `One side: ${...}`
```

For read-only mode, expose an accessible name equivalent to:

```text
Plates required on one side. Fixed bar: 45 lb. One side: 45 lb, 10 lb, 5 lb
```

For removable mode, name the group equivalently to:

```text
Plates on one side. Fixed bar: 45 lb
```

The child removal buttons continue supplying the ordered side sequence. Do not place a second live region or hidden duplicate list inside `Barbell`.

## Bar assembly CSS

Use one shared vertical axis at 50% of the 158 px track height.

### Fixed-bar notch

- Width: 52 px.
- Height: 52 px, which remains shorter than the 76 px 2.5 lb plate.
- Neutral raised-gray fill distinct from the semantic gray plate.
- One-pixel border.
- Small radius no greater than 6 px so it does not resemble the rounded cards.
- Two-line centered label `45` / `LB BAR`.
- `flex: 0 0 52px`.

### Notch-to-plate join

- Place the plate stack immediately after the notch.
- Render no visible connector, collar, or spacing between the notch and the first plate.
- When the configuration is empty, place the remaining sleeve immediately after the notch.

### Plate stack

- Use `display: flex`, `align-items: center`, and a 3 px gap.
- Use no background gradient; the sleeve is a separate flat element behind or after the loaded stack.
- Keep each plate at 44 px width and its existing tokenized height.
- Keep one thin outline and at most one restrained shadow.
- Use no texture, perspective, rotation, bevel, fill gradient, or per-denomination geometry override other than height and tokenized color.

### Remaining sleeve

- Render a flat 10 px-high sleeve after the plate stack.
- Use `flex: 1 0 72px` or an equivalent rule so ordinary configurations show sleeve extending toward the right while long configurations grow the max-content track.
- Preserve the bounded internal horizontal viewport and overflow hint.

The track remains `width: max-content` with `min-width: 100%`, starts at inline scroll position zero, never centers its children, and never wraps.

## Plate-label centering implementation

Render visible labels equivalent to:

```tsx
<span className="barbell__plate-label" data-plate-label="true">
  <span className="barbell__plate-weight">{weight}</span>
  <span className="barbell__plate-unit">LB</span>
</span>
```

For removable plates, keep the block `aria-hidden="true"` because the button already has the complete accessible name. Target plates remain hidden as separate accessibility nodes under the named image-like visualization.

Center with shared layout only:

```text
plate: display: grid; place-items: center
label: display: grid; place-items: center; align-content: center
```

- Make the label wrapper fill the plate's content box.
- Use explicit compact line heights so the two-line block has stable geometry.
- Set plate padding consistently for every denomination.
- Do not use per-weight selectors, offsets, transforms, margins, or padding.
- Keep the plate itself centered by the parent's `align-items: center`.

Real-browser verification shall compare each label wrapper's `getBoundingClientRect()` midpoint to the sleeve midpoint and require an absolute difference of at most one CSS pixel.

## Overflow, focus, and state preservation

Do not change the existing imperative handle or pending-action flows.

- `resetScroll()` still returns read-only configurations to the left anchor.
- `revealPlate(index)` still moves only internal `scrollLeft`.
- `focusPlate(index)` still focuses the correct reverse plate and then reveals it.
- Add controls retain focus after addition.
- Remove focus follows next, previous, then corresponding-add.
- Optimize focuses the first resulting graphical plate.
- The new notch does not change indices or bounding calculations because `plateRefs` still contains only plates.
- An overflowing track still displays the text hint and an edge affordance.
- Forced-colors styling retains hardware, notch, plate boundaries, labels, and focus.

## Reduced motion and interaction states

Use transitions only for `color`, `background-color`, `border-color`, `opacity`, and `box-shadow`, with a maximum duration of 150 ms.

Do not transition:

- width or height;
- grid or flex placement;
- target or total values;
- plate order or position;
- card dimensions;
- action-slot dimensions.

Under `@media (prefers-reduced-motion: reduce)`, set nonessential transition duration to zero.

Use `:focus-visible` for keyboard rings, `:hover` only under hover-capable media where appropriate, and `:active` for immediate press feedback. State borders must keep constant width.

## Test implementation by acceptance criterion

### S5-AC-001 — Dark visual system

- Add test-side contrast calculations for the fixed Slice 005 text/surface and action token pairs.
- Verify actual computed colors and card surfaces in the production browser; do not assert CSS source strings from component tests.

### S5-AC-002 — CSS-rendered brand header

In `App.test.tsx`:

- assert the level-one heading is `PLATE CALCULATOR`;
- assert the decorative mark hook exists and is `aria-hidden`;
- assert the header contains no `img`, `svg`, or `canvas`.

### S5-AC-003 — Stable mode selector

In `App.test.tsx`:

- assert exactly two mode buttons in target/reverse DOM order;
- assert visible text `Target → Plates` then `Plates → Total`;
- query them by full accessible names to prove compatibility;
- assert target starts pressed and reverse starts unpressed;
- switch modes and assert only pressed state changes.

### S5-AC-004 — Target-mode hierarchy

In `TargetCalculator.test.tsx`:

- retain the 165 default result and Reduce plates workflow;
- assert the heading, total/unit association, step controls, result text, visualization, and action all remain in their expected sections;
- leave typography and equal control geometry to browser checks.

### S5-AC-005 — Reverse-mode hierarchy

In `PlateCalculator.test.tsx`:

- add 35 then 25;
- assert 165 total, exact add-control order, visual weights/colors, and visible Optimize;
- preserve add-button focus and accessible denomination/unit labels.

### S5-AC-006 — Fixed-bar notch

In `Barbell.test.tsx`:

- assert exactly one notch in empty and loaded read-only renderings;
- assert exactly one notch in removable rendering;
- assert visible `45` and `LB BAR` text;
- assert no button role, tabindex, plate data attributes, or removal callback on the notch;
- assert accessible labels identify `Fixed bar: 45 lb`.

### S5-AC-007 — Left-to-right plate loading

In `Barbell.test.tsx`:

- render `[45, 10, 5]`;
- assert semantic DOM order notch, legacy hidden hardware hooks, weights 45/10/5, sleeve, and CSS removal of the hardware gap;
- assert the input array remains unchanged;
- leave physical inline-coordinate ordering to browser verification.

### S5-AC-008 — Labels align to the bar centerline

- Assert every rendered plate contains the same number/unit label structure and shared label hook.
- Assert no production component branches on weight to position label markup.
- Use browser bounding rectangles for the one-pixel centerline requirement.

### S5-AC-009 — Flat CSS plate treatment

In `Barbell.test.tsx` and token tests:

- retain one semantic fill/label/height mapping per denomination;
- assert one element per plate and required data attributes;
- assert `Barbell` contains no image, SVG, canvas, or style URL;
- use browser computed styles to confirm solid fills, no background image, no transform, and strict height ordering.

### S5-AC-010 — Stable primary-action space

- Retain the existing target and reverse same-slot-identity assertions.
- In the browser, record slot and containing-card rectangles before and after Reduce plates and Optimize; require identical top, height, and bottom values.

### S5-AC-011 — Existing behavior is unchanged

- Run the complete test suite.
- Preserve all 126 existing assertions unless a purely presentational text query must be updated.
- Do not weaken calculation, input, mode, add/remove, optimization, focus, or overflow assertions.

### S5-AC-012 — iPhone 17 Pro preview

- Verify both representative workflows at exactly 402 by 874 CSS pixels.
- Assert document `scrollWidth <= clientWidth`.
- Capture all four required screenshots after the final production build.

### S5-AC-013 — Minimum-width usability

- Verify at exactly 320 CSS pixels with at least twelve reverse plates.
- Measure every interactive target at no less than 44 by 44 CSS pixels.
- Assert document containment, internal barbell overflow, reachable last plate, readable notch, and unclipped focus.

### S5-AC-014 — Desktop containment

- Verify at 1024 CSS pixels.
- Measure `.app-shell` at no more than 480 CSS pixels and horizontally centered within rounding tolerance.
- Confirm the calculator remains one column.

### S5-AC-015 — Contrast and alternate presentation

- Use test-side contrast calculations for exact tokens.
- Emulate forced colors and reduced motion in a real browser where supported.
- Verify keyboard focus across both workflows.
- Apply 200 percent browser text zoom or equivalent scaling at the 320 px layout and confirm required content remains reachable without document overflow.

## Manual browser verification

Build the production bundle and run its local preview. Use a fresh browser state.

### 402 by 874 target workflow

1. Confirm the CSS logo and `PLATE CALCULATOR` header.
2. Confirm target is the left selected blue segment and reverse is the right inactive segment.
3. Set target 165 and confirm large target hierarchy, equal step controls, result `45 + 10 + 5`, full-width Reduce plates, and fixed-bar notch.
4. Measure notch, plate, sleeve, and label centers.
5. Confirm physical order is notch/45/10/5/sleeve, the notch touches the first plate, and the stack begins at the left anchor.
6. Activate Reduce plates and confirm 35/25, unchanged total, absent button, identical slot/card rectangles, and left-to-right plate order.
7. Capture visible-action and absent-action target screenshots from the same viewport and scroll framing.

### 402 by 874 reverse workflow

1. Switch modes and confirm the right segment is selected without reordering.
2. Add 35 and 25 and confirm current total 165, neutral add controls, flat blue/yellow plates, centered labels, and visible Optimize.
3. Record selected-card and action-slot rectangles.
4. Activate Optimize and confirm 45/10/5, unchanged total, focus on Remove 45 lb plate, absent Optimize, and identical recorded rectangles.
5. Confirm notch/plate/sleeve order, a flush notch-to-first-plate join, and all label centers.
6. Capture visible-action and absent-action reverse screenshots from the same viewport and scroll framing.

### 320 minimum-width workflow

1. Confirm the header and both compact visible mode labels remain readable.
2. Confirm cards use 16 px padding, 22 px radii, and no document overflow.
3. Add at least twelve reverse plates and confirm internal-only horizontal overflow.
4. Reach and remove the final plate with keyboard navigation.
5. Measure mode, step, add, primary-action, and removal controls at no less than 44 by 44 CSS pixels.
6. Confirm the notch and first loaded plate are visible at initial scroll position.
7. Confirm focus rings are not clipped.

### Desktop and alternate presentation

1. At 1024 px, confirm a centered single column no wider than 480 px.
2. Traverse both complete workflows using keyboard only.
3. Check red, blue, yellow, green, black, and gray plate focus visibility.
4. Emulate forced colors and verify logo, notch, hardware, labels, boundaries, and focus remain perceivable.
5. Emulate reduced motion and confirm nonessential transition duration is zero.
6. Verify 200 percent text zoom at the minimum layout.
7. Confirm browser console warnings and errors are absent.

Record measured results and screenshot paths in the implementation handoff.

## Verification commands

No installation is expected. Run:

```text
pnpm run typecheck
pnpm test
pnpm run build
```

Then run the built production preview for the complete browser checklist.

Inspect authored and built output to confirm no external font, remote image, SVG, canvas, icon library, CSS framework, component library, storage, router, PWA, service worker, or deployment change was introduced.

## Implementation order

1. Mark the slice and plan approved for implementation when authorization is given.
2. Add the compact CSS brand-header markup and header tests.
3. Separate mode visible copy from preserved accessible names and extend App tests.
4. Update exact application and plate presentation tokens with contrast tests.
5. Add the fixed-bar notch and fixed-bar accessible summary to `Barbell`.
6. Split plate labels into uniform number/unit blocks and extend `Barbell` tests.
7. Restructure and style the bar assembly for left anchoring and rightward stacking.
8. Apply the dark shell, cards, typography, mode, secondary-control, and primary-action CSS.
9. Add responsive, interaction-state, reduced-motion, and forced-colors rules.
10. Extend target, reverse, and App regression coverage without changing behavior.
11. Run type checking and the full test suite.
12. Build and inspect production output.
13. Perform 320, 402 by 874, 1024, keyboard, contrast, zoom, forced-colors, reduced-motion, overflow, centerline, and layout-stability browser verification.
14. Capture the four required iPhone 17 Pro screenshots.
15. Mark both Slice 005 documents `Approved and implemented` only after every check passes.

## Risks and controls

- **Visual work changes domain behavior:** restrict production changes to header/mode/barbell markup, presentation tokens, and CSS; keep calculators and calculation imports unchanged.
- **Compact mode copy breaks established accessible names:** use explicit full `aria-label` values while rendering compact visible text.
- **Logo becomes an asset dependency:** construct one decorative mark with CSS and assert no image, SVG, or canvas.
- **Notch becomes a phantom plate:** keep it outside `plates`, refs, occurrences, callbacks, totals, and semantic plate attributes; test all exclusions.
- **Notch looks like a selected gray plate:** use neutral hardware tokens, compact 52 px height, `LB BAR` copy, and no button semantics.
- **Label font metrics cause visual drift:** make every plate and label a shared centering grid and measure midpoints in a real browser.
- **Per-denomination fixes hide a layout bug:** prohibit weight-specific label selectors and require identical markup.
- **Plate group remains centered:** remove centering rules, start the max-content track at scroll zero, and verify physical left-to-right coordinates.
- **Sleeve disappears after ordinary loads:** use a flexible 72 px minimum sleeve remainder.
- **Long loads force document overflow:** keep the outer viewport bounded, track max-content internal, and verify twelve-plate behavior at 320 px.
- **Dark theme reduces contrast:** calculate exact token pairs and verify forced-colors behavior.
- **Focus rings clip against dark cards or overflow:** use an outer ring with separation and measure the focused bounds inside each viewport.
- **State styles move layout:** keep constant borders and dimensions; transition colors and shadows only.
- **Action buttons cause card movement:** bind slot and button to one responsive height and compare rectangles before/after both actions.
- **Large typography overflows:** use `clamp()`, `min-width: 0`, compact line height, and 320 px plus 200 percent zoom checks.
- **Screenshot artifacts diverge from implementation:** capture only the final production preview after automated and browser verification pass.
- **Scope growth:** reject navigation, settings, theme switching, motion choreography, persistence, PWA, deployment, and later-slice abstractions.

## Ambiguities and contradictions

No ambiguity prevents deterministic implementation.

The specification and this plan resolve the implementation choices as follows:

- the approved compact mode labels are visible, while full established mode names remain accessible through `aria-label`;
- the logo is CSS-only and decorative, while the wordmark is the real h1;
- the fixed-bar notch is 52 by 52 px, is labeled `45` / `LB BAR`, and is never a plate or control;
- the notch sits flush against the first plate, while legacy Slice 004 connector/collar hooks remain non-rendered and heavy-to-light plate order is unchanged;
- physical loading begins at the left anchor and grows right in the existing supplied order;
- the complete two-line label block is centered on the sleeve axis, not merely aligned within the plate by text baseline;
- exact plate heights remain Slice 004 functional tokens;
- final solid denomination fills remain presentation tokens and contain no gradients or textures;
- add controls retain visible `lb` even though the visual mockup used compact numeric examples, because Slice 003 requires the unit;
- the four screenshots are verification artifacts and are not imported at runtime;
- pixel geometry is verified in a real browser rather than inferred from jsdom.

## Plan completeness

The plan is ready for implementation when approved. It implements all S5-AC-001 through S5-AC-015, preserves the complete Slice 001 through Slice 004 behavior, requires no new dependency or production module, and introduces no Slice 006 or later work.
