# barbell-visualization Specification

## Purpose

Defines the shared one-sided barbell drawing used by both modes: a fixed-bar notch, plates loaded heavy-to-light from left to right with deterministic color, size, and centered labels, read-only or removable behavior per mode, bounded internal overflow, and a complete accessible text equivalent.

## Requirements

### Requirement: Barbell visualization
Both modes SHALL show one side of a simplified barbell. Each plate SHALL display its weight, use its assigned color, and be sized so heavier denominations appear larger. (REQ-UI-006)

#### Scenario: Plates are labeled, colored, and sized
- **WHEN** plates are shown in either mode
- **THEN** each displays its weight, uses its denomination color, and heavier denominations appear taller

#### Scenario: AC-UI-006-1 Nothing between title and bar
- **WHEN** the plate card is shown in either mode
- **THEN** the only visible text above the bar is the `Plates per side` title, followed directly by the visualization, with no helper sentence, denomination sequence, or empty-result message

#### Scenario: AC-UI-006-2 Plate labels retained
- **WHEN** target mode shows its configuration
- **THEN** plate-weight labels remain inside the visualization and in its accessible description

#### Scenario: S4-AC-016 No redundant target sequence
- **WHEN** target mode shows any empty, default, or reduced configuration
- **THEN** `Plates per side` is followed directly by the visualization, each plate shows its weight, and the accessible description covers the fixed bar and the configuration

### Requirement: Shared controlled rendering boundary
Both modes SHALL use one shared visualization that receives an already domain-ordered configuration and renders exactly one plate per entry. It MUST NOT sort, mutate, normalize, total, persist, or fetch anything. Read-only mode exposes no actions; removable mode renders one native removal button per instance. (REQ-VIS-001)

#### Scenario: One plate per entry
- **WHEN** the visualization receives a configuration with duplicates
- **THEN** it renders exactly one plate per entry in the supplied order

#### Scenario: S4-AC-013 Visualization state survives mode switching
- **WHEN** target mode shows an optimized configuration, reverse mode has plates, and the user switches repeatedly
- **THEN** each visualization matches its own calculator's preserved state

### Requirement: Assembly structure
The assembly SHALL render, left to right: the fixed-bar notch, plates in the supplied order flush against the notch with no visible collar, shaft, or gap, then the remaining sleeve. It SHALL be anchored left and grow rightward. The read-only viewport SHALL scroll back to the start whenever its plates change. (REQ-VIS-002)

#### Scenario: S5-AC-007 Left-to-right plate loading
- **WHEN** the configuration is `[45, 10, 5]`
- **THEN** the order is notch, red 45, green 10, black 5, sleeve, with no gap after the notch, anchored left

#### Scenario: Empty assembly
- **WHEN** no plates are loaded
- **THEN** the notch and a sleeve extending right are still shown

### Requirement: Fixed-bar notch
A neutral gray, non-interactive 52 by 52 CSS-pixel notch SHALL represent the fixed 45 lb bar in both modes, including empty states. It SHALL sit on the sleeve centerline, be shorter than the 2.5 lb plate and taller than the sleeve, always show `45` above `LB BAR`, and stay distinct from the red 45 lb plate. (REQ-VIS-003)

#### Scenario: S5-AC-006 Fixed-bar notch
- **WHEN** either visualization is displayed
- **THEN** a neutral notch at the far left on the sleeve centerline shows `45` over `LB BAR`, the accessible name identifies the fixed 45 lb bar, and the notch is not a plate or control

#### Scenario: Notch is not configuration
- **WHEN** totals, sorting, optimization, overflow, or focus recovery are computed
- **THEN** the notch is never treated as a plate

### Requirement: Deterministic plate size
Plate heights SHALL be fixed at 136, 124, 112, 100, 88, and 76 CSS pixels for 45, 35, 25, 10, 5, and 2.5 lb at every viewport width. Every plate SHALL be 44 CSS pixels wide in both modes and centered on the sleeve axis. (REQ-VIS-004)

#### Scenario: S4-AC-010 Complete color and size mapping
- **WHEN** one plate of every denomination is shown
- **THEN** the sequence is `45 | 35 | 25 | 10 | 5 | 2.5`, colored red, blue, yellow, green, black, gray, each strictly taller than the next, with compliant label contrast

#### Scenario: Removable plate size
- **WHEN** a plate is a removal button
- **THEN** it is at least 44 by 44 CSS pixels

### Requirement: Plate labels on the centerline
Each plate SHALL contain one upright, unclipped label block: the number above `LB`. The block SHALL be centered horizontally and vertically using layout alignment, with its center within 1 CSS pixel of the sleeve centerline. Per-denomination positional corrections are prohibited. (REQ-VIS-005)

#### Scenario: S5-AC-008 Labels align to the bar centerline
- **WHEN** plates of different heights are displayed
- **THEN** each plate and each two-line label block is centered on the sleeve centerline within one CSS pixel, with no denomination-specific offsets

#### Scenario: Label contrast
- **WHEN** any plate label is rendered
- **THEN** it has at least 4.5:1 contrast against its plate fill

### Requirement: Flat plate geometry
Plates SHALL be flat upright rounded rectangles with a solid semantic fill and one thin contrasting outline, separated by a 3 CSS-pixel gap. They MUST NOT use raster images, textures, gradients, 3D perspective, simulated materials, or more than one restrained shadow. They SHALL be built from HTML and CSS, not SVG or canvas. (REQ-VIS-006)

#### Scenario: S5-AC-009 Flat CSS plate treatment
- **WHEN** one plate of every denomination is displayed
- **THEN** each uses a solid fill and readable label, heavier plates are taller, and none uses raster, texture, gradient, 3D, or photorealistic treatment

### Requirement: Target-mode visualization
In target mode the visualization SHALL be a read-only image whose accessible name is `Plates required on one side. Fixed bar: 45 lb. One side: 45 lb, 10 lb` (or `One side: no plates`). It SHALL show the displayed configuration, update in the same render as target changes, and become keyboard-focusable only while it overflows. (REQ-VIS-007)

#### Scenario: S4-AC-001 Empty target barbell
- **WHEN** the target is the initial 45 lb
- **THEN** a read-only barbell with an empty sleeve shows, with no empty-result text and no plate controls

#### Scenario: S4-AC-002 Default target visualization
- **WHEN** the target is 155 lb
- **THEN** exactly two read-only plates show, 45 then 10, the red 45 taller than the green 10, with no `45 + 10` text above the bar

#### Scenario: S4-AC-003 Optimized target visualization
- **WHEN** 165 lb shows `45, 10, 5` and the user activates `Reduce plates`
- **THEN** the visualization shows blue 35 then yellow 25 and the total stays 165 lb

#### Scenario: S4-AC-004 Target change resets both results
- **WHEN** the optimized 165 lb result is shown and the user activates `+5`
- **THEN** the visualization and its description show the 170 lb default with no stale plates

### Requirement: Reverse-mode visualization
In reverse mode the visualization SHALL be a group named `Plates on one side. Fixed bar: 45 lb`, and every plate a native button named like `Remove 45 lb plate`, duplicates included. Adding SHALL scroll the viewport only enough to reveal the last plate of that denomination, without moving focus. (REQ-VIS-008)

#### Scenario: S4-AC-005 Empty reverse barbell
- **WHEN** reverse mode has no plates
- **THEN** the total is 45 lb, the empty sleeve shows directly after `Plates per side`, and no removal button exists

#### Scenario: S4-AC-006 Reverse addition updates visualization
- **WHEN** the user adds 45 then 10 to an empty load
- **THEN** the total is 155 lb, removal buttons show red 45 then green 10 with weight labels and names, and focus stays on the last add control

#### Scenario: S4-AC-007 Reverse ordering ignores insertion order
- **WHEN** the user adds `10`, `45`, `5`, and `25`
- **THEN** plates show from the notch as `45 | 25 | 10 | 5`, colored red, yellow, green, black

#### Scenario: S4-AC-008 Remove a graphical plate
- **WHEN** plates are `45 | 25 | 10` and the user activates the 25
- **THEN** the bar becomes `45 | 10`, the total drops 50 lb, and focus moves to the 10 lb plate

#### Scenario: S4-AC-009 Duplicate graphical plates
- **WHEN** two 45 lb plates are selected and the user activates either
- **THEN** exactly one is removed and one red 45 lb removal button remains

#### Scenario: S4-AC-015 Reverse Optimize replaces the graphical configuration
- **WHEN** the bar shows blue 35 then yellow 25 at 165 lb and the user activates `Optimize`
- **THEN** it shows red 45, green 10, black 5, the total stays 165 lb, focus moves to the 45, and nothing moves

#### Scenario: Focused plate revealed
- **WHEN** focus moves to a plate outside the visible part of the viewport
- **THEN** the viewport scrolls that plate into view

### Requirement: Bounded overflow
The visualization SHALL scroll horizontally inside its own viewport when plates exceed its width, and never cause panel or document horizontal scrolling. Plates MUST NOT shrink, wrap to a second row, or aggregate into counts. While overflowing, the viewport SHALL show a right-edge fade and the text `More plates — scroll horizontally` below it, linked as its description. (REQ-VIS-009)

#### Scenario: S4-AC-012 Bounded overflow
- **WHEN** at least twelve plates are selected at 320 CSS pixels
- **THEN** the visualization scrolls internally, plates keep their minimum size, every plate is reachable, and the document does not scroll horizontally

#### Scenario: Overflow affordance
- **WHEN** the visualization overflows
- **THEN** the right edge fades and `More plates — scroll horizontally` appears below the viewport

### Requirement: Visualization accessibility
The visualization's accessible text SHALL name the fixed bar before the heavy-to-light plate sequence. Decorative internals MUST NOT duplicate announcements, and no competing live region SHALL be added. Focus on a plate SHALL be visible on every color, internal scrolling MUST NOT trap focus, and forced-colors mode SHALL keep outlines, labels, and focus. (REQ-VIS-010)

#### Scenario: S4-AC-011 Accessible denomination communication
- **WHEN** authored colors are unavailable or indistinguishable
- **THEN** every plate is identifiable by its visible weight, target configurations remain available as text, and reverse plates remain named buttons

#### Scenario: S4-AC-014 Mobile and keyboard usability
- **WHEN** target plate reduction and reverse add, optimize, and remove are completed by keyboard or touch at 320 CSS pixels
- **THEN** removal targets stay at least 44 by 44, focus is visible on every plate color, focused plates stay in view, and nothing needs document scrolling or hover

#### Scenario: Description order
- **WHEN** the target visualization shows `[45, 10, 5]`
- **THEN** its accessible text is equivalent to `Fixed bar: 45 lb. One side: 45 lb, 10 lb, 5 lb.`
