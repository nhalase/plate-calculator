# Slice 003: Plates to Total Weight and Mode Switching

## Status

Approved and implemented

## Goal

Deliver the second usable calculator workflow and make both calculator modes accessible in one application. A user can switch between Target Weight → Plates and Plates → Total Weight, add, remove, or reset plates representing one side of the bar, see the symmetric total update immediately, and normalize a manual selection to the greedy heavy-first configuration for the same total.

This slice extends the Slice 002 browser application. It defines the complete observable behavior of mode switching and the textual Plates → Total Weight workflow without introducing the shared graphical barbell visualization.

## Dependencies

- Slice 001 is implemented and verified.
- Slice 002 is implemented and verified.
- `src/domain/plates.ts` remains the only source of the fixed bar weight, supported denominations, and plate types.
- `src/domain/calculations.ts` remains the only source of reverse-total calculation and denomination ordering.
- Slice 002 Target Weight → Plates behavior shall remain unchanged except where this contract explicitly defines mode switching and state retention.

## Source requirements

- REQ-DOM-001 and REQ-DOM-002
- REQ-CALC-005 through REQ-CALC-007
- REQ-UI-004, REQ-UI-005, REQ-UI-007, and REQ-UI-008
- REQ-UX-001

See [requirements.md](../requirements.md), [architecture.md](../architecture.md), [Slice 001](001-calculation-engine.md), and [Slice 002](002-target-to-plates-ui.md).

AC-CALC-005-3 and AC-UI-004-2 require both an immediate total update and an immediate visualization update. This slice satisfies the total and textual selected-plate behavior. Their graphical-visualization portion remains explicitly pending until the shared visualization slice.

## Scope boundary

This slice includes:

- a persistent mode selector;
- Target Weight → Plates as the initial mode;
- the existing Slice 002 target calculator without behavioral regression;
- a Plates → Total Weight mode;
- one-action add controls for every supported denomination;
- unlimited repeated additions;
- one-action removal of exactly one selected plate;
- heaviest-to-lightest selected-plate ordering;
- immediate symmetric total calculation;
- detection and one-action replacement of a non-greedy manual configuration;
- a permanently reserved Optimize action slot that prevents surrounding layout movement;
- committed state retention across mode switches;
- deterministic cancellation of unfinished target editing when switching away;
- accessible names, announcements, focus behavior, and keyboard operation;
- mobile layout behavior;
- component-level acceptance tests.

This slice does not include graphical plates, a barbell illustration, plate colors, denomination-based graphical sizing, persistence across reloads, PWA behavior, offline support, or deployment.

## Domain terminology

### Mode

Exactly one of:

```ts
type CalculatorMode = 'target-to-plates' | 'plates-to-total'
```

### Represented side

The one side of the bar whose plates the user adds or removes. The opposite side is assumed to contain an identical configuration.

### Selected plates

The plate instances currently loaded on the represented side. Duplicate denominations are distinct instances even when their visible labels are identical.

### Displayed plates

The selected plates ordered from heaviest to lightest for presentation and removal.

### Current total

The fixed 45 lb bar plus twice the sum of the selected one-side plates.

### Committed target state

The Slice 002 active target, optional requested target used for rounding feedback, and default-versus-optimized configuration selection. A temporary direct-entry draft is not committed target state.

## Required application structure

The application shall expose these elements in this order:

1. Application heading identifying the Barbell Plate Calculator.
2. Persistent mode selector containing one control for each mode.
3. One visible calculator panel corresponding to the selected mode.

When Plates → Total Weight is selected, its panel shall expose these elements in this order:

1. Prominent current-total reset control including the numeric total and `lb` unit.
2. Add-plate section containing one control for every supported denomination.
3. Selected-plates section identifying the result as plates on one side.
4. One independently removable control for each selected plate, or explicit empty-state text.
5. A fixed-size action slot containing Optimize only when the manual configuration differs from the greedy configuration for the same total.

The Current total card shall not display explanatory helper copy beneath the total or a separate visible Reset button.

The exact visual styling, capitalization, and punctuation may vary. Visible and accessible wording must communicate the same meaning.

## Initial state

On a fresh application render:

```text
Selected mode: Target Weight → Plates
Target calculator: Slice 002 initial state
Selected one-side plates: none
Reverse total: 45 lb
```

The application shall:

- visibly identify Target Weight → Plates as selected;
- show the Slice 002 target panel;
- hide the Plates → Total Weight panel from sight and the accessibility tree;
- retain an empty reverse-calculator state ready for the first mode switch;
- perform no navigation, reload, storage read, or network request.

## Observable state model

The application behaves as if it tracks:

```ts
interface CalculatorApplicationState {
  mode: CalculatorMode
  target: CommittedTargetCalculatorState
  selectedPlates: readonly PlateWeight[]
}
```

The implementation may organize React state differently, but every transition shall produce the observable behavior defined here.

`selectedPlates` shall contain only values from `PLATE_WEIGHTS`. The UI shall not accept arbitrary numeric or string denominations.

No state in this slice persists across a full page reload or a new browser session.

## Mode-selector contract

The selector shall contain exactly two choices:

- `Target Weight → Plates`;
- `Plates → Total Weight`.

The selector shall:

- remain visible in both modes;
- identify the selected choice visually;
- expose the selected state programmatically;
- use native buttons, tabs, or radio controls with equivalent keyboard and assistive-technology behavior;
- provide at least a 44 by 44 CSS-pixel target for each choice;
- switch modes with one activation;
- not require a confirmation, Apply, Calculate, or Submit action.

Selecting the already-selected mode is a no-op. It shall not reset either calculator or move focus away from the activated mode control.

Switching modes shall not change the document URL, navigate browser history, or reload the application.

## Mode-switch state retention

### Switching away from Target Weight → Plates

If direct entry is not active, switching modes preserves the complete committed target state, including:

- active target;
- rounding feedback and its requested value, if any;
- whether the default or optimized configuration is displayed.

If direct entry is active, activating Plates → Total Weight shall:

1. cancel the draft without committing it;
2. restore the last committed active target;
3. preserve the last committed rounding feedback and configuration selection;
4. end editing;
5. switch modes.

The cancellation rule applies whether the draft is valid, invalid, empty, or unchanged.

### Switching away from Plates → Total Weight

Switching to Target Weight → Plates preserves the complete selected-plate collection. Returning to Plates → Total Weight shall restore the same plate instances, displayed order, and derived total.

### Reload boundary

Reloading the document starts a new application state and returns to the initial state. Cross-reload persistence is outside this slice.

## Reverse-calculator initial state

On the first selection of Plates → Total Weight:

```text
Selected plates: none
Displayed plates: none
Current total: 45 lb
```

The panel shall:

- display `45 lb` prominently;
- label the plate card `Plates per side` and place the empty visualization directly after that title without a helper sentence or standalone empty-state message;
- display all six add controls;
- expose no bar-weight setting;
- expose no removal controls;
- expose no separate Calculate, Apply, Submit, Clear, or Reset control; the empty current-total reset control remains available as a no-op.

## Add controls

The add controls shall be displayed in this descending denomination order:

```text
45, 35, 25, 10, 5, 2.5
```

Each control shall:

- visibly include its denomination and `lb` unit;
- have an accessible name equivalent to `Add 45 lb plate` for its denomination;
- add exactly one instance of its denomination with one activation;
- remain enabled regardless of how many matching plates are selected;
- update the selected-plate display and current total immediately;
- retain keyboard focus after activation so repeated activation remains efficient.

There is no inventory limit and no confirmation step.

## Adding a plate

When denomination `P` is added, the application shall:

1. append one `P` instance to the selected collection;
2. obtain the displayed ordering from the Slice 001 `sortPlates` domain function;
3. obtain the current total from the Slice 001 `calculateTotalWeight` domain function;
4. render the new total and selected-plate controls in the same update;
5. announce the changed total through an appropriate polite live region or native output behavior.

The UI shall not reproduce the sorting comparison or the total formula.

## Selected-plate display

When plates are selected, the panel shall render one separate native button for every selected plate instance.

The controls shall:

- appear in descending weight order;
- visibly include the plate weight and `lb` unit;
- have accessible names equivalent to `Remove 45 lb plate` for their denomination;
- communicate removal without relying on color, position, or an unlabeled icon;
- wrap within the panel rather than causing horizontal document scrolling.

Duplicate plates shall render as duplicate controls. Counts-only output such as `45 × 2` is insufficient for this slice because each displayed instance must be independently removable.

This textual control sequence is not the graphical barbell visualization required by REQ-UI-006.

## Removing a plate

Activating a selected-plate control shall remove exactly that rendered instance without confirmation.

The application shall then:

1. leave every other selected instance unchanged;
2. obtain the new displayed ordering from `sortPlates`;
3. obtain the new total from `calculateTotalWeight`;
4. update the display and total immediately;
5. announce the changed total.

For equal denominations, the rendered instances are observably interchangeable. Removing any one matching instance reduces that denomination's count by exactly one.

After removal, keyboard focus shall move deterministically:

1. to the selected-plate control now occupying the removed control's index, if one exists;
2. otherwise to the preceding selected-plate control, if one exists;
3. otherwise to the add control for the denomination just removed.

This prevents focus from falling to the document body when the activated control is removed.

## Ordering contract

Insertion order shall never determine displayed order.

After every addition and removal, displayed plates shall equal:

```ts
sortPlates(selectedPlates)
```

For example, adding `10`, then `45`, then `5`, then `25` shall display four separate removal controls in this order:

```text
45 | 25 | 10 | 5
```

The application may store the selected collection in either insertion order or display order. Only the observable displayed order and correct removal behavior are required.

## Total contract

The current total shall always equal:

```ts
calculateTotalWeight(selectedPlates)
```

The total shall:

- include the fixed 45 lb bar;
- assume the selected one-side plates are mirrored on the opposite side;
- be displayed prominently with the `lb` unit;
- update in the same interaction as every addition or removal;
- never be directly editable;
- never require a separate calculation action.

Required examples:

| Selected plates on one side | Current total |
| --- | ---: |
| none | 45 lb |
| `45` | 135 lb |
| `45, 10` | 155 lb |
| `45, 45` | 225 lb |
| `45, 35, 2.5` | 210 lb |

## Current-total reset contract

The prominent current-total value in Plates → Total Weight mode shall be the reset target. The target includes the displayed number and its associated `lb` unit and shall retain the established dominant-number presentation.

For primary pointer input, a reset gesture is exactly two activations of that target no more than 500 milliseconds apart. The first activation shall not change state. If more than 500 milliseconds elapse, the pending activation expires; the next activation begins a new sequence. Activations of any other control cancel a pending sequence. The gesture shall work for touch taps and mouse clicks and shall not trigger browser double-tap zoom.

Because reset cannot depend on a pointer-specific gesture, the current-total target shall be a native, focusable control. One semantic activation from Enter, Space, or assistive technology shall reset immediately. Its accessible name shall communicate the current total and the reset action. Total changes shall continue to be announced politely.

Reset shall occur in one state transition and shall:

1. replace the selected-plate collection with an empty collection;
2. display the empty bar directly below `Plates per side` without a standalone empty-state message;
3. derive and display the 45 lb empty-bar total through the existing Slice 001 calculation;
4. update the shared barbell visualization to the empty bar;
5. remove Optimize from sight and the accessibility tree while preserving its fixed action slot;
6. preserve the independent Target → Plates state;
7. require no confirmation;
8. leave focus on the current-total reset control.

Resetting an already empty load is a no-op. It shall not announce a false change, move focus, alter the target calculator, or move surrounding content.

## Reverse-mode optimization contract

The reverse calculator shall derive the canonical configuration as:

```ts
calculateDefaultPlates(calculateTotalWeight(selectedPlates))
```

Optimize shall be visible only when the selected, already-sorted plate array differs from that canonical array by denomination or occurrence. Insertion order is irrelevant. Empty and already-greedy configurations shall not expose Optimize.

Activating Optimize shall:

1. replace the selected plates with the derived greedy configuration;
2. preserve the current total exactly;
3. update textual and graphical selections in the same render;
4. remove Optimize from sight and the accessibility tree;
5. move focus to the first graphical removal button in the optimized configuration;
6. require no confirmation.

The selected-plates section shall always contain a fixed-size configuration-action slot. When Optimize is unavailable, the slot remains visually empty and contains no disabled, hidden, or otherwise focusable button. The slot's dimensions shall be unchanged as Optimize appears or disappears, so content outside the slot does not move.

## Loading and error states

All interactions in this slice are synchronous and local. No loading indicator is required.

Valid UI interactions shall not send network requests. Domain errors are programming defects because the UI supplies only `PlateWeight` values from `PLATE_WEIGHTS`; no user-facing domain-error state is required.

## Accessibility contract

- The mode selector shall have an accessible group label equivalent to `Calculator mode`.
- Each mode control shall expose its selected or pressed state programmatically.
- Only the selected mode's panel shall be available in the accessibility tree.
- Add and removal controls shall use native interactive elements.
- Every add and removal control shall include the denomination and action in its accessible name.
- The current total shall have a visible label and be announced politely when it changes.
- The current-total value shall be a native control whose accessible name communicates both the current total and the reset action.
- Keyboard and assistive-technology activation shall reset once without requiring a simulated pointer double-tap.
- Visible text shall explain the one-sided symmetric-loading assumption.
- Keyboard focus shall remain visible.
- Focus shall not be lost after a selected plate removes itself.
- Optimize shall be a native button, and focus shall move to the first resulting graphical removal button after it replaces the manual configuration.
- All functionality shall be operable without color, graphical shape, hover, drag-and-drop, or pointer-specific gestures.

## Mobile-layout contract

At a viewport width of 320 CSS pixels:

- neither the mode selector nor either calculator panel shall cause horizontal document scrolling;
- mode choices may wrap or stack while remaining one-action controls;
- add controls may wrap or use a compact grid;
- selected-plate controls shall wrap within their container;
- primary interactive controls shall have a target size of at least 44 by 44 CSS pixels;
- current total, denominations, and units shall remain readable without zooming;
- the current-total reset control shall provide at least a 44 by 44 CSS-pixel target and shall suppress double-tap zoom without suppressing page scrolling elsewhere;
- no required information shall be available only on hover.

## Acceptance scenarios

### S3-AC-001 — Initial mode

Given the application is freshly rendered,
then Target Weight → Plates is visibly and programmatically selected,
and the Slice 002 initial target panel is visible,
and the reverse panel is not available in the accessibility tree.

Maps to REQ-UI-005.

### S3-AC-002 — Open the empty reverse calculator

Given the initial application state,
when the user activates Plates → Total Weight,
then the mode changes without a reload,
and `45 lb` is the prominent current total,
and `Plates per side` is followed directly by the empty bar without helper or empty-state text,
and all supported add controls are available in descending order.

Maps to REQ-DOM-001, REQ-DOM-002, REQ-CALC-006, and REQ-UI-005.

### S3-AC-003 — Add every denomination

Given the reverse calculator has no selected plates,
when the user activates the add controls for `45`, `35`, `25`, `10`, `5`, and `2.5`,
then one instance of every denomination is displayed,
and no unsupported denomination is available,
and the current total is `290 lb`.

Maps to REQ-DOM-002, REQ-CALC-005, and REQ-CALC-006.

### S3-AC-004 — Add repeated plates

Given the reverse calculator has no selected plates,
when the user activates Add 45 lb plate twice,
then two independently removable 45 lb plate controls are displayed,
and the current total is `225 lb`,
and focus remains on Add 45 lb plate after each addition.

Maps to REQ-DOM-002, REQ-CALC-005, and REQ-CALC-006.

### S3-AC-005 — Calculate required totals

Given the reverse calculator is selected,
when each required example configuration is constructed,
then the displayed total matches the total table in this contract.

Maps to REQ-CALC-006.

### S3-AC-006 — Sort independently of insertion order

Given the reverse calculator has no selected plates,
when the user adds `10`, `45`, `5`, and `25` in that order,
then the selected-plate controls are displayed as `45 | 25 | 10 | 5`.

Maps to REQ-UI-004.

### S3-AC-007 — Remove exactly one duplicate

Given two 45 lb plates and one 10 lb plate are selected,
when the user removes one displayed 45 lb plate,
then exactly one 45 lb plate and one 10 lb plate remain,
and the total changes from `245 lb` to `155 lb`.

Maps to REQ-UI-004 and REQ-CALC-006.

### S3-AC-008 — Recover focus after removal

Given displayed plates are `45 | 25 | 10`,
when the focused 25 lb plate is removed,
then focus moves to the 10 lb removal control,
and when the last remaining selected plate is removed,
then focus moves to that denomination's add control.

Maps to REQ-UI-004 and REQ-UX-001.

### S3-AC-009 — Preserve reverse state across modes

Given selected plates are `45 | 10` and the total is 155 lb,
when the user switches to Target Weight → Plates and back,
then the selected plates remain `45 | 10`,
and the reverse total remains 155 lb.

Maps to REQ-UI-005.

### S3-AC-010 — Preserve committed target state across modes

Given a requested target of 163 lb resolved to 165 lb,
and the optimized result `35 + 25` is displayed,
when the user switches to Plates → Total Weight and back,
then the active target remains 165 lb,
and feedback still identifies the 163 lb request,
and the optimized result remains displayed.

Maps to REQ-UI-005 and protects Slice 002 behavior.

### S3-AC-011 — Cancel an unfinished target draft

Given the committed active target is 155 lb,
and direct entry contains an uncommitted draft of `225`,
when the user activates Plates → Total Weight and later returns,
then the active target remains 155 lb,
and target editing is inactive,
and no behavior was calculated from 225 lb.

Maps to REQ-UI-005 and protects Slice 002 input behavior.

### S3-AC-012 — Selecting the current mode is a no-op

Given either calculator contains non-initial committed state,
when the user activates its already-selected mode control,
then that state remains unchanged,
and focus remains on the activated mode control.

Maps to REQ-UI-005.

### S3-AC-013 — Mobile and keyboard usability

Given a 320 CSS-pixel-wide viewport,
when the user switches modes and completes the add/remove workflow using keyboard or touch,
then primary controls remain at least 44 by 44 CSS pixels,
and focus remains visible,
and dynamic removal does not lose focus,
and no content requires horizontal document scrolling,
and no action requires hover.

Maps to REQ-UX-001.

### S3-AC-014 — Reload resets session state

Given either calculator has non-initial state,
when the document is reloaded,
then Target Weight → Plates becomes selected,
and both calculators return to their initial states.

Protects the explicit non-persistence boundary.

### S3-AC-015 — Optimize a manual configuration to greedy

Given the reverse calculator contains `35 | 25`,
and the current total is 165 lb,
then Optimize is visible in the permanently reserved action slot,
when the user activates Optimize,
then the selected plates become `45 | 10 | 5`,
and the total remains 165 lb,
and Optimize is absent from the accessibility tree,
and focus moves to Remove 45 lb plate,
and the action slot and surrounding content retain their positions.

Maps to REQ-CALC-003 and REQ-CALC-007.

### S3-AC-016 — Reset plates from the current total

Given the reverse calculator contains `45 | 10`,
and the current total is 155 lb,
when a pointer activates the current-total value twice within 500 milliseconds,
then no state changes after the first activation,
and after the second activation the selected plates are empty,
and the current total is 45 lb,
and the empty-bar visualization is displayed directly below `Plates per side` without standalone empty-state text,
and Optimize is absent,
and focus remains on the current-total reset control.

Given the same loaded state,
when the focused current-total reset control receives one Enter, Space, or assistive-technology activation,
then the same reset result occurs immediately.

Maps to REQ-UI-008, REQ-CALC-006, and REQ-UX-001.

## Required automated tests

Automated component tests shall cover S3-AC-001 through S3-AC-012 and S3-AC-014 through S3-AC-016. Tests shall interact through visible controls, accessible roles, names, states, and text rather than component internals.

Tests shall additionally verify:

- exactly the six `PLATE_WEIGHTS` denominations have add controls;
- repeated activation does not disable or move focus from an add control;
- every selected plate instance is a separate removal control;
- total updates use the existing domain result for additions and removals;
- displayed ordering matches the existing `sortPlates` result;
- Optimize availability distinguishes non-greedy from greedy-equivalent selections;
- reverse optimization preserves total, recovers focus, and retains the same action-slot element;
- one pointer activation does not reset, two timely pointer activations do reset, and an expired pair does not reset;
- keyboard and assistive-technology activation reset without requiring pointer timing;
- reset clears duplicates, removes Optimize, preserves target-mode state, retains focus, and is a no-op when already empty;
- switching modes does not change the URL;
- the hidden panel is absent from the accessibility tree;
- Slice 001 and Slice 002 tests pass unchanged.

S3-AC-013 requires automated structural checks where practical and a focused manual browser check at 320 CSS pixels.

## Verification

The implementation must provide and run commands equivalent to:

```text
pnpm run typecheck
pnpm test
pnpm run build
```

Verification shall establish:

- strict TypeScript checking passes;
- all Slice 001 and Slice 002 tests remain passing;
- all Slice 003 component tests pass;
- a production build succeeds;
- switching, adding, and removing make no network requests;
- the built application still contains no PWA, service-worker, backend, persistence, or deployment configuration;
- both modes pass the focused 320 CSS-pixel browser check.

## Deferred requirement coverage

This slice does not claim completion of:

- the visualization clause of AC-CALC-005-3;
- the visualization clause of AC-UI-004-2;
- REQ-DOM-003 plate colors;
- REQ-UI-006 graphical barbell visualization.

Those behaviors require the later shared visualization slice to apply consistently to both calculator modes.

## Non-goals

This slice does not include:

- a graphical barbell or graphical plate visualization;
- denomination colors or graphical relative sizing;
- drag-and-drop or plate reordering;
- a separate visible Clear or Reset control outside the current-total value;
- configurable bars, plate sets, inventory, or units;
- asymmetric loading;
- URL routing or deep links for modes;
- persistence, favorites, settings, or storage adapters;
- a router or global state library;
- a CSS framework or component library;
- manifest or service-worker configuration;
- offline verification;
- GitHub Pages base-path configuration or deployment;
- any later slice implementation.

## Definition of done

- A user can access and complete both textual calculator workflows in one browser application.
- Mode selection and every state transition behave as specified.
- Each calculator retains its committed session state across mode switches.
- The reverse calculator delegates totals and ordering to Slice 001.
- Required automated tests pass alongside the unchanged Slice 001 and Slice 002 suites.
- Type checking and the production build pass.
- Both modes pass the 320 CSS-pixel mobile and keyboard check.
- Deferred requirement coverage remains explicit and no non-goal functionality is implemented.
- A later implementation plan introduces no product behavior absent from this contract.
