# Slice 002: Target Weight to Plates UI

## Status

Approved and implemented

## Goal

Deliver the first usable browser-based calculator workflow. A user can select a target total weight, see the default plates required on each side of a fixed 45 lb bar, understand when the requested weight was adjusted, and optionally replace the default result with a configuration that uses fewer plates.

This slice integrates the Slice 001 calculation engine with a React UI. It defines the complete observable behavior of the Target Weight → Plates view without prescribing internal React implementation details.

## Dependencies

- Slice 001 is implemented and verified.
- `src/domain/plates.ts` and `src/domain/calculations.ts` remain the only source of barbell calculation rules.
- The UI must consume, not reproduce, target normalization, greedy selection, optimized selection, optimization availability, and denomination ordering.

## Source requirements

- REQ-DOM-001 and REQ-DOM-002
- REQ-CALC-001 through REQ-CALC-004
- REQ-UI-001 through REQ-UI-003
- REQ-UI-007
- REQ-UX-001

See [requirements.md](../requirements.md), [architecture.md](../architecture.md), and [Slice 001](001-calculation-engine.md).

## Scope boundary

This slice includes one view only: Target Weight → Plates.

It includes:

- a minimal React and Vite browser application;
- initial empty-bar state;
- `−5` and `+5` target controls;
- direct decimal target entry;
- deterministic parsing, committing, and cancellation;
- nearest-achievable-weight feedback;
- default greedy plate results;
- optional minimum-plate optimization;
- textual per-side plate output;
- keyboard and mobile interaction requirements;
- automated component-level acceptance tests.

It does not include the reverse calculator, mode switching, graphical plates, plate colors, PWA behavior, deployment, persistence, or final visual design.

## Domain terminology

### Requested target

The finite numeric value committed through direct entry before normalization.

### Active target

The normalized, achievable total currently used for plate calculations and displayed as the primary result.

### Draft input

The temporary string displayed while the target is being edited. A draft does not affect the active target or plate result until it is committed successfully.

### Default configuration

The result of the Slice 001 greedy, heaviest-first calculation.

### Optimized configuration

The Slice 001 exact configuration with the fewest plates, using the documented heavy-first tie-break rule.

### Rounding feedback

Secondary text shown when a valid requested target normalizes to a different active target.

## Required screen structure

The view shall expose these elements in this order:

1. Application heading identifying the Barbell Plate Calculator.
2. Target section labeled `Target weight`.
3. Prominent interactive active-target value including the `lb` unit.
4. Direct-entry input in place of the active-target control while editing.
5. Optional rounding feedback immediately associated with the target.
6. `−5` and `+5` controls.
7. Result section labeled `Plates per side`.
8. Textual plate configuration or empty-result text.
9. Optional `Optimize` action.

The exact visual styling, capitalization, and punctuation may vary, but visible and accessible wording must communicate the same meaning.

## Initial state

On first render:

```text
Active target: 45
Requested target for feedback: none
Editing: no
Displayed configuration: default
Plates per side: none
```

The view shall:

- display `45 lb` prominently;
- display `No plates required` in the per-side result;
- show `−5` and `+5` controls;
- not show rounding feedback;
- not show Optimize;
- not expose any bar-weight setting or input.

## Observable state model

The view behaves as if it tracks:

```ts
interface TargetCalculatorState {
  activeTarget: number
  requestedTarget: number | null
  draftInput: string
  editing: boolean
  configuration: 'default' | 'optimized'
}
```

Equivalent internal organization is allowed, but observable transitions must match this specification.

Plate results and optimization availability are derived from the active target. They must not become independently editable state.

## State-transition contract

| Event | Active target | Requested target | Editing | Configuration |
| --- | --- | --- | --- | --- |
| Initial render | 45 | None | No | Default |
| Begin editing | Unchanged | Unchanged | Yes | Unchanged |
| Change draft | Unchanged | Unchanged | Yes | Unchanged |
| Commit valid achievable value | Committed value | None | No | Default |
| Commit valid adjusted value | Normalized value | Original request | No | Default |
| Commit invalid or empty value | Unchanged | Unchanged | No | Unchanged |
| Cancel with Escape | Unchanged | Unchanged | No | Unchanged |
| Press `+5` | Previous active target + 5 | None | No | Default |
| Press `−5` above 45 | Previous active target − 5 | None | No | Default |
| Press `−5` at 45 | 45 | None | No | Default |
| Activate Optimize | Unchanged | Unchanged | No | Optimized |

Whenever editing ends, the next editing session begins with a draft equal to the current active target.

## Increment and decrement behavior

### Increase

Activating `+5` shall:

1. increase the active target by exactly 5 lb;
2. clear rounding feedback;
3. display the default configuration for the new target;
4. update all visible results immediately.

### Decrease

Activating `−5` shall:

1. decrease the active target by exactly 5 lb when it is above 45 lb;
2. leave the active target at 45 lb when it is already 45 lb;
3. clear rounding feedback, including when the value remains at 45 lb;
4. display the default configuration for the resulting target;
5. update all visible results immediately.

Neither interaction shall require a Calculate, Apply, or Submit action.

## Beginning direct entry

The prominent active-target value shall be a native interactive control with the accessible name `Edit target weight`.

Activating it shall:

1. enter editing mode;
2. replace the interactive display with a single editable input;
3. initialize the draft with the active target without the `lb` suffix;
4. focus the input immediately;
5. select the existing draft when selection is supported, so typing replaces it with minimal interaction.

The input shall:

- have the accessible name `Target weight`;
- use a text-compatible value model owned by the application;
- declare `inputmode="decimal"` or equivalent behavior;
- disable inappropriate text assistance such as autocomplete where supported;
- display the `lb` unit visibly adjacent to or associated with the input;
- remain usable by keyboard.

## Direct-entry grammar

Before parsing, remove leading and trailing whitespace.

The entire remaining draft must match this decimal grammar:

```regex
^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$
```

The parsed result must also be finite.

Accepted examples include:

```text
155
137.5
 155 
+155
-10
.5
155.
```

Rejected examples include:

```text
empty string
whitespace only
.
+
-
13..5
135lb
135 lbs
135abc
1e2
0x90
NaN
Infinity
```

Negative and other below-bar finite values are syntactically valid requests; Slice 001 normalization resolves them to 45 lb.

The UI shall not accept a valid numeric prefix while ignoring invalid trailing characters.

## Committing direct entry

Pressing Enter or moving focus away from the input commits the current draft.

### Valid draft

For a draft accepted by the direct-entry grammar:

1. Parse the complete draft as a finite number.
2. Pass the request to Slice 001 `normalizeTargetWeight`.
3. Make the normalized value the active target.
4. Store the requested value for feedback only when it differs numerically from the active target.
5. Clear feedback when the request equals the active target.
6. Reset the displayed configuration to default.
7. Exit editing.
8. Update the target and plate result immediately.

Required examples:

| Draft | Active target | Rounding feedback |
| ---: | ---: | --- |
| `155` | 155 | None |
| `137` | 135 | Identifies 137 lb |
| `138` | 140 | Identifies 138 lb |
| `137.5` | 135 | Identifies 137.5 lb |
| `142.5` | 140 | Identifies 142.5 lb |
| `42` | 45 | Identifies 42 lb |
| `-10` | 45 | Identifies −10 lb |

### Invalid draft

For a draft rejected by the grammar or finite-number check:

1. Keep the previous active target.
2. Keep the previous rounding feedback, if any.
3. Keep the previously displayed default or optimized configuration.
4. Discard the invalid draft.
5. Exit editing.
6. Restore the active target as the displayed value.
7. Leave the calculator usable.

No error alert or validation message is required in this slice.

### Single-commit guarantee

An Enter commit commonly causes a subsequent blur. That sequence shall produce one observable commit only. It must not normalize twice, clear newly created feedback, or otherwise perform a second transition.

## Cancelling direct entry

Pressing Escape while editing shall:

1. discard the draft;
2. retain the previous active target;
3. retain existing rounding feedback;
4. retain the currently displayed default or optimized configuration;
5. exit editing;
6. restore the active target as the displayed value.

If focus movement after Escape causes a blur, that blur shall not commit the cancelled draft.

## Rounding feedback

When a valid requested target differs numerically from the normalized active target:

- the normalized active target remains the primary, most prominent value;
- secondary text shall identify the original request;
- the feedback shall not require acknowledgment;
- optimization shall not clear the feedback.

Acceptable copy includes:

```text
Nearest loadable weight to 137 lb
```

Feedback shall clear after:

- a `+5` action;
- a `−5` action;
- committing a valid request that is already achievable.

Feedback shall remain unchanged after:

- beginning an editing session;
- changing a draft without committing;
- cancelling with Escape;
- committing invalid input;
- activating Optimize.

## Default plate result

When default configuration is active:

- obtain the result from Slice 001 `calculateDefaultPlates(activeTarget)`;
- label the result `Plates per side`;
- display denominations in the order returned by the domain;
- separate multiple plates with a visible ` + ` delimiter;
- do not display plates for the opposite side separately;
- do not display graphical plates or apply denomination colors.

Required examples:

| Active target | Displayed result |
| ---: | --- |
| 45 | `No plates required` |
| 135 | `45` |
| 155 | `45 + 10` |
| 165 | `45 + 10 + 5` |
| 225 | `45 + 45` |

The target section shall show the total barbell weight. The result section shall explicitly communicate that the listed plates apply to each side.

## Optional optimization

The Optimize action shall be visible only when:

1. Slice 001 `hasOptimization(activeTarget)` is true; and
2. the default configuration is currently displayed.

Activating Optimize shall:

1. replace the displayed result with `calculateOptimizedPlates(activeTarget)`;
2. leave the active target unchanged;
3. leave rounding feedback unchanged;
4. hide the Optimize action;
5. require no confirmation.

For an active target of 165 lb:

```text
Before: 45 + 10 + 5
After:  35 + 25
Total:  165 lb in both states
```

The slice does not require a control to return to the default result for the same target.

Any successful target change—including `+5`, `−5`, or valid direct-entry commit—shall reset the displayed result to the default configuration for the new target.

Invalid input and Escape do not constitute a target change and therefore preserve an optimized result.

## Loading and error states

All calculations are synchronous and local. This view shall not display a loading state.

Valid UI interactions shall not send network requests. Domain errors are programming defects because the UI supplies only normalized active targets to calculation functions; no user-facing domain-error state is required in this slice.

## Accessibility contract

- Use a `main` landmark for primary content.
- Use logical heading levels for the application, target section, and result section.
- Use native buttons for target editing, `−5`, `+5`, and Optimize.
- The `−5` control shall have the accessible name `Decrease target by 5 pounds`.
- The `+5` control shall have the accessible name `Increase target by 5 pounds`.
- The direct-entry control shall have the accessible name `Target weight`.
- The Optimize control shall have the accessible name `Optimize` or an equivalent name containing that word.
- Every control shall be reachable and operable by keyboard.
- Keyboard focus shall remain visibly indicated.
- No behavior shall require hover.
- The `lb` unit shall be visibly or accessibly associated with target values.
- Plate results shall be understandable as text without color, shape, or position.
- Rounding feedback shall be discoverable as associated text but shall not interrupt the user as an alert.

## Mobile-layout contract

At a viewport width of 320 CSS pixels:

- the document shall not scroll horizontally;
- the target value or input shall remain fully usable;
- `−5` and `+5` shall remain visible without overlap;
- the plate result shall wrap rather than overflow when necessary;
- primary interactive controls shall have a target size of at least 44 by 44 CSS pixels;
- visible focus indicators shall not be clipped;
- the workflow shall not require desktop hover behavior.

The application shall use locally available system fonts. No remote font, stylesheet, script, image, or API shall be required at runtime.

## Acceptance scenarios

### S2-AC-001 — Initial empty bar

Given the view has just loaded,
when no interaction has occurred,
then the active target is 45 lb,
and the result says `No plates required`,
and Optimize is absent,
and no bar-weight configuration control exists.

Maps to AC-DOM-001-1 and AC-DOM-001-2.

### S2-AC-002 — Increment without submission

Given the active target is 45 lb,
when the user activates `+5`,
then the active target becomes 50 lb,
and the per-side result updates immediately,
and no Calculate or Submit action is required.

Maps to AC-UI-001-1 and AC-UI-001-3.

### S2-AC-003 — Decrement floor

Given the active target is 45 lb,
when the user activates `−5`,
then the active target remains 45 lb,
and the empty-bar result remains valid.

Given the active target is 50 lb,
when the user activates `−5`,
then the active target becomes 45 lb.

Maps to AC-UI-001-2.

### S2-AC-004 — Begin editing

Given the active target is 155 lb,
when the user activates `Edit target weight`,
then a focused input named `Target weight` is displayed,
and its draft is `155`,
and it declares decimal input mode,
and its contents are selected where supported.

Maps to AC-UI-002-1 and AC-UI-002-3.

### S2-AC-005 — Commit an achievable target

Given the active target is 45 lb and direct entry is active,
when the user enters `155` and commits,
then the active target becomes 155 lb,
and the result becomes `45 + 10`,
and no rounding feedback is shown,
and no Calculate or Submit action is required.

Maps to AC-UI-002-4 and AC-UI-002-6.

### S2-AC-006 — Commit a decimal midpoint

Given direct entry is active,
when the user enters `137.5` and commits,
then the active target becomes 135 lb,
and the original 137.5 lb request is shown as secondary feedback,
and the default configuration for 135 lb is displayed.

Maps to AC-CALC-001-3, AC-UI-002-2, AC-UI-002-4, and REQ-UI-003.

### S2-AC-007 — Commit upward rounding

Given direct entry is active,
when the user enters `138` and commits,
then the active target becomes 140 lb,
and the original 138 lb request is shown as secondary feedback.

Maps to AC-CALC-001-2 and REQ-UI-003.

### S2-AC-008 — Recover from invalid input

Given the active target, feedback, and configuration have valid values,
when the user commits an empty, malformed, non-finite, or otherwise rejected draft,
then all three previous values remain unchanged,
and editing ends,
and the active target is displayed again,
and the calculator remains usable.

Maps to AC-CALC-001-7 and AC-UI-002-5.

### S2-AC-009 — Cancel editing

Given direct entry is active and the draft differs from the active target,
when the user presses Escape,
then the draft is discarded,
and the previous target, feedback, and configuration remain unchanged,
and a following blur does not commit the cancelled draft.

### S2-AC-010 — Optimize an eligible result

Given the active target is 165 lb,
and the default result `45 + 10 + 5` is displayed,
when the user activates Optimize,
then the result becomes `35 + 25`,
and the active target remains 165 lb,
and Optimize is no longer displayed.

Maps to AC-CALC-004-1 through AC-CALC-004-3 and AC-CALC-004-5.

### S2-AC-011 — Hide unavailable optimization

Given the active target has a greedy result that already uses the minimum plate count,
when the default result is displayed,
then Optimize is absent.

Maps to AC-CALC-004-4.

### S2-AC-012 — Reset optimization after target change

Given the active target is 165 lb,
and the optimized result `35 + 25` is displayed,
when the user activates `+5`,
then the active target becomes 170 lb,
and rounding feedback is cleared,
and the default configuration for 170 lb is displayed.

### S2-AC-013 — Preserve feedback during optimization

Given a requested target of 163 lb has resolved to an active target of 165 lb,
and rounding feedback identifies the 163 lb request,
when the user activates Optimize,
then the active target remains 165 lb,
and the 163 lb feedback remains visible.

### S2-AC-014 — Mobile and keyboard usability

Given a 320 CSS-pixel-wide viewport,
when the user completes the workflow using touch or keyboard,
then primary controls remain at least 44 by 44 CSS pixels,
and focus remains visible,
and no content requires horizontal scrolling,
and no action requires hover.

Maps to REQ-UX-001.

## Required automated tests

Automated component tests shall cover S2-AC-001 through S2-AC-013. Tests shall interact through visible controls, accessible roles, names, and text rather than component internals.

Tests shall additionally verify:

- Enter followed by blur performs one commit;
- exact entry and increments clear prior feedback;
- invalid input and Escape preserve prior feedback and an optimized result;
- scientific notation and trailing text are rejected;
- below-bar finite input resolves to 45 lb;
- the active total corresponds to the displayed domain result;
- existing Slice 001 tests pass unchanged.

S2-AC-014 requires automated checks where practical and a focused manual browser check at 320 CSS pixels.

## Verification

The implementation must provide and run commands equivalent to:

```text
pnpm run typecheck
pnpm test
pnpm run build
```

Verification shall establish:

- strict TypeScript checking passes;
- all Slice 001 tests remain passing;
- all Slice 002 component tests pass;
- a production build succeeds;
- the built application contains no PWA, service-worker, remote-font, backend, or deployment configuration;
- the view passes the focused 320 CSS-pixel browser check.

## Non-goals

This slice does not include:

- Plates → Total Weight mode;
- calculator mode switching;
- a graphical barbell or plate visualization;
- plate colors or denomination-based visual sizing;
- polished final visual design;
- favorites, settings, or persistence;
- a router or global state library;
- a CSS framework or component library;
- manifest or service-worker configuration;
- offline verification;
- GitHub Pages base-path configuration or deployment;
- Slice 003 or later work.

## Definition of done

- A user can complete the Target Weight → Plates workflow in a browser.
- Every state transition and acceptance scenario in this slice behaves as specified.
- React delegates every barbell calculation rule to Slice 001.
- Required automated tests pass alongside the unchanged Slice 001 suite.
- Type checking and the production build pass.
- The view passes the 320 CSS-pixel mobile and keyboard check.
- No non-goal functionality is implemented.
- The implementation plan introduces no product behavior absent from this contract.
