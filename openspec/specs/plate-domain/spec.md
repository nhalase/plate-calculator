# plate-domain Specification

## Purpose

Defines the fixed barbell equipment model and the framework-independent domain boundary shared by every calculation and view: a 45 lb bar, an unlimited set of six plate denominations, each denomination's color, and the pure TypeScript API that owns the rules.

## Requirements

### Requirement: Fixed bar
The application SHALL use a fixed 45 lb bar in every calculation, and every displayed total SHALL include the bar. (REQ-DOM-001)

#### Scenario: AC-DOM-001-1 Empty bar total
- **WHEN** no plates are loaded
- **THEN** the displayed total is 45 lb

#### Scenario: AC-DOM-001-2 Bar weight is not configurable
- **WHEN** the user looks for a way to change the bar weight
- **THEN** no setting or input exists to configure it

#### Scenario: AC-DOM-001-3 Totals include the bar
- **WHEN** any total is displayed
- **THEN** it includes the 45 lb bar

### Requirement: Supported plates
The application SHALL support unlimited quantities of 45, 35, 25, 10, 5, and 2.5 lb plates and no other denomination. (REQ-DOM-002)

#### Scenario: AC-DOM-002-1 Only supported denominations
- **WHEN** the user selects or is shown plates
- **THEN** only 45, 35, 25, 10, 5, and 2.5 lb denominations are available

#### Scenario: AC-DOM-002-2 Repeated denominations
- **WHEN** a configuration needs more than one plate of a denomination
- **THEN** multiple plates of that denomination are allowed

#### Scenario: AC-DOM-002-3 Unlimited inventory
- **WHEN** any valid calculation is performed
- **THEN** plate inventory never prevents it

### Requirement: Plate colors
The application SHALL consistently map 45 lb to red, 35 lb to blue, 25 lb to yellow, 10 lb to green, 5 lb to black, and 2.5 lb to gray, and SHALL NOT rely on color alone to communicate a denomination. (REQ-DOM-003)

#### Scenario: AC-DOM-003-1 Colors are consistent across modes
- **WHEN** a plate is displayed in either calculator mode
- **THEN** it uses its assigned denomination color

#### Scenario: AC-DOM-003-2 Labels are readable
- **WHEN** a plate's weight label is displayed on its fill
- **THEN** the label has at least 4.5:1 contrast against that fill

#### Scenario: AC-DOM-003-3 Color is not the only signal
- **WHEN** a plate is displayed
- **THEN** its denomination is also communicated by visible weight text

### Requirement: Framework-independent domain boundary
All barbell calculation rules SHALL live in `src/domain/plates.ts` and `src/domain/calculations.ts`. Domain modules MUST NOT import React, browser APIs, storage, or PWA modules. UI code SHALL consume domain functions and MUST NOT reproduce normalization, plate selection, optimization availability, totals, or ordering. (REQ-DOM-004)

#### Scenario: Domain modules are pure
- **WHEN** the domain modules' imports are inspected
- **THEN** none import React, browser APIs, storage, or PWA modules

#### Scenario: UI delegates rules
- **WHEN** a component needs a normalized target, configuration, total, or ordering
- **THEN** it obtains it from a domain function rather than its own formula or comparison

### Requirement: Domain calculation API
The domain SHALL export `BAR_WEIGHT` (45), `PLATE_WEIGHTS` (`[45, 35, 25, 10, 5, 2.5]`), the `PlateWeight` and `PlateConfiguration` types, and behavior equivalent to `normalizeTargetWeight`, `calculateSideWeight`, `calculateDefaultPlates`, `calculateOptimizedPlates`, `hasOptimization`, `calculateTotalWeight`, and `sortPlates`. (REQ-DOM-005)

#### Scenario: Unsupported plates are unrepresentable
- **WHEN** code passes a plate value outside `PLATE_WEIGHTS`
- **THEN** the public `PlateWeight` type rejects it at compile time

#### Scenario: Optimization availability
- **WHEN** `hasOptimization(total)` is evaluated
- **THEN** it is true only if the optimized result has fewer plates than the default result

### Requirement: Exact, ordered, immutable results
Every returned configuration SHALL be exact, deterministic, and ordered heaviest to lightest. Public functions MUST NOT mutate caller-owned arrays or shared constants. Calculations SHALL avoid floating-point drift, for example by using integer 2.5 lb units internally. (REQ-DOM-006)

#### Scenario: Sorting
- **WHEN** `sortPlates([10, 45, 5, 25])` is called
- **THEN** it returns `[45, 25, 10, 5]` and the input array is unchanged

#### Scenario: Round trip across a range of totals
- **WHEN** default and optimized configurations are computed for a representative range of achievable totals
- **THEN** every configuration exactly reconstructs its total

### Requirement: Invalid programmatic input is rejected
Functions that accept totals SHALL expect normalized, achievable totals at or above 45 and SHALL throw rather than return a partial configuration for invalid totals. `normalizeTargetWeight` SHALL throw a documented error for non-finite input. String parsing is a UI responsibility. (REQ-DOM-007)

#### Scenario: Non-finite normalization input
- **WHEN** `normalizeTargetWeight` receives `NaN` or `Infinity`
- **THEN** it throws a documented error

#### Scenario: Unachievable total
- **WHEN** a plate-selection function receives a total that is not achievable or is below 45
- **THEN** it throws instead of returning a configuration

### Requirement: Plate definitions own color mapping
`src/domain/plates.ts` SHALL expose immutable `PLATE_DEFINITIONS`, one `{ weight, color }` entry per `PLATE_WEIGHTS` value in the same descending order, plus a lookup equivalent to `getPlateDefinition(weight)`. UI code SHALL consume this mapping and MUST NOT infer colors from rendered position or a component-local table. (REQ-DOM-008)

#### Scenario: Complete, ordered, frozen definitions
- **WHEN** `PLATE_DEFINITIONS` is inspected
- **THEN** it has exactly one entry per supported weight, in descending order, and both the array and each entry are frozen

#### Scenario: Color mapping
- **WHEN** each definition's color is read
- **THEN** 45 is red, 35 blue, 25 yellow, 10 green, 5 black, and 2.5 gray
