# app-shell Specification

## Purpose

Covers the application frame shared by both calculator modes: mode switching and session state retention, the prominent current total, the non-persistence boundary, local-only interaction, and the mobile, keyboard, and accessibility baseline.

## Requirements

### Requirement: Application structure
The application SHALL present, in order: a level-one heading identifying the calculator; a persistent mode selector; and one visible calculator panel for the selected mode, inside a `main` landmark with logical heading levels. (REQ-UI-019)

#### Scenario: Landmarks and headings
- **WHEN** the application renders
- **THEN** primary content is in a `main` landmark and the heading, mode selector, and panel appear in that order

### Requirement: Mode switching
A persistent group named `Calculator mode` SHALL contain exactly two native buttons, visibly `Target → Plates` and `Plates → Total`, named `Target Weight → Plates` and `Plates → Total Weight`, exposing selection via `aria-pressed`. One activation SHALL switch modes without reload, URL change, or history entry. (REQ-UI-005)

#### Scenario: S3-AC-001 Initial mode
- **WHEN** the application is freshly rendered
- **THEN** Target Weight → Plates is visibly and programmatically selected, the target panel is visible, and the reverse panel is absent from the accessibility tree

#### Scenario: Switch modes
- **WHEN** the user activates the other mode
- **THEN** that panel shows without reload or URL change, and only the selected panel is in the accessibility tree

#### Scenario: S3-AC-012 Selecting the current mode is a no-op
- **WHEN** either calculator has non-initial state and the user activates its already-selected mode
- **THEN** the state is unchanged and focus stays on that mode control

### Requirement: Session state retention
Switching modes SHALL preserve each calculator's committed state: the active target, rounding feedback, and default or optimized selection, and the selected plate instances. Switching away from target mode while editing SHALL cancel the draft without committing it, whether valid, invalid, empty, or unchanged. (REQ-UI-020)

#### Scenario: S3-AC-009 Preserve reverse state across modes
- **WHEN** plates are `45 | 10` at 155 lb and the user switches to target mode and back
- **THEN** the plates remain `45 | 10` and the total remains 155 lb

#### Scenario: S3-AC-010 Preserve committed target state across modes
- **WHEN** a 163 lb request resolved to 165 lb shows the optimized `35 + 25` and the user switches away and back
- **THEN** the target is 165 lb, feedback still identifies 163 lb, and the optimized result remains

#### Scenario: S3-AC-011 Cancel an unfinished target draft
- **WHEN** the committed target is 155 lb, the draft reads `225`, and the user switches modes and returns
- **THEN** the target is 155 lb, editing is inactive, and nothing was calculated from 225 lb

### Requirement: No persistence
Calculator state SHALL exist only for the current page lifetime. The application MUST NOT read or write local storage, IndexedDB, or other application-data persistence; a reload or relaunch SHALL return to the initial state. (REQ-UI-021)

#### Scenario: S3-AC-014 Reload resets session state
- **WHEN** either calculator has non-initial state and the document reloads
- **THEN** Target Weight → Plates is selected and both calculators are back to their initial states

### Requirement: Current total
Both modes SHALL prominently display the current total in pounds, consistent with the visualization. (REQ-UI-007)

#### Scenario: Total matches visualization
- **WHEN** either mode displays a plate configuration
- **THEN** the prominently displayed total equals the bar plus twice the visualized side load

### Requirement: Local-only interaction
All calculations SHALL be synchronous and local, with no loading state. Calculator interactions MUST NOT send network requests; only background PWA update checks may. The app SHALL use system fonts and no remote font, stylesheet, script, image, or API at runtime. Domain errors are programming defects with no user-facing error state. (REQ-UX-002)

#### Scenario: No network during use
- **WHEN** the user switches modes, edits targets, or adds and removes plates
- **THEN** no network request is made and no loading indicator appears

### Requirement: Mobile interaction
The layout SHALL target portrait phones and work at 320 CSS pixels with no document-level horizontal scrolling, no hover-only or pointer-specific behavior, at least 44 by 44 CSS-pixel targets for primary controls, readable text without zoom, and unclipped visible focus. (REQ-UX-001)

#### Scenario: S2-AC-014 Target mode mobile and keyboard usability
- **WHEN** the target workflow is completed by touch or keyboard at 320 CSS pixels
- **THEN** controls stay at least 44 by 44, focus stays visible, nothing scrolls horizontally, and nothing needs hover

#### Scenario: S3-AC-013 Reverse mode mobile and keyboard usability
- **WHEN** the user switches modes and adds and removes plates by touch or keyboard at 320 CSS pixels
- **THEN** controls stay at least 44 by 44, focus stays visible and is not lost on removal, nothing scrolls horizontally, and nothing needs hover

#### Scenario: Text zoom
- **WHEN** browser text zoom is 200 percent at a 320 CSS-pixel layout width
- **THEN** no required control is hidden and the document does not scroll horizontally

### Requirement: Accessibility baseline
Every control SHALL be a native interactive element reachable and operable by keyboard with visible focus. No functionality SHALL depend on color, shape, position, hover, drag-and-drop, or pointer-specific gestures. Required information SHALL survive forced-colors mode and meet WCAG AA contrast. (REQ-UX-003)

#### Scenario: Keyboard-only use
- **WHEN** a keyboard-only user operates mode, target, step, add, removal, reset, `Reduce plates`, and `Optimize` controls
- **THEN** each is reachable, operable, and visibly focused

#### Scenario: Forced colors
- **WHEN** forced-colors mode overrides authored colors
- **THEN** labels, outlines, and focus indication remain perceivable
