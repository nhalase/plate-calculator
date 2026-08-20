# Slice 004: Shared Barbell Visualization

## Status

Approved and implemented

## Goal

Add one shared, one-sided barbell visualization to both calculator modes. Every displayed plate shall use its required denomination color, show its weight, use a deterministic relative size, and remain synchronized with the calculator's derived configuration and total.

In Target Weight → Plates, the visualization is read-only and represents the currently displayed default or optimized configuration. In Plates → Total Weight, each graphical plate remains an independently removable native control and preserves the Slice 003 removal and focus behavior.

This slice completes the functional visualization requirements. Broader aesthetic refinement is deliberately reserved for Slice 005.

## Dependencies

- Slice 001 is implemented and verified.
- Slice 002 is implemented and verified.
- Slice 003 is implemented and verified.
- `src/domain/plates.ts` remains the source of supported denominations and shall become the source of the denomination-to-color-name mapping.
- `src/domain/calculations.ts` remains the only source of plate configurations, ordering, and totals.
- The visualization shall consume existing calculator state. It shall not own, recalculate, normalize, sort, or persist a second plate configuration.

## Source requirements

- REQ-DOM-002 and REQ-DOM-003
- REQ-CALC-003, REQ-CALC-004, and REQ-CALC-007
- The visualization clause of AC-CALC-005-3
- The visualization clause of AC-UI-004-2
- REQ-UI-004, REQ-UI-006, and REQ-UI-007
- REQ-UX-001

See [requirements.md](../requirements.md), [architecture.md](../architecture.md), [Slice 001](001-calculation-engine.md), [Slice 002](002-target-to-plates-ui.md), and [Slice 003](003-plates-to-total-and-mode-switching.md).

## Scope boundary

This slice includes:

- a shared one-side barbell visualization used by both modes;
- a simplified shaft, collar, and sleeve;
- one visual plate per plate instance;
- required color mapping for every denomination;
- visible weight labels on every plate;
- deterministic relative plate heights;
- heavy-to-light plate order from the collar outward;
- read-only target-mode visualization;
- independently removable graphical plates in reverse mode;
- synchronization with target default and optimized configurations;
- synchronization with reverse-mode additions, removals, ordering, and total;
- synchronization with reverse-mode Optimize replacement;
- accessible text that does not depend on color, size, or position;
- bounded horizontal overflow for unlimited plate quantities;
- automated component and integration tests;
- focused mobile and keyboard browser verification.

This slice does not include final visual polish, branding, animation, persistence, PWA behavior, offline support, or deployment.

## Domain terminology

### One-sided barbell

A simplified horizontal representation containing, from left to right:

1. a short section of bar shaft;
2. a collar separating the shaft from the sleeve;
3. the sleeve extending to the right;
4. zero or more plates loaded on the sleeve.

Only one side is represented. The application continues to assume an identical configuration on the opposite side.

### Visual plate

One rendered instance corresponding to exactly one entry in a `PlateConfiguration`.

### Read-only plate

A visual plate in Target Weight → Plates. It communicates denomination, color, size, and order but has no action.

### Removable plate

A visual plate in Plates → Total Weight rendered as a native button. Activating it removes exactly that selected instance.

### Visualization viewport

The bounded region containing the one-sided barbell. It may scroll horizontally when the full sleeve contents cannot fit, but it shall never cause document-level horizontal scrolling.

## Domain color model

`src/domain/plates.ts` shall expose one immutable definition for every supported denomination:

```ts
type PlateColor =
  | 'red'
  | 'blue'
  | 'yellow'
  | 'green'
  | 'black'
  | 'gray'

interface PlateDefinition {
  weight: PlateWeight
  color: PlateColor
}
```

The ordered definitions shall map exactly:

| Weight | Color name |
| ---: | --- |
| 45 lb | red |
| 35 lb | blue |
| 25 lb | yellow |
| 10 lb | green |
| 5 lb | black |
| 2.5 lb | gray |

The definitions shall remain in the same descending weight order as `PLATE_WEIGHTS`. UI components shall consume this mapping rather than reproduce it in JSX, CSS selectors keyed only by position, or component-local objects.

The mapping describes domain color names. Slice 004 shall use these initial local CSS tokens:

| Color name | Plate background | Label color |
| --- | --- | --- |
| red | `#b42318` | `#ffffff` |
| blue | `#175cd3` | `#ffffff` |
| yellow | `#fdb022` | `#17201c` |
| green | `#067647` | `#ffffff` |
| black | `#1f2937` | `#ffffff` |
| gray | `#98a2b3` | `#17201c` |

Slice 005 may refine the exact shades while preserving the semantic mapping and required contrast. In this slice, visible denomination labels shall meet at least WCAG AA 4.5:1 contrast against their plate backgrounds.

## Deterministic size model

Plate weight shall be communicated through visible text and relative height. Color and size are supplementary cues.

At the base CSS scale, plate heights shall be:

| Weight | Height |
| ---: | ---: |
| 45 lb | 136 px |
| 35 lb | 124 px |
| 25 lb | 112 px |
| 10 lb | 100 px |
| 5 lb | 88 px |
| 2.5 lb | 76 px |

The following invariants are required:

- every heavier denomination is strictly taller than every lighter denomination;
- every plate is vertically centered on the same sleeve axis;
- every interactive reverse-mode plate is at least 44 CSS pixels wide and 44 CSS pixels tall;
- labels remain legible without zooming at a 320 CSS-pixel viewport;
- responsive scaling may reduce all heights proportionally only if their strict ordering and label readability remain intact.

Slice 004 does not prescribe realistic plate thickness. A consistent minimum width may be used so touch targets and labels remain usable.

## Shared visualization contract

Both calculator modes shall render the same shared visualization component or equivalent shared rendering boundary.

Its observable inputs are equivalent to:

```ts
interface BarbellProps {
  plates: PlateConfiguration
  mode: 'readonly' | 'removable'
  accessibleLabel: string
  onRemovePlate?: (index: number, weight: PlateWeight) => void
}
```

The exact TypeScript interface is an implementation-plan decision. Observable behavior shall satisfy this contract:

- `plates` is already ordered by the existing domain boundary;
- the component renders exactly one plate per array entry;
- the component does not sort or mutate `plates`;
- the component does not calculate totals;
- read-only mode exposes no removal action;
- removable mode provides one native removal button per plate instance;
- absent or empty plates still render the shaft, collar, and empty sleeve;
- the component performs no network or storage access.

## Required visual structure

Within the visualization viewport, render in this left-to-right order:

1. bar shaft;
2. collar;
3. plates in the exact order supplied;
4. remaining visible sleeve or a sleeve end marker.

The heaviest displayed plate therefore appears closest to the collar. For configuration `[45, 25, 10, 5]`, the visual order from collar outward shall be:

```text
collar | 45 | 25 | 10 | 5 | sleeve end
```

The shaft, collar, and sleeve shall be visually distinguishable from the page background and plate colors. They do not need photorealistic detail.

Plate position is not a sorting mechanism. Both calculators shall continue supplying domain-ordered arrays.

## Plate-label contract

Every visual plate shall visibly show its numeric weight:

```text
45
35
25
10
5
2.5
```

The `lb` unit may appear on each plate or in an immediately associated visualization label, but accessible names shall include the unit.

Labels shall:

- remain upright and readable;
- not be clipped at the required base size;
- use sufficient contrast;
- remain present in forced-colors or equivalent high-contrast presentation where practical;
- not rely on a tooltip, hover, or legend to identify denomination.

## Target-mode visualization

The Target Weight → Plates result section shall contain:

1. the existing `Plates per side` label;
2. the one-sided barbell visualization;
3. the existing optional Reduce plates action.

No `Load both sides equally` helper, equivalent instructional sentence, separate denomination sequence such as `45 + 10 + 5`, or standalone `No plates required` message shall appear between the heading and visualization. Numeric denomination labels inside the plates remain required.

The visualization shall receive exactly the derived configuration:

- the default configuration while default mode is selected;
- the optimized configuration after Reduce plates is activated.

The target visualization shall:

- be read-only;
- expose no plate buttons or removal actions;
- render one visual plate for every result entry, including duplicates;
- show an empty sleeve at 45 lb;
- update in the same React render as target changes and optimization;
- leave active target, rounding feedback, and optimization behavior unchanged.

For assistive technology, the visualization shall have a concise name equivalent to `Plates required on one side` and a textual description equivalent to:

```text
One side: 45 lb, 10 lb
```

For an empty configuration, the description shall be equivalent to:

```text
One side: no plates
```

The visualization's accessible description remains available and is the nonvisual equivalent of the omitted standalone sequence. Decorative plate internals shall not create duplicate accessible announcements.

## Reverse-mode visualization

The Plates → Total Weight selected-plates section shall use the shared visualization as its plate display.

When no plates are selected, it shall render:

- the `Plates per side` title followed directly by the visualization, with no helper or standalone empty-state text;
- the empty shaft, collar, and sleeve;
- no removal buttons.

When plates are selected:

- every selected instance shall appear once;
- every plate shall be a native removal button;
- each button's accessible name shall remain equivalent to `Remove 45 lb plate`;
- duplicate denominations shall remain separate buttons;
- visible order shall remain the Slice 003 domain order;
- activating a plate shall remove exactly that instance;
- total and visualization shall update in the same interaction;
- Slice 003 next/previous/corresponding-add focus recovery shall remain unchanged;
- the newly focused removal or add control shall be visible within its relevant viewport.

The Slice 003 text-only removal grid may be replaced by the graphical plate buttons. The implementation shall not render a second duplicate set of removal buttons solely to preserve old markup.

## Add synchronization

When a reverse-mode add control is activated:

1. Slice 003 adds and domain-sorts the selected configuration;
2. the total updates from `calculateTotalWeight`;
3. the shared visualization receives the new configuration;
4. exactly one new graphical plate instance appears at its sorted position;
5. focus remains on the activated add control.

If the inserted plate would be outside the currently visible portion of an overflowing visualization, the visualization viewport shall adjust only as much as necessary to make an instance of the newly added denomination visible. This scroll adjustment shall not move keyboard focus or scroll the document horizontally.

## Remove synchronization

When a graphical plate is activated:

1. Slice 003 removes exactly that rendered index;
2. total and configuration update immediately;
3. the graphical plate disappears in the same interaction;
4. remaining plates retain domain order and correct colors/sizes;
5. focus follows the Slice 003 next, previous, then corresponding-add rule;
6. any newly focused graphical plate is visible within the visualization viewport.

No confirmation, animation delay, or separate calculation action is permitted.

## Optimization synchronization

For active target 165 lb:

```text
Default visual plates: red 45, green 10, black 5

Optimized visual plates: blue 35, yellow 25
```

Activating Reduce plates shall replace the visual configuration and accessible description together without changing active total or rounding feedback.

Changing the target afterward shall restore the visualization and accessible description to the new target's default configuration, as required by Slice 002.

## Overflow contract

Plate inventory is unlimited, so a finite-width physical sleeve cannot display every possible selection without overflow.

The visualization shall therefore use a bounded horizontal viewport:

- its outer width shall never exceed its calculator panel;
- the visualization's internal content may overflow horizontally;
- overflow shall be handled inside the visualization viewport, not on the document or calculator panel;
- native horizontal touch scrolling, trackpad scrolling, and keyboard-reachable controls shall remain available;
- visible scroll affordance shall not depend solely on a transient scrollbar;
- shaft and collar may remain visually anchored while the sleeve contents scroll, but this is not required;
- plate buttons shall not shrink below their minimum touch or label size merely to avoid internal overflow;
- wrapping plates onto a second sleeve row is not permitted because it would break the one-sided loading order;
- plates shall not be aggregated into counts.

At 320 CSS pixels, `document.documentElement.scrollWidth` shall equal its client width even when at least twelve plates are selected on one side.

## Accessibility contract

- The visualization shall have a visible or programmatic name describing one side of the bar.
- Target-mode plate elements shall not appear interactive.
- Reverse-mode plate elements shall be native buttons with action, denomination, and unit in their accessible names.
- Every denomination shall be communicated by visible text in addition to color and size.
- The selected sequence shall be available to assistive technology in heavy-to-light order.
- Both modes shall communicate the empty state through the visible empty bar and its accessible description, without standalone empty-result text.
- Color tokens shall not be the only difference between denominations.
- Plate-label contrast shall meet WCAG AA.
- Keyboard focus on a graphical plate shall be clearly visible against every plate color.
- Internal scrolling shall not trap keyboard focus.
- Focused plate buttons shall be scrolled into view when necessary.
- Existing target and rounding announcements shall remain functional without adding a competing live region for the visualization.
- Forced-colors mode shall retain plate outlines, labels, and focus indication even when authored colors are overridden.

## Mobile-layout contract

At a viewport width of 320 CSS pixels:

- neither calculator nor the document shall scroll horizontally;
- each visualization viewport shall fit inside its panel;
- the visualization may scroll internally only when its contents exceed its width;
- shaft, collar, sleeve, and at least the first loaded plate shall be recognizable without scrolling;
- visual plate labels shall remain readable;
- reverse-mode graphical plates shall remain at least 44 by 44 CSS pixels;
- vertical plate-size differences shall remain visible;
- mode switching, target controls, add controls, Reduce plates, Optimize, and removal shall retain their Slice 002 and Slice 003 target sizes;
- no visualization behavior shall require hover, drag-and-drop, pinch zoom, or precise pointer input.

## Acceptance scenarios

### S4-AC-001 — Empty target barbell

Given the initial target is 45 lb,
then no standalone empty-result text appears below `Plates per side`,
and a read-only one-sided barbell with shaft, collar, and empty sleeve is displayed,
and no plate or removal control appears in the visualization.

Maps to REQ-DOM-001, REQ-UI-006, and REQ-UI-007.

### S4-AC-002 — Default target visualization

Given the active target is 155 lb,
then no standalone `45 + 10` sequence appears above the bar,
and the visualization contains exactly two read-only plates,
and their order from the collar is 45 then 10,
and the 45 plate is red and taller than the green 10 plate,
and both weights are visible.

Maps to REQ-CALC-003, REQ-DOM-003, and REQ-UI-006.

### S4-AC-003 — Optimized target visualization

Given the active target is 165 lb,
and the default visualization contains `45`, `10`, and `5`,
when the user activates Reduce plates,
then the visualization contains `35` and `25`,
and the visual plates are blue 35 then yellow 25,
and the active total remains 165 lb.

Maps to REQ-CALC-004, REQ-DOM-003, and REQ-UI-006.

### S4-AC-004 — Target change resets both results

Given the optimized 165 lb configuration is visible,
when the user activates `+5`,
then the visualization and accessible description show the default configuration for 170 lb,
and no stale 35 or 25 plate remains unless it belongs to that default result.

Protects Slice 002 synchronization.

### S4-AC-005 — Empty reverse barbell

Given Plates → Total Weight is selected with no selected plates,
then the current total is 45 lb,
and no helper or standalone empty-result text is visible between `Plates per side` and the empty bar,
and the one-sided barbell shows an empty sleeve,
and no removal button appears.

Maps to REQ-UI-006 and REQ-UI-007.

### S4-AC-006 — Reverse addition updates visualization

Given the reverse calculator is empty,
when the user adds 45 and then 10,
then the total is 155 lb,
and graphical removal buttons appear as red 45 then green 10,
and each visible label and accessible name identifies its weight,
and focus remains on the most recently activated add control.

Completes the visualization portion of AC-CALC-005-3.

### S4-AC-007 — Reverse ordering ignores insertion order

Given the reverse calculator is empty,
when the user adds `10`, `45`, `5`, and `25`,
then graphical plates appear from the collar as `45 | 25 | 10 | 5`,
with the required red, yellow, green, and black mapping.

Maps to REQ-UI-004 and REQ-UI-006.

### S4-AC-008 — Remove a graphical plate

Given graphical plates are `45 | 25 | 10`,
when the user activates the 25 lb graphical removal button,
then exactly that plate disappears,
and the visualization becomes `45 | 10`,
and the total decreases by 50 lb,
and focus moves to the 10 lb graphical removal button.

Completes the visualization portion of AC-UI-004-2.

### S4-AC-009 — Duplicate graphical plates

Given two 45 lb plates are selected on one side,
then two separate red 45 lb graphical removal buttons are displayed,
and activating either one removes exactly one instance,
and one red 45 lb removal button remains.

Maps to REQ-DOM-002 and REQ-UI-004.

### S4-AC-010 — Complete color and size mapping

Given one plate of every denomination is displayed,
then the sequence is `45 | 35 | 25 | 10 | 5 | 2.5`,
and the colors are red, blue, yellow, green, black, and gray respectively,
and every plate is strictly taller than the denomination after it,
and all six labels meet required contrast.

Maps to REQ-DOM-003 and REQ-UI-006.

### S4-AC-011 — Accessible denomination communication

Given authored colors are unavailable or cannot be distinguished,
then every plate remains identifiable by visible weight text,
and the target configuration remains available as text,
and every reverse plate remains available as a named removal button.

Maps to REQ-DOM-003 and REQ-UI-006.

### S4-AC-012 — Bounded overflow

Given at least twelve plates are selected on one side at a 320 CSS-pixel viewport,
then the visualization scrolls horizontally within its own bounded viewport,
and plate labels and removal controls retain their minimum size,
and the calculator panel and document do not scroll horizontally,
and every plate remains reachable.

Maps to REQ-UX-001.

### S4-AC-013 — Visualization state survives mode switching

Given the target mode displays an optimized configuration,
and the reverse mode contains selected plates,
when the user switches repeatedly between modes,
then each visualization matches its preserved calculator state,
and neither visualization alters the other mode's state.

Protects Slice 003 state retention.

### S4-AC-014 — Mobile and keyboard usability

Given a 320 CSS-pixel-wide viewport,
when the user completes target plate reduction and reverse add/optimize/remove workflows using keyboard or touch,
then graphical removal targets remain at least 44 by 44 CSS pixels,
and focus remains visible against every plate color,
and focused plates remain in view,
and no document-level horizontal scrolling or hover-only behavior is required.

Maps to REQ-UX-001.

### S4-AC-015 — Reverse Optimize replaces the graphical configuration

Given the reverse visualization contains blue 35 then yellow 25,
and the total is 165 lb,
when the user activates Optimize,
then the visualization becomes red 45, green 10, then black 5,
and the total remains 165 lb,
and focus moves to the red 45 lb removal button,
and the selected-plates section and action slot do not move.

Maps to REQ-CALC-007 and REQ-UI-006.

### S4-AC-016 — No redundant target sequence

Given Target Weight → Plates is showing any empty, default, or reduced configuration,
then `Plates per side` is followed directly by the shared barbell visualization,
and no helper sentence, standalone denomination sequence, or empty-result message appears above the bar,
and each loaded plate still shows its own numeric weight,
and the visualization retains a complete accessible description of the fixed bar and one-side configuration.

Maps to AC-UI-006-1 and AC-UI-006-2.

## Required automated tests

Automated tests shall cover S4-AC-001 through S4-AC-013 and S4-AC-015 through S4-AC-016. Tests shall interact through visible controls, accessible roles, names, text, and stable semantic plate attributes rather than implementation state.

Tests shall additionally verify:

- the domain definition collection contains exactly one entry for every `PLATE_WEIGHTS` value;
- domain definitions are immutable and remain in descending order;
- every color name maps to the required denomination;
- target-mode plates have no button role or removal name;
- reverse-mode plates retain one native button per instance;
- visible plate order and accessible descriptions match after target plate reduction, reverse optimization, additions, and removals;
- graphical rendering does not change calculation results;
- no duplicate live region is introduced;
- focused removal remains correct after a graphical plate unmounts;
- the internal overflow container is structurally distinct from the document;
- all existing Slice 001, Slice 002, and Slice 003 tests pass.

S4-AC-010 contrast shall be verified with an automated contrast calculation for the specified token pairs. S4-AC-012 and S4-AC-014 require automated structural assertions where practical plus focused browser verification.

## Verification

The implementation must provide and run commands equivalent to:

```text
pnpm run typecheck
pnpm test
pnpm run build
```

Verification shall establish:

- strict TypeScript checking passes;
- all prior slice tests remain passing;
- all Slice 004 domain, component, and integration tests pass;
- a production build succeeds;
- both modes use the shared visualization boundary;
- no calculation rule is duplicated in visualization code;
- the built application still contains no PWA, service worker, backend, persistence, remote font, or deployment configuration;
- both modes pass the focused 320 CSS-pixel visual, overflow, touch-target, and keyboard checks;
- browser console errors are absent during visualization workflows.

## Non-goals

This slice does not include:

- the comprehensive visual-design and interaction-polish pass reserved for Slice 005;
- final typography, spacing rhythm, shadows, decorative texture, or branding;
- animation or transition choreography;
- sound or haptic feedback;
- drag-and-drop plate manipulation;
- plate aggregation or inventory limits;
- configurable bars, plate sets, units, or colors;
- kilograms or asymmetric loading;
- persistence, favorites, or settings;
- routing or deep links;
- a CSS framework, component library, SVG library, or canvas rendering dependency;
- manifest or service-worker configuration;
- offline verification;
- GitHub Pages configuration or deployment;
- Slice 005 or later implementation.

## Definition of done

- Both calculator modes display a shared one-sided barbell visualization.
- Every visual plate maps one-to-one to the calculator's existing configuration.
- Every denomination uses the required color, visible label, and deterministic relative size.
- Target plates are read-only and reverse plates remain independently removable.
- Text, total, and visualization update together for every applicable transition.
- All deferred visualization clauses from Slice 003 are satisfied.
- Required automated tests pass alongside all previous slice tests.
- Type checking and the production build pass.
- Both modes pass the 320 CSS-pixel visual, overflow, accessibility, and keyboard checks.
- No Slice 005 polish, PWA, persistence, offline, or deployment behavior is introduced.
- A later implementation plan introduces no product behavior absent from this contract.
