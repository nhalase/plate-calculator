# Slice 005: UI Polish

## Status

Approved and implemented

## Goal

Apply the approved visual direction to both calculator modes without changing any calculation, state-transition, accessibility, or interaction behavior delivered by Slices 001 through 004.

The finished interface shall use a dark, mobile-first visual system with strong numeric hierarchy, rounded charcoal surfaces, a blue interaction accent, a compact CSS-rendered barbell mark, and a refined one-sided barbell visualization. The visualization shall remain flat and deterministic: it must be built from semantic HTML and plain CSS rather than raster artwork, canvas drawing, or photorealistic assets.

The primary visual-reference viewport for this slice is an iPhone 17 Pro-sized browser viewport of 402 by 874 CSS pixels. The application must remain responsive and usable at every supported viewport, including 320 CSS pixels wide and larger desktop widths.

## Dependencies

- Slice 001 is approved, implemented, and verified.
- Slice 002 is approved, implemented, and verified.
- Slice 003 is approved, implemented, and verified.
- Slice 004 is approved, implemented, and verified.
- `src/domain/plates.ts` remains the only source of supported denominations, denomination order, and semantic plate colors.
- `src/domain/calculations.ts` remains the only source of normalization, default selection, minimum-count selection, reverse totals, and configuration ordering.
- The existing shared `Barbell` rendering boundary remains responsible for both calculator modes.

## Source requirements

- REQ-DOM-001 through REQ-DOM-003
- REQ-CALC-001 through REQ-CALC-007
- REQ-UI-001 through REQ-UI-007
- REQ-UX-001
- All accepted behavioral and accessibility contracts in Slices 002 through 004

See [product.md](../product.md), [requirements.md](../requirements.md), [architecture.md](../architecture.md), [Slice 002](002-target-to-plates-ui.md), [Slice 003](003-plates-to-total-and-mode-switching.md), and [Slice 004](004-shared-barbell-visualization.md).

## Scope boundary

This slice includes:

- a dark application color system;
- a compact barbell brand mark and `PLATE CALCULATOR` wordmark;
- polished typography, spacing, surfaces, borders, shadows, and corner radii;
- a two-option segmented mode control with a blue active state;
- polished target, total, add-plate, result, and selected-plate cards;
- polished `−5`, `+5`, denomination, Reduce plates, and Optimize controls;
- identical reserved action-area geometry whether an action is available or absent;
- a flat CSS-rendered fixed-bar notch, sleeve, and plates;
- left-anchored, heavy-to-light plate stacking toward the right edge;
- plate labels whose visual centers align with the sleeve centerline;
- responsive behavior at 320, 402, and desktop widths;
- keyboard, forced-colors, contrast, reduced-motion, and touch-target polish;
- automated regression coverage and focused visual browser verification.

This slice does not change:

- the fixed 45 lb bar;
- supported denominations or semantic denomination colors;
- target normalization or rounding rules;
- greedy or minimum-count algorithms;
- the meanings of Reduce plates or Optimize;
- mode state retention;
- direct-entry parsing, commit, cancellation, or invalid-input recovery;
- plate add, remove, ordering, duplicate, focus-recovery, or overflow behavior;
- accessible control names or live-region semantics except for the additive fixed-bar description defined here.

This slice does not add persistence, settings, configurable equipment, alternate units, inventory limits, PWA behavior, offline support, deployment, analytics, bottom navigation, charts, or additional calculator modes.

## Approved visual direction

The implementation shall use the following visual language:

- a near-black page background;
- matte charcoal cards separated by restrained borders rather than bright shadows;
- large white numeric values with compact `lb` units;
- muted gray section labels and supporting copy;
- a single blue interaction accent for selected modes, primary actions, and intentional emphasis;
- generous rounded corners and clear vertical grouping;
- flat plate colors and geometry with no attempt at photorealism;
- no decorative information unrelated to the calculator.

The approved design is a translation of these characteristics into this product. It shall not reproduce another application's name, navigation, icons, charts, copy, or workout content.

## CSS and asset boundary

All Slice 005 visuals shall be achievable with the existing React markup and plain application-local CSS.

The implementation shall not add:

- raster images for the logo, bar, collar, notch, sleeve, plates, surfaces, gradients, or shadows;
- canvas rendering;
- WebGL;
- an icon, CSS, or component framework;
- a runtime styling dependency;
- an external font download;
- texture images or photorealistic plate artwork.

The logo, bar assembly, and plates shall use ordinary elements and CSS pseudo-elements. No SVG, canvas, icon library, or image asset shall render these elements.

CSS custom properties shall own shared colors, radii, spacing, focus colors, and surface treatments. Domain denomination metadata shall remain the source of plate color names; JSX shall not infer colors from rendered position.

## Design tokens

The implementation plan may adjust exact token names, but the rendered system shall be equivalent to the following contract:

| Role | Required token value |
| --- | --- |
| Page | `#000000` |
| Primary surface | `#1c1c1e` |
| Raised/control surface | `#2c2c2e` |
| Subtle border | `#38383a` |
| Primary text | `#f5f5f7` |
| Secondary text | `#aeaeb2` |
| Muted text | `#8e8e93` |
| Accent | `#0a5fc4` |
| Accent hover | `#0c6fdc` |
| Accent active | `#084c9e` |
| Focus ring | `#64d2ff` with a `#000000` separation ring |

Token values shall meet these constraints:

- ordinary text contrast is at least 4.5:1 against its rendered background;
- large text and non-text control boundaries meet WCAG AA requirements;
- white text on the blue action background meets at least 4.5:1 unless the final text size and weight independently qualify as large text;
- muted text shall not become the sole carrier of required information;
- hover, active, focus, selected, and disabled-looking surfaces remain distinguishable without relying on color alone.

Denomination shades may be refined from Slice 004 while preserving this mapping:

| Weight | Semantic color |
| ---: | --- |
| 45 lb | red |
| 35 lb | blue |
| 25 lb | yellow |
| 10 lb | green |
| 5 lb | near-black |
| 2.5 lb | gray |

Each plate's label color shall be selected for at least 4.5:1 contrast against that denomination's final fill.

## Application shell

The application shall remain a single centered column.

At 402 CSS pixels wide:

- the shell shall use the available viewport width without document-level horizontal scrolling;
- inline page padding shall be 20 CSS pixels;
- adjacent primary sections shall use a consistent 16 CSS-pixel vertical gap;
- cards shall occupy the full available content width;
- natural document-level vertical scrolling is permitted and expected;
- no fixed or floating bottom navigation shall obscure calculator content.

At widths above the mobile range, the column shall stop growing at 480 CSS pixels and remain horizontally centered. Cards shall not split into a multi-column dashboard in this slice.

The page background shall continue through the full scrollable document, including browser safe-area insets where supported.

## Brand header

The header shall contain, from left to right:

1. a compact decorative barbell mark;
2. the visible uppercase wordmark `PLATE CALCULATOR`.

The barbell mark shall:

- be a simple white horizontal bar with symmetric short vertical plate strokes;
- occupy a 36 by 28 CSS-pixel box at the 402 CSS-pixel reference viewport;
- be created with CSS elements or pseudo-elements by default;
- be hidden from the accessibility tree because the adjacent wordmark supplies the product name;
- remain recognizable in forced-colors mode;
- contain no button, link, or interaction.

The visible wordmark shall be the page's level-one heading. It shall remain text, not an image. No separate oversized marketing title is required.

## Typography

The app shall use the existing system-font stack. No external font shall be fetched.

Typography shall follow this hierarchy:

- product wordmark: compact uppercase, semibold or bold, with restrained positive tracking;
- card headings: title case, muted gray, semibold;
- primary target and total: the largest text in the interface, white, heavy weight, compact line height, tabular numerals where supported;
- units: visibly subordinate to the associated number while remaining readable;
- plate-result expressions: large white semibold text;
- control labels: semibold with no letter spacing that harms readability;
- supporting copy and rounding feedback: secondary gray with comfortable line height.

The numeric target and current total shall not wrap at 320 CSS pixels for supported values that fit the current input contract. Exceptionally long finite direct-entry drafts may scroll or scale within the input boundary, but shall not expand the page horizontally.

## Surface and card contract

Target, result, total, add-plate, and selected-plate sections shall render as separate charcoal cards with:

- a 28 CSS-pixel corner radius at the 402 CSS-pixel reference viewport;
- a subtle one-pixel boundary against the black page;
- no glossy highlight, texture, or strong drop shadow;
- internal padding of 24 CSS pixels at 402 CSS pixels wide;
- internal padding no smaller than 16 CSS pixels at 320 CSS pixels wide;
- no clipped focus ring, plate, error, feedback, or action control.

Card height shall be content-driven. Changing calculator state may change plate contents, feedback, or empty-state text, but showing or hiding Reduce plates or Optimize alone shall not change card height.

## Segmented mode control

The mode selector shall remain immediately below the brand header and preserve this fixed left-to-right order:

1. `Target → Plates`;
2. `Plates → Total`.

The selected segment shall use the blue accent with high-contrast text. The unselected segment shall use the charcoal control surface with secondary text. The selector container shall use a rounded outer boundary and each segment shall retain at least a 44 CSS-pixel touch target.

Selection shall continue to use the existing two native buttons and `aria-pressed` semantics. Visual treatment shall not introduce tabs, links, swipe gestures, or a reordered control in reverse mode.

Switching modes shall not animate card height or horizontally slide calculator content.

## Target-mode polish

The Target Weight card shall contain:

- the heading `Target weight (tap to change)`;
- the active target as a large white number with a subordinate `lb` unit;
- the existing direct-entry behavior on the displayed target;
- a two-column `−5` and `+5` control row.

The two step controls shall have equal width and height, a raised charcoal fill, restrained border, blue text, and at least a 44 CSS-pixel target. Their accessible names remain unchanged.

When direct entry is active:

- the input shall occupy the same visual region as the display control;
- entering edit mode shall not move the step controls or following card;
- the focus ring and input boundary shall be clearly visible;
- invalid-input recovery, Escape cancellation, Enter commit, blur commit, numeric keypad hint, and normalization remain exactly as specified by Slice 002.

Rounding feedback shall appear inside the Target Weight card below the editable value and before the step controls. Its appearance or disappearance may use reserved space only if the implementation plan determines that this avoids an objectionable shift without creating excessive empty space.

## Reverse-mode polish

The Current total card shall contain:

- the heading `Current total`;
- the total as a large white number with a subordinate `lb` unit, presented as the reset control defined by Slice 003;
- no explanatory helper copy beneath the total.

The reset control shall retain the same visual hierarchy as the existing total rather than looking like a conventional filled button. It shall introduce no separate icon, Reset label, helper line, confirmation, or card-height change. It shall provide a visible keyboard focus indicator, at least a 44 by 44 CSS-pixel target, and touch behavior that prevents double-tap zoom on the control without disabling normal page scrolling.

The Add a plate card shall contain:

- the heading `Add a plate`;
- the existing six denomination controls in descending order;
- a three-column by two-row grid at 320 and 402 CSS pixels unless browser text scaling requires fewer columns to preserve 44 CSS-pixel targets and readable labels.

Add controls shall use neutral raised charcoal surfaces rather than denomination fills. Their weight labels remain white or near-white. Focus, pressed, and hover states shall be visibly distinct.

## Primary action controls and reserved space

Reduce plates and Optimize shall use the same primary-action treatment:

- full available card width;
- blue fill;
- high-contrast centered label;
- semibold or bold text;
- corner radius consistent with, but smaller than, the containing card;
- height of 56 CSS pixels at the 402 CSS-pixel viewport, 52 CSS pixels at 320 CSS pixels, and never less than 44 CSS pixels under text zoom;
- visible focus ring that does not alter layout.

Each result card shall permanently retain an action slot whose dimensions equal the rendered primary button. When its action is unavailable:

- the slot remains in normal layout;
- the button is absent from sight and the accessibility tree;
- the card, barbell viewport, and surrounding document content retain their positions;
- the empty slot is not given a decorative fill that suggests an unavailable control.

## Refined one-sided barbell structure

The shared visualization shall render one flat, left-anchored assembly. At its initial horizontal scroll position, the inline-start of the assembly shall be visible.

Within the assembly, the visual order from left to right shall be:

1. fixed-bar notch;
2. plates in the exact heavy-to-light order supplied by the domain, directly against the notch;
3. remaining sleeve extending toward the right;
4. sleeve end when visible.

For `[45, 10, 5]`, the visible order is:

```text
45 lb bar notch | red 45 | green 10 | black 5 | remaining sleeve
```

The plate group shall not be horizontally centered in the visualization. It shall start at the left assembly anchor and grow toward the right as plate instances are added. Empty space belongs after the loaded plates, not equally on both sides of them.

Heavy-to-light order continues to mean closest to the fixed-bar notch through farthest from it. The visualization shall consume the existing domain-ordered array and shall not sort in the component.

## Fixed-bar notch

The fixed-bar notch is a small non-interactive rectangular tab intersecting the sleeve centerline at the far left of the assembly. Its purpose is to make the fixed 45 lb bar visually explicit without resembling a selected plate.

The notch shall:

- appear in both modes, including empty-bar states;
- be visually centered on the same horizontal axis as the sleeve, plate centers, and plate labels;
- appear directly before and flush against the first selected plate;
- use a neutral gray fill and boundary distinct from every denomination fill;
- be shorter than the 2.5 lb visual plate and wider than the sleeve thickness;
- show `45` as its primary visible label and `lb bar` as visible secondary text when the available notch width permits;
- otherwise show `45` visibly and expose the full phrase `45 lb bar` through the visualization's accessible description;
- remain visually distinct from the red 45 lb plate when both are present;
- never be a button, removal target, selected plate, or member of the plate configuration;
- never affect totals, sorting, optimization, overflow counts, or focus recovery.

The notch is part of the fixed bar assembly and is not a second 45 lb plate. No separate connector or collar may create visible space between the notch and the first plate.

## Flat plate geometry

Each plate shall remain an upright rounded rectangle whose height is defined by Slice 004's deterministic size model.

Slice 005 refines plate appearance as follows:

- use a solid semantic denomination fill;
- use one thin contrasting outline;
- use no raster texture;
- use no simulated rubber, leather, metal, knurling, bevel, or photographic lighting;
- use no 3D perspective or rotation;
- use no fill gradient;
- permit at most one restrained CSS box shadow that does not imply depth or change the apparent denomination color;
- retain a minimum interactive width of 44 CSS pixels in reverse mode;
- use a 3 CSS-pixel inter-plate gap;
- keep every plate centered on the sleeve axis.

Plate widths may remain consistent across denominations to preserve touch targets and label readability. Height, text, and color remain the required denomination cues.

## Plate-label centerline contract

Every plate shall contain one visible label block consisting of:

1. numeric denomination on the first line;
2. the unit `LB` on the second line.

The complete two-line label block—not merely its text baseline—shall be centered both horizontally and vertically inside the plate.

The sleeve centerline is the authoritative vertical reference:

- the vertical center of every plate equals the vertical center of the sleeve;
- the vertical center of every plate-label block equals the vertical center of the sleeve;
- therefore labels on plates of different heights form one common horizontal centerline;
- font metrics, line height, padding, borders, and button reset styles shall not move any label above or below that axis;
- implementations shall use layout centering such as grid or flex alignment rather than hand-tuned per-denomination offsets;
- per-weight `top`, `margin`, `transform`, or padding corrections are prohibited.

At the base scale, the label center may deviate from the computed sleeve center by no more than one CSS pixel due to pixel rounding.

The fixed-bar notch label shall use the same sleeve-center reference. Its label does not need to use the same font size as plate labels.

## Empty, duplicate, and overflow states

When no plates are loaded, the viewport shall still show the fixed-bar notch and a sleeve extending to the right. Existing `No plates required` or `No plates loaded` text remains visible in its calculator context.

Duplicate plates shall render as separate adjacent instances and shall continue growing the stack toward the right.

Overflow remains internal to the visualization viewport:

- the assembly never wraps;
- plates never shrink below their minimum usable size to fit;
- the fixed-bar notch and initial heavy plate are visible at initial scroll position;
- native horizontal scrolling reaches every later plate;
- the existing add and focus-recovery scrolling rules remain in force;
- an edge fade or similarly subtle CSS affordance may indicate additional content, but it shall not obscure a label or focused control;
- the document itself shall not scroll horizontally.

## Interaction states

All interactive elements shall define default, hover-capable, active, focus-visible, and pressed or selected states as applicable.

- Hover styling is enhancement only; no behavior depends on hover.
- Active styling shall not move content by changing border thickness, padding, or element dimensions.
- Focus-visible styling shall use an outer ring with sufficient separation from both black and colored surfaces.
- Reverse plate buttons shall retain a visible focus treatment on every denomination color.
- Native disabled controls are not introduced for unavailable Reduce plates or Optimize actions.
- Touch targets remain at least 44 by 44 CSS pixels.

The app may use CSS transitions of at most 150 milliseconds for color, background-color, border-color, opacity, and box-shadow. It shall not animate layout dimensions, plate order, totals, or calculator results. Under `prefers-reduced-motion: reduce`, nonessential transitions shall be removed.

## Accessibility contract

- Existing landmarks, heading order, live regions, control names, `aria-pressed` semantics, and removal-button names shall remain valid.
- The visible product wordmark remains real text.
- The decorative logo is hidden from the accessibility tree.
- Card boundaries shall not create unnecessary landmark or tab stops.
- Visible target, total, result, notch, and plate text shall not depend on color for meaning.
- The shared visualization's accessible description shall identify the fixed bar before the one-side plate sequence, equivalent to `Fixed bar: 45 lb. One side: 45 lb, 10 lb, 5 lb.`
- The notch shall not duplicate the fixed bar as an interactive or list item.
- Target-mode plates remain read-only.
- Reverse-mode plates remain native removal buttons.
- All required text contrast, non-text contrast, focus visibility, forced-colors behavior, and minimum targets shall meet WCAG AA.
- Browser text zoom to 200 percent shall not hide required controls or create document-level horizontal scrolling at a 320 CSS-pixel layout width.

## Responsive contract

### Primary preview: 402 by 874 CSS pixels

At the established iPhone 17 Pro preview size:

- the brand header and both mode choices fit without truncation;
- the mode selector retains one row;
- target and total values remain visually dominant;
- the step controls remain a two-column row;
- the add controls remain a three-column by two-row grid;
- each card fits within the viewport width;
- the fixed-bar notch, first plate, and some remaining sleeve are recognizable without horizontal scrolling for ordinary configurations;
- `[45, 10, 5]` and `[35, 25]` fit without clipping their labels;
- plate groups begin at the left assembly anchor and extend right;
- primary action labels remain on one line;
- vertical document scrolling remains natural and unobstructed.

### Minimum supported width: 320 CSS pixels

At 320 CSS pixels:

- page inline padding shall be 12 CSS pixels;
- card padding shall be 16 CSS pixels;
- card corner radius shall be 22 CSS pixels;
- the mode selector remains usable and its labels remain understandable;
- all required controls remain at least 44 by 44 CSS pixels;
- plate labels and the fixed-bar indication remain readable;
- no card or document-level horizontal overflow occurs;
- visualization overflow remains internally scrollable;
- focus rings are not clipped.

### Desktop widths

At 1024 CSS pixels and wider:

- the calculator remains a centered single column;
- the content column does not stretch into a dashboard;
- mobile touch targets and hierarchy remain intact;
- empty horizontal space belongs outside the application column rather than between unrelated controls.

## Acceptance scenarios

### S5-AC-001 — Dark visual system

Given either calculator mode is displayed,
then the page uses a near-black background,
and calculator sections use charcoal cards,
and primary text is near-white,
and secondary text is gray,
and selected modes and primary actions use the shared blue accent.

### S5-AC-002 — CSS-rendered brand header

Given the application is loaded,
then a simple white barbell mark and the text `PLATE CALCULATOR` appear at the top,
and the mark is decorative and non-interactive,
and no raster logo or external icon dependency is requested.

### S5-AC-003 — Stable mode selector

Given either mode is active,
then `Target → Plates` remains the left option,
and `Plates → Total` remains the right option,
and only the active option uses the blue selected surface,
and both controls retain their existing `aria-pressed` behavior.

### S5-AC-004 — Target-mode hierarchy

Given the active target is 165 lb,
then the card heading is `Target weight (tap to change)`,
and `165` is the dominant value in the Target Weight card,
and `lb` is visibly associated but subordinate,
and `−5` and `+5` are equal-size controls,
and the result card shows `45 + 10 + 5`, the matching visualization, and Reduce plates.

### S5-AC-005 — Reverse-mode hierarchy

Given reverse mode contains 35 and 25 lb plates,
then `165` is the dominant value in the Current total card,
and the total remains visually dominant while acting as the accessible reset control,
and the Add a plate controls remain ordered `45, 35, 25, 10, 5, 2.5`,
and the selected-plate card shows blue 35 then yellow 25,
and Optimize is visible.

### S5-AC-006 — Fixed-bar notch

Given either visualization is displayed,
then a neutral fixed-bar notch appears at the far left on the sleeve centerline,
and it visibly indicates 45,
and the accessible visualization description identifies the fixed 45 lb bar,
and the notch is not exposed as a plate or removal control.

### S5-AC-007 — Left-to-right plate loading

Given the supplied configuration is `[45, 10, 5]`,
then the assembly is anchored at the left of its viewport,
and the order is fixed-bar notch, red 45, green 10, black 5, remaining sleeve,
and no connector, collar, or gap appears between the notch and red 45 plate,
and the group grows toward the right rather than remaining centered.

### S5-AC-008 — Labels align to the bar centerline

Given plates of different heights are displayed,
then each plate center lies on the sleeve centerline,
and each complete two-line weight-and-unit label block is horizontally centered in its plate,
and each label block's vertical center lies on the sleeve centerline within one CSS pixel,
and no denomination-specific positioning correction is used.

### S5-AC-009 — Flat CSS plate treatment

Given one plate of every denomination is displayed,
then every plate uses its semantic solid fill and a readable label,
and heavier denominations remain strictly taller,
and no plate uses a raster image, texture, fill gradient, 3D perspective, or photorealistic material.

### S5-AC-010 — Stable primary-action space

Given Reduce plates or Optimize is available,
when the user activates it,
then the action disappears from sight and the accessibility tree,
and the reserved action slot retains identical position and dimensions,
and the card and surrounding content do not move solely because the action disappeared.

### S5-AC-011 — Existing behavior is unchanged

Given the full Slice 002 through Slice 004 workflows,
when the user edits, commits, cancels, increments, decrements, changes modes, adds, removes, reduces plates, or optimizes,
then all existing calculated values, state transitions, ordering, announcements, and focus recovery remain unchanged.

### S5-AC-012 — iPhone 17 Pro preview

Given a 402 by 874 CSS-pixel viewport,
when both representative modes are inspected,
then the layout satisfies the primary responsive contract,
and no document-level horizontal overflow exists,
and target `[45, 10, 5]` and reverse `[35, 25]` visualizations are readable,
and all expected controls are visible through normal vertical scrolling.

### S5-AC-013 — Minimum-width usability

Given a 320 CSS-pixel viewport with at least twelve reverse plates,
then the document does not scroll horizontally,
and the visualization scrolls internally,
and every control and plate remains reachable,
and required touch targets, labels, and focus rings remain usable.

### S5-AC-014 — Desktop containment

Given a viewport at least 1024 CSS pixels wide,
then the application remains a centered single column within its maximum width,
and cards and controls do not stretch into a dashboard layout.

### S5-AC-015 — Contrast and alternate presentation

Given default colors, forced-colors mode, keyboard navigation, 200 percent text zoom, or reduced-motion preference,
then required information and focus remain perceivable,
and nonessential transitions are removed for reduced motion,
and no required behavior depends on hover, authored color, or animation.

## Required automated tests

Existing Slice 001 through Slice 004 tests shall remain green.

New or amended component tests shall cover observable semantics for:

- S5-AC-002: visible wordmark and decorative logo treatment;
- S5-AC-003: fixed mode order, active state, and accessible pressed state;
- S5-AC-006: fixed-bar description and absence of a notch control;
- S5-AC-007: notch followed by domain-ordered plate instances;
- S5-AC-009: semantic denomination attributes and absence of image or canvas-based plate rendering;
- S5-AC-010: persistent action-slot identity and absent unavailable control;
- S5-AC-011: unchanged functional workflows.

Tests shall not assert exact generated class names, entire HTML snapshots, incidental DOM nesting, or pixel geometry in jsdom.

S5-AC-001, S5-AC-004, S5-AC-005, S5-AC-008, and S5-AC-012 through S5-AC-015 require real-browser inspection because color, layout, computed geometry, overflow, focus-ring clipping, media queries, and text zoom cannot be proven by jsdom alone.

## Required browser verification

Browser verification shall include:

1. Target mode at 402 by 874 with active target 165 and default `45 + 10 + 5`.
2. The same target after Reduce plates produces `35 + 25` without action-slot or surrounding-layout movement.
3. Reverse mode at 402 by 874 with manual `35 + 25`, total 165, and visible Optimize.
4. The same reverse state after Optimize produces `45 + 10 + 5`, preserves total 165, moves focus as specified, and causes no action-slot or surrounding-layout movement.
5. Computed center coordinates confirm that every plate-label block is within one CSS pixel of the sleeve centerline in both representative configurations.
6. Computed inline coordinates confirm the notch and plate instances increase from left to right in domain order with no visible gap between the notch and first plate.
7. The fixed-bar notch remains visible and non-interactive in both empty-bar states.
8. A 320 CSS-pixel reverse state with at least twelve plates uses internal visualization overflow and no document-level horizontal overflow.
9. A 1024 CSS-pixel viewport retains the centered single-column layout.
10. Keyboard-only traversal confirms visible focus for mode, target, step, add, plate removal, Reduce plates, and Optimize controls.
11. Forced-colors and reduced-motion emulation preserve required information and focus.
12. Browser console warnings and errors are absent throughout the workflows.

The final handoff shall include iPhone 17 Pro-sized screenshots of at least:

- Target mode with Reduce plates visible;
- Target mode with its reserved action space empty;
- reverse mode with Optimize visible;
- reverse mode with its reserved action space empty.

## Verification commands

The implementation plan shall use the repository's actual package scripts. At minimum, verification shall include commands equivalent to:

```text
pnpm run typecheck
pnpm test
pnpm run build
```

The production build shall complete without warnings introduced by this slice.

## Non-goals

This slice does not include:

- any domain or algorithm change;
- new calculator modes;
- a bottom navigation bar;
- charts, history, workout tracking, or progress features;
- dark/light theme switching;
- user-selectable colors, units, bars, or plate inventory;
- drag-and-drop or animated plate loading;
- raster, 3D, canvas, or photorealistic barbell assets;
- external fonts, icon libraries, CSS frameworks, or component libraries;
- persistence or settings;
- PWA installability or offline behavior;
- GitHub Pages deployment changes;
- Slice 006 or later work.

## Definition of done

Slice 005 is complete when:

- the dark visual system is applied consistently to both modes;
- the CSS-rendered barbell mark and text wordmark are present;
- cards, typography, segmented control, secondary controls, and primary actions match this contract;
- the fixed 45 lb bar notch appears at the far left of every barbell assembly;
- plates load from left to right in domain order;
- every plate-label block and notch label are centered on the sleeve axis;
- all plate and bar visuals are flat, deterministic, and achievable with HTML and plain CSS;
- action slots prevent movement when Reduce plates or Optimize appears or disappears;
- all Slice 001 through Slice 004 behavior remains intact;
- automated checks pass;
- required 320, 402 by 874, and desktop browser verification passes;
- required screenshots are captured;
- no out-of-scope behavior or dependency is introduced.
