# target-to-plates Specification

## Purpose

Turns a requested total barbell weight into the plates to load on each side: resolving the target to an achievable total, choosing the default heaviest-first configuration, offering an optional fewer-plates alternative, and providing fast, forgiving target input.

## Requirements

### Requirement: Resolve target
The application SHALL resolve a requested target to the nearest achievable total. Achievable totals are 45 lb and every 5 lb increment above it. A midpoint tie SHALL resolve downward, and any finite target below 45 SHALL resolve to 45. Implementations MUST NOT rely on a default rounding primitive without making the tie-down rule explicit. (REQ-CALC-001)

#### Scenario: AC-CALC-001-1 Round down to nearest
- **WHEN** the requested target is 137
- **THEN** it resolves to 135

#### Scenario: AC-CALC-001-2 Round up to nearest
- **WHEN** the requested target is 138
- **THEN** it resolves to 140

#### Scenario: AC-CALC-001-3 Midpoint resolves downward
- **WHEN** the requested target is 137.5
- **THEN** it resolves to 135

#### Scenario: AC-CALC-001-4 Second midpoint resolves downward
- **WHEN** the requested target is 142.5
- **THEN** it resolves to 140

#### Scenario: AC-CALC-001-5 Below the bar
- **WHEN** the requested target is 42
- **THEN** it resolves to 45

#### Scenario: AC-CALC-001-6 Achievable value unchanged
- **WHEN** the requested target is already achievable, such as 45 or 155
- **THEN** it remains unchanged

#### Scenario: AC-CALC-001-7 Invalid input rejected
- **WHEN** the input is empty, non-numeric, or non-finite
- **THEN** it is rejected and the last valid target is kept

### Requirement: Derive side weight
For a resolved total `T`, the application SHALL compute the required load on one side as `(T − 45) / 2`. (REQ-CALC-002)

#### Scenario: AC-CALC-002-1 Empty bar
- **WHEN** the resolved total is 45 lb
- **THEN** 0 lb is required per side

#### Scenario: AC-CALC-002-2 One plate per side
- **WHEN** the resolved total is 135 lb
- **THEN** 45 lb is required per side

#### Scenario: AC-CALC-002-3 Mixed plates
- **WHEN** the resolved total is 155 lb
- **THEN** 55 lb is required per side

#### Scenario: AC-CALC-002-4 Two plates per side
- **WHEN** the resolved total is 225 lb
- **THEN** 90 lb is required per side

### Requirement: Default greedy configuration
The default configuration SHALL use a greedy, heaviest-first algorithm over `[45, 35, 25, 10, 5, 2.5]`, adding as many plates of each denomination as fit before considering the next. Results SHALL be ordered heaviest to lightest. The default MUST remain greedy even where a minimum-count configuration exists. (REQ-CALC-003)

#### Scenario: Empty bar default
- **WHEN** the total is 45 lb
- **THEN** the default configuration is empty

#### Scenario: AC-CALC-003-1 55 lb per side
- **WHEN** 55 lb is required per side
- **THEN** the default configuration is `45 + 10`

#### Scenario: AC-CALC-003-2 60 lb per side
- **WHEN** 60 lb is required per side (165 lb total)
- **THEN** the default configuration is `45 + 10 + 5`, not the minimum-count `35 + 25`

#### Scenario: AC-CALC-003-3 70 lb per side
- **WHEN** 70 lb is required per side
- **THEN** the default configuration is `45 + 25`

#### Scenario: AC-CALC-003-4 80 lb per side
- **WHEN** 80 lb is required per side
- **THEN** the default configuration is `45 + 35`

#### Scenario: AC-CALC-003-5 90 lb per side
- **WHEN** 90 lb is required per side
- **THEN** the default configuration is `45 + 45`

#### Scenario: AC-CALC-003-6 Exact sum
- **WHEN** a default configuration is returned
- **THEN** the sum of its plates exactly equals the required side weight

### Requirement: Optional plate reduction
The application SHALL determine a valid configuration with the minimum number of plates. Among equally minimal ones it SHALL prefer more 45 lb plates, then more 35, 25, 10, 5, and 2.5 lb plates at the first difference. When this uses fewer plates than the default, target mode SHALL offer a `Reduce plates` action. (REQ-CALC-004)

#### Scenario: AC-CALC-004-1 Minimum configuration differs from default
- **WHEN** 60 lb is required per side
- **THEN** the default is `45 + 10 + 5` and the minimum-plate configuration is `35 + 25`

#### Scenario: AC-CALC-004-2 Reduce plates offered
- **WHEN** the side load is 60 lb and the default configuration is displayed
- **THEN** the `Reduce plates` action is available

#### Scenario: AC-CALC-004-3 Reduce plates preserves total
- **WHEN** the user selects `Reduce plates`
- **THEN** the displayed configuration is replaced and the total weight is unchanged

#### Scenario: AC-CALC-004-4 Reduce plates absent when already minimal
- **WHEN** the default configuration already has the minimum plate count
- **THEN** the `Reduce plates` action is absent

#### Scenario: AC-CALC-004-5 Reduced configuration ordering
- **WHEN** a minimum-plate configuration is displayed
- **THEN** its plates are ordered heaviest to lightest

#### Scenario: AC-CALC-004-6 Stable action slot
- **WHEN** `Reduce plates` becomes available or unavailable
- **THEN** a permanently reserved button-sized area keeps surrounding content from moving, and an unavailable button is absent from the accessibility tree

#### Scenario: Deterministic tie-breaking
- **WHEN** several minimum-count configurations reach the same side load
- **THEN** the one with more heavy plates at the first differing denomination is returned

### Requirement: Reduce plates behavior
`Reduce plates` SHALL be visible only when optimization is available and the default configuration is displayed. Activating it SHALL show the optimized configuration, keep the active target and rounding feedback unchanged, hide the action, and require no confirmation. No control to return to the default for the same target is required. (REQ-UI-009)

#### Scenario: S2-AC-010 Reduce an eligible result
- **WHEN** the active target is 165 lb with `[45, 10, 5]` displayed and the user activates `Reduce plates`
- **THEN** the visualization shows `[35, 25]`, the target remains 165 lb, `Reduce plates` is gone, and the action slot keeps its position and size

#### Scenario: S2-AC-011 Hide unavailable plate reduction
- **WHEN** the default result already uses the minimum plate count
- **THEN** `Reduce plates` is absent and the slot stays reserved without exposing an unavailable control to assistive technology

#### Scenario: S2-AC-013 Preserve feedback during optimization
- **WHEN** a 163 lb request resolved to 165 lb and the user activates `Reduce plates`
- **THEN** the target remains 165 lb and the 163 lb feedback remains visible

### Requirement: Target view structure
The target view SHALL present, in order: the target section visibly labeled `Target weight (tap to change)`; the prominent active target with its `lb` unit, replaced in place by the input while editing; optional rounding feedback; the `−5` and `+5` controls; the `Plates per side` section with the shared visualization; and the `Reduce plates` action slot. (REQ-UI-010)

#### Scenario: Section label and input name
- **WHEN** the target view is shown
- **THEN** the section label is exactly `Target weight (tap to change)` and the direct-entry input's accessible name is `Target weight`

### Requirement: Target initial state
On first render the active target SHALL be 45 lb with the default (empty) configuration, no rounding feedback, no editing, and no `Reduce plates` action. (REQ-UI-011)

#### Scenario: S2-AC-001 Initial empty bar
- **WHEN** the view has just loaded
- **THEN** the section reads `Target weight (tap to change)`, the target is 45 lb, nothing but the empty bar follows `Plates per side`, `Reduce plates` is absent, and no bar-weight control exists

### Requirement: Increment controls
The target view SHALL provide `−5` and `+5` controls that update the calculation immediately. Each activation SHALL clear rounding feedback and show the default configuration for the resulting target, including when `−5` leaves the target at 45 lb. (REQ-UI-001)

#### Scenario: AC-UI-001-1 Increase target
- **WHEN** the user activates `+5`
- **THEN** the active target increases by 5 lb

#### Scenario: AC-UI-001-2 Decrease target with floor
- **WHEN** the user activates `−5`
- **THEN** the active target decreases by 5 lb but never below 45 lb

#### Scenario: AC-UI-001-3 No submit step
- **WHEN** the target changes through the increment controls
- **THEN** results update without any Calculate or Submit action

#### Scenario: S2-AC-002 Increment without submission
- **WHEN** the active target is 45 lb and the user activates `+5`
- **THEN** the target becomes 50 lb and the configuration updates immediately with no submit action

#### Scenario: S2-AC-003 Decrement floor
- **WHEN** the user activates `−5` at 45 lb, and again at 50 lb
- **THEN** the target stays 45 lb in the first case and becomes 45 lb in the second

#### Scenario: S2-AC-012 Reset optimization after target change
- **WHEN** 165 lb shows the optimized `[35, 25]` and the user activates `+5`
- **THEN** the target becomes 170 lb, feedback is cleared, and the 170 lb default configuration is shown

### Requirement: Direct numeric entry
The active target SHALL be a native button named `Edit target weight`. Activating it SHALL replace it with one input named `Target weight`, prefilled with the target without `lb`, focused immediately, and selected where supported. The input SHALL request a decimal keypad, disable autocomplete, show `lb`, and be keyboard usable. (REQ-UI-002)

#### Scenario: AC-UI-002-1 Decimal keypad
- **WHEN** direct entry is activated
- **THEN** the control uses `inputmode="decimal"` or equivalent behavior

#### Scenario: AC-UI-002-2 Decimal values accepted
- **WHEN** the user enters `137.5`
- **THEN** the value is accepted for resolution

#### Scenario: AC-UI-002-3 Easy replacement
- **WHEN** direct entry is activated
- **THEN** the input receives focus immediately and the existing value is selected

#### Scenario: AC-UI-002-4 Commit resolves target
- **WHEN** the user commits valid input
- **THEN** target resolution is applied immediately

#### Scenario: AC-UI-002-5 Invalid input recovery
- **WHEN** the user commits invalid or empty input
- **THEN** the last valid target is kept and the calculator remains usable

#### Scenario: AC-UI-002-6 No calculate button
- **WHEN** the user enters a target directly
- **THEN** no separate Calculate button is required

#### Scenario: S2-AC-004 Begin editing
- **WHEN** the target is 155 lb and the user activates `Edit target weight`
- **THEN** a focused `Target weight` input shows `155`, declares decimal input mode, and has its contents selected where supported

### Requirement: Direct-entry grammar
After trimming whitespace, the whole draft SHALL match `^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$` and parse to a finite number. The UI MUST NOT accept a valid numeric prefix followed by other characters. Negative and other below-bar finite values are valid requests that resolve to 45 lb. (REQ-UI-012)

#### Scenario: Accepted drafts
- **WHEN** the draft is `155`, `137.5`, ` 155 `, `+155`, `-10`, `.5`, or `155.`
- **THEN** it is accepted

#### Scenario: Rejected drafts
- **WHEN** the draft is empty, whitespace, `.`, `+`, `-`, `13..5`, `135lb`, `135 lbs`, `135abc`, `1e2`, `0x90`, `NaN`, or `Infinity`
- **THEN** it is rejected

#### Scenario: Negative request
- **WHEN** the user commits `-10`
- **THEN** the target becomes 45 lb with feedback reading `Nearest loadable weight to -10 lb`

### Requirement: Commit and cancel direct entry
Enter or blur SHALL commit the draft exactly once, except that blur to the Plates → Total mode button cancels. A valid commit SHALL set the normalized target, keep the request for feedback only if it differs, reset to default, and end editing. Invalid input or Escape SHALL discard the draft and keep prior state. (REQ-UI-013)

#### Scenario: S2-AC-005 Commit an achievable target
- **WHEN** the user enters `155` and commits
- **THEN** the target becomes 155 lb with configuration `[45, 10]`, no feedback, and no submit action

#### Scenario: S2-AC-006 Commit a decimal midpoint
- **WHEN** the user enters `137.5` and commits
- **THEN** the target becomes 135 lb, feedback identifies the 137.5 lb request, and the 135 lb default is shown

#### Scenario: S2-AC-007 Commit upward rounding
- **WHEN** the user enters `138` and commits
- **THEN** the target becomes 140 lb and feedback identifies the 138 lb request

#### Scenario: S2-AC-008 Recover from invalid input
- **WHEN** the user commits an empty, malformed, non-finite, or otherwise rejected draft
- **THEN** the previous target, feedback, and configuration are unchanged, editing ends, and the target is displayed again

#### Scenario: S2-AC-009 Cancel editing
- **WHEN** the draft differs from the target and the user presses Escape
- **THEN** the draft is discarded, target, feedback, and configuration are unchanged, and a following blur does not commit it

#### Scenario: Single commit on Enter then blur
- **WHEN** the user presses Enter and the input then blurs
- **THEN** exactly one commit occurs and newly created feedback is not cleared

#### Scenario: Next edit starts from the active target
- **WHEN** editing ends for any reason and the user starts editing again
- **THEN** the draft equals the current active target

### Requirement: Rounding feedback
When a valid request differs numerically from the resolved target, the resolved value SHALL remain primary and secondary text `Nearest loadable weight to <request> lb` SHALL appear below it, where `<request>` is the parsed number. It SHALL be plain text, not an alert or live region. (REQ-UI-003)

#### Scenario: Adjusted target
- **WHEN** the user commits 137 lb
- **THEN** 135 lb is primary and the text `Nearest loadable weight to 137 lb` appears below it

#### Scenario: Feedback clears
- **WHEN** the user activates `+5` or `−5`, or commits an already-achievable value
- **THEN** rounding feedback is cleared

#### Scenario: Feedback persists
- **WHEN** the user begins editing, changes a draft, presses Escape, commits invalid input, or activates `Reduce plates`
- **THEN** existing rounding feedback is unchanged

### Requirement: Target accessibility
The target view SHALL use native buttons named `Edit target weight`, `Decrease target by 5 pounds`, `Increase target by 5 pounds`, and `Reduce plates`, and an input named `Target weight`. The `lb` unit SHALL be associated with target values. (REQ-UI-014)

#### Scenario: Accessible names
- **WHEN** assistive technology lists the target view's controls
- **THEN** they expose exactly these names and are all keyboard operable
