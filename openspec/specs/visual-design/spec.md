# visual-design Specification

## Purpose

Defines the approved dark, mobile-first visual system: color tokens, the CSS-only asset boundary, the single-column shell, brand header, typography, cards, controls, stable action slots, interaction states, motion, and the 320, 402, and desktop responsive contracts.

## Requirements

### Requirement: Dark color tokens
CSS custom properties SHALL define: page `#000000`, surface `#1c1c1e`, control `#2c2c2e`, border `#38383a`, text `#f5f5f7`, secondary `#aeaeb2`, muted `#8e8e93`, accent `#0a5fc4`, accent hover `#0c6fdc`, accent active `#084c9e`, and focus `#64d2ff` with a `#000000` separation ring. (REQ-STYLE-001)

#### Scenario: S5-AC-001 Dark visual system
- **WHEN** either mode is displayed
- **THEN** the page is near-black, sections are charcoal cards, primary text is near-white, secondary text is gray, and selected modes and primary actions use the blue accent

#### Scenario: Token contrast
- **WHEN** text and control boundaries are rendered
- **THEN** ordinary text has at least 4.5:1 contrast, white on the accent meets 4.5:1, and muted text never solely carries required information

### Requirement: CSS-only asset boundary
The UI, including the logo, bar, notch, sleeve, and plates, SHALL be built from HTML, pseudo-elements, and application-local plain CSS. It MUST NOT use raster UI images, SVG, canvas, WebGL, icon, CSS, or component frameworks, runtime styling dependencies, or external fonts. (REQ-STYLE-002)

#### Scenario: S5-AC-002 CSS-rendered brand header
- **WHEN** the application loads
- **THEN** a simple white barbell mark and the text `PLATE CALCULATOR` appear at the top, the mark is decorative and non-interactive, and no raster logo or icon dependency is requested

### Requirement: Single-column shell
The app SHALL be one centered column at most 480 CSS pixels wide with safe-area-aware padding: 24 top, 20 inline (12 below 360 CSS pixels), and at least 116 bottom, reserved for the update notice. Mode selector and cards SHALL be separated by 16 CSS pixels. The black background SHALL fill the page. (REQ-STYLE-003)

#### Scenario: S5-AC-014 Desktop containment
- **WHEN** the viewport is at least 1024 CSS pixels wide
- **THEN** the app stays a centered single column within its maximum width with no dashboard layout

### Requirement: Brand header
The header SHALL show a decorative 36 by 28 CSS-pixel CSS barbell mark, a white bar with symmetric vertical plate strokes hidden from assistive technology, followed by the level-one heading `Plate Calculator`, rendered uppercase by CSS as `PLATE CALCULATOR`. The document title is `Barbell Plate Calculator`. (REQ-STYLE-004)

#### Scenario: Wordmark is real text
- **WHEN** assistive technology reads the header
- **THEN** it announces the heading `Plate Calculator` and skips the decorative mark

### Requirement: Typography
The app SHALL use the system font stack. The target and current total SHALL be the largest, heaviest white text, with tabular numerals and a visibly smaller `lb` unit, and SHALL NOT wrap at 320 CSS pixels. Card headings, supporting copy, and rounding feedback SHALL use the secondary gray, with headings bold and not text-transformed. (REQ-STYLE-005)

#### Scenario: Long drafts contained
- **WHEN** an exceptionally long draft is typed into the target input
- **THEN** it scrolls or scales within the input without widening the page

### Requirement: Cards
Target, result, total, add-plate, and selected-plate sections SHALL be charcoal cards with a 1 CSS-pixel subtle border, no glossy or strong shadow, 28 CSS-pixel radius and 24 CSS-pixel padding at 402 CSS pixels, and content-driven height that never clips focus rings, plates, or actions. (REQ-STYLE-006)

#### Scenario: Action visibility does not change card height
- **WHEN** `Reduce plates` or `Optimize` appears or disappears
- **THEN** the card height is unchanged

### Requirement: Segmented mode control
The mode selector SHALL sit directly below the header as a rounded two-segment control in fixed order `Target → Plates`, `Plates → Total`. The selected segment SHALL use the accent with white text; the other is transparent over the selector's surface with secondary text. Switching MUST NOT animate height or slide content. (REQ-STYLE-007)

#### Scenario: S5-AC-003 Stable mode selector
- **WHEN** either mode is active
- **THEN** `Target → Plates` is left, `Plates → Total` is right, only the active one is blue, and both keep their `aria-pressed` behavior

### Requirement: Target card styling
The target card SHALL show its heading, the large target value with subordinate `lb`, rounding feedback below the value, and an equal-width two-column `−5`/`+5` row with raised control fill, restrained border, and light-blue `#64a7ff` text. The edit input SHALL occupy the display's region without moving other content. (REQ-STYLE-008)

#### Scenario: S5-AC-004 Target-mode hierarchy
- **WHEN** the active target is 165 lb
- **THEN** the heading is `Target weight (tap to change)`, `165` dominates with a subordinate `lb`, the step controls are equal size, and the result card shows `[45, 10, 5]` with `Reduce plates` and no text sequence

#### Scenario: Editing does not shift layout
- **WHEN** direct entry begins or ends
- **THEN** the step controls and following card do not move

### Requirement: Reverse card styling
The `Current total` card SHALL keep the total's large-number look as its reset control, with no icon, Reset label, helper line, or filled-button styling. The `Add a plate` card SHALL always use a three-column by two-row grid of neutral raised controls with near-white labels. (REQ-STYLE-009)

#### Scenario: S5-AC-005 Reverse-mode hierarchy
- **WHEN** reverse mode contains 35 and 25 lb plates
- **THEN** `165` dominates the total card as the reset control, add controls read `45, 35, 25, 10, 5, 2.5`, the plates show blue 35 then yellow 25, and `Optimize` is visible

### Requirement: Primary actions and reserved slots
`Reduce plates` and `Optimize` SHALL be full-width, blue, centered, bold buttons 56 CSS pixels tall at 402, 52 at 320, never under 44. Each result card SHALL keep an action slot of the same size in layout; an unavailable action is absent from sight and the accessibility tree, with no placeholder fill and no native disabled button. (REQ-STYLE-010)

#### Scenario: S5-AC-010 Stable primary-action space
- **WHEN** the user activates `Reduce plates` or `Optimize`
- **THEN** the action leaves sight and the accessibility tree, and the slot, card, and surrounding content keep their positions and dimensions

### Requirement: Interaction states and motion
Interactive elements SHALL define distinct hover, active, focus-visible, and selected states; hover is enhancement only and states MUST NOT change dimensions. Transitions SHALL be at most 150 ms and limited to color, background, border, opacity, and shadow, never layout or results, and removed under reduced motion. (REQ-STYLE-011)

#### Scenario: S5-AC-015 Contrast and alternate presentation
- **WHEN** the app is used with forced colors, keyboard only, 200 percent text zoom, or reduced motion
- **THEN** required information and focus remain perceivable, nonessential transitions are removed, and nothing depends on hover, authored color, or animation

#### Scenario: S5-AC-011 Existing behavior is unchanged
- **WHEN** the user edits, commits, cancels, steps, switches modes, adds, removes, reduces plates, or optimizes
- **THEN** visual styling alters no calculated value, state transition, ordering, announcement, or focus recovery

### Requirement: Responsive contract
At 402 by 874 CSS pixels the header, one-row mode selector, two-column steps, 3 by 2 add grid, one-line action labels, and `[45, 10, 5]` and `[35, 25]` fit without clipping. Below 360 CSS pixels, page padding SHALL be 12, card padding 16, card radius 22, and action height 52 CSS pixels, with smaller header, mode, and total text and no card or document overflow. (REQ-STYLE-012)

#### Scenario: S5-AC-012 iPhone 17 Pro preview
- **WHEN** both representative modes are viewed at 402 by 874 CSS pixels
- **THEN** the layout meets the contract, nothing overflows horizontally, and both visualizations are readable with all controls reachable by vertical scrolling

#### Scenario: S5-AC-013 Minimum-width usability
- **WHEN** reverse mode has at least twelve plates at 320 CSS pixels
- **THEN** the document does not scroll horizontally, the visualization scrolls internally, and every control, label, target, and focus ring stays usable
