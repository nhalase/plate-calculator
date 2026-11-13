# plates-to-total Specification

## Purpose

Lets the user build the load on one side of the bar plate by plate and immediately see the symmetric total, with one-tap removal and reliable focus recovery, a reset from the current total, and an optional normalization to the heaviest-first loading pattern.

## Requirements

### Requirement: Reverse panel structure
The Plates → Total Weight panel SHALL present, in order: the `Current total` card whose total is the reset control; the `Add a plate` card; and the `Plates per side` card with the shared removable visualization and a fixed `Optimize` action slot. The total card MUST NOT show helper copy or a separate visible Reset button. (REQ-UI-015)

#### Scenario: Panel order
- **WHEN** Plates → Total Weight is selected
- **THEN** the current total, add controls, and selected-plates section appear in that order

### Requirement: Reverse initial state
On first selection the reverse calculator SHALL have no selected plates and a 45 lb total, show all six add controls and the empty bar directly after `Plates per side`, and expose no removal controls, bar-weight setting, or Calculate, Apply, Submit, Clear, or separate Reset control. The current-total reset control is present and is a no-op. (REQ-UI-016)

#### Scenario: S3-AC-002 Open the empty reverse calculator
- **WHEN** the user first activates Plates → Total Weight
- **THEN** the mode changes without reload, 45 lb is the prominent total, `Plates per side` is followed directly by the empty bar, and all add controls appear in descending order

### Requirement: Manual selection
The plate mode SHALL let the user add one plate of any supported denomination to the represented side with one action. (REQ-CALC-005)

#### Scenario: AC-CALC-005-1 Add control per denomination
- **WHEN** the plate mode is shown
- **THEN** every supported denomination has an add control

#### Scenario: AC-CALC-005-2 Repeated additions
- **WHEN** the user taps an add control repeatedly
- **THEN** a plate is added for each tap

#### Scenario: AC-CALC-005-3 Immediate update
- **WHEN** a plate is added
- **THEN** the total and visualization update immediately

#### Scenario: S3-AC-003 Add every denomination
- **WHEN** the user adds one of each of 45, 35, 25, 10, 5, and 2.5 to an empty load
- **THEN** one instance of each is displayed, no other denomination is offered, and the total is 290 lb

#### Scenario: S3-AC-004 Add repeated plates
- **WHEN** the user activates `Add 45 lb plate` twice on an empty load
- **THEN** two independently removable 45 lb plates are shown, the total is 225 lb, and focus stays on `Add 45 lb plate`

### Requirement: Add controls
Add controls SHALL appear in the order 45, 35, 25, 10, 5, 2.5, show the denomination and `lb`, be named like `Add 45 lb plate`, stay enabled at any count, and never move focus away when activated. Additions SHALL use `sortPlates` and `calculateTotalWeight` and update the display and total together. (REQ-UI-017)

#### Scenario: Add control names and order
- **WHEN** the add controls are listed
- **THEN** exactly six exist, in descending order, each named `Add <weight> lb plate`

#### Scenario: Focus retained after adding
- **WHEN** an add control is activated repeatedly
- **THEN** it stays enabled and keeps keyboard focus

### Requirement: Total calculation
The application SHALL compute the total loaded weight as `45 + (sum of plates on one side × 2)`. The total SHALL be shown prominently with `lb`, update in the same interaction as every change, be announced politely, and never be directly editable. (REQ-CALC-006)

#### Scenario: AC-CALC-006-1 No plates
- **WHEN** no plates are selected
- **THEN** the total is 45 lb

#### Scenario: AC-CALC-006-2 One 45
- **WHEN** the selected plates are `[45]`
- **THEN** the total is 135 lb

#### Scenario: AC-CALC-006-3 45 and 10
- **WHEN** the selected plates are `[45, 10]`
- **THEN** the total is 155 lb

#### Scenario: AC-CALC-006-4 Two 45s
- **WHEN** the selected plates are `[45, 45]`
- **THEN** the total is 225 lb

#### Scenario: AC-CALC-006-5 Fractional plate
- **WHEN** the selected plates are `[45, 35, 2.5]`
- **THEN** the total is 210 lb

#### Scenario: S3-AC-005 Calculate required totals
- **WHEN** each example configuration above is built in the UI
- **THEN** the displayed total matches it

#### Scenario: Total announced
- **WHEN** the total changes
- **THEN** the new total is announced through a polite live region

### Requirement: Reverse-mode greedy optimization
The application SHALL derive the canonical configuration as `calculateDefaultPlates(calculateTotalWeight(selectedPlates))`. When the sorted selection differs by denomination or occurrence, it SHALL offer `Optimize`, which replaces the selection with that configuration without changing the total. (REQ-CALC-007)

#### Scenario: AC-CALC-007-1 Optimize offered
- **WHEN** the selected plates are `[35, 25]` at 165 lb
- **THEN** `Optimize` is available

#### Scenario: AC-CALC-007-2 Optimize replaces selection
- **WHEN** the user selects `Optimize` with `[35, 25]` selected
- **THEN** the selection becomes `[45, 10, 5]` and the total remains 165 lb

#### Scenario: AC-CALC-007-3 Optimize absent when already greedy
- **WHEN** the selected plates are `[45, 10, 5]` or empty
- **THEN** `Optimize` is absent

#### Scenario: AC-CALC-007-4 Comparison by denomination counts
- **WHEN** availability is determined
- **THEN** it compares denomination counts, not insertion order or plate count alone

#### Scenario: AC-CALC-007-5 Stable action slot
- **WHEN** `Optimize` is shown or hidden
- **THEN** its reserved slot keeps the same dimensions, contains no disabled or hidden focusable button, and surrounding content does not move

#### Scenario: AC-CALC-007-6 Focus after optimizing
- **WHEN** `Optimize` disappears after activation
- **THEN** focus moves to the first optimized graphical plate

#### Scenario: S3-AC-015 Optimize a manual configuration to greedy
- **WHEN** the load is `35 | 25` at 165 lb and the user activates `Optimize`
- **THEN** plates become `45 | 10 | 5`, the total stays 165 lb, `Optimize` leaves the accessibility tree, focus moves to `Remove 45 lb plate`, and the slot does not move

### Requirement: Removal and ordering
A displayed plate SHALL be a native button named like `Remove 45 lb plate` that removes exactly that one instance without confirmation. Duplicates SHALL be separate buttons, never counts. Display order SHALL always equal `sortPlates(selectedPlates)`, regardless of insertion order. (REQ-UI-004)

#### Scenario: AC-UI-004-1 Remove one instance
- **WHEN** the user taps a displayed plate
- **THEN** exactly that one instance is removed without confirmation

#### Scenario: AC-UI-004-2 Immediate update on removal
- **WHEN** a plate is removed
- **THEN** the total and visualization update immediately

#### Scenario: AC-UI-004-3 Display order
- **WHEN** the user adds `10, 45, 5, 25`
- **THEN** the plates display as `45 | 25 | 10 | 5`

#### Scenario: S3-AC-006 Sort independently of insertion order
- **WHEN** the user adds `10`, `45`, `5`, and `25` in that order
- **THEN** the removal controls display as `45 | 25 | 10 | 5`

#### Scenario: S3-AC-007 Remove exactly one duplicate
- **WHEN** two 45 lb and one 10 lb plate are selected and the user removes one 45
- **THEN** one 45 and one 10 remain and the total changes from 245 lb to 155 lb

### Requirement: Focus recovery after removal
After a plate removes itself, focus SHALL move to the plate now at the removed index, otherwise to the preceding plate, otherwise to the add control for the removed denomination. Focus MUST NOT fall to the document body. (REQ-UI-018)

#### Scenario: S3-AC-008 Recover focus after removal
- **WHEN** plates are `45 | 25 | 10` and the focused 25 is removed, and later the last remaining plate is removed
- **THEN** focus moves to the 10 lb plate, and then to that last denomination's add control

### Requirement: Reset from current total
The displayed current total SHALL be a native, focusable reset control. Two pointer clicks no more than 500 milliseconds apart SHALL clear every plate. Adding, removing, optimizing, or leaving the mode cancels a pending first click. A click with no pointer detail (keyboard or assistive technology) SHALL reset immediately. (REQ-UI-008)

#### Scenario: AC-UI-008-1 Double-tap resets
- **WHEN** `[45, 10]` is selected and the user double-taps or double-clicks the current total
- **THEN** all plates are cleared and the total changes from 155 lb to 45 lb

#### Scenario: AC-UI-008-2 Single pointer activation
- **WHEN** the user activates the current total once with a pointer
- **THEN** the selected plates and total are unchanged

#### Scenario: AC-UI-008-3 Slow second activation
- **WHEN** a second pointer activation occurs more than 500 milliseconds after the first
- **THEN** it starts a new sequence and does not reset the load

#### Scenario: AC-UI-008-4 Reset updates in one transition
- **WHEN** the load is reset
- **THEN** `Optimize` is removed if present and the visualization shows the empty bar in the same state transition, without a standalone empty-state message

#### Scenario: AC-UI-008-5 No confirmation and focus retained
- **WHEN** the load is reset
- **THEN** no confirmation is required and focus stays on the current-total reset control

#### Scenario: AC-UI-008-6 Empty load
- **WHEN** the user resets an already empty load
- **THEN** nothing changes, nothing is announced, and focus does not move

#### Scenario: AC-UI-008-7 Accessible reset purpose
- **WHEN** assistive technology reads the current-total control
- **THEN** it communicates both the current total and its reset purpose, without a separate visible Reset button

#### Scenario: Plate change cancels pending reset
- **WHEN** the user clicks the total once, then adds, removes, or optimizes, then clicks the total again within 500 milliseconds
- **THEN** no reset occurs

#### Scenario: Target state preserved
- **WHEN** the reverse load is reset
- **THEN** the target calculator's state is unchanged

#### Scenario: No double-tap zoom
- **WHEN** the user double-taps the current total on a touch device
- **THEN** the browser does not zoom, and page scrolling elsewhere is unaffected

#### Scenario: S3-AC-016 Reset plates from the current total
- **WHEN** the load is `45 | 10` at 155 lb and the total is activated twice within 500 ms by pointer, or once by Enter, Space, or assistive technology
- **THEN** plates are cleared, the total is 45 lb, the empty bar shows, `Optimize` is absent, and focus stays on the reset control
