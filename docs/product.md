# Barbell Plate Calculator — Product Specification

## Purpose

The Barbell Plate Calculator is a mobile-first Progressive Web App for quickly answering either of two questions during a workout:

1. Which plates should be loaded to reach a target total weight?
2. What is the total weight of the plates currently loaded?

The application is intended to be fast, glanceable, usable with one hand, installable to a phone home screen, and fully functional offline after its first successful load.

## Primary user

A person using a standard barbell during strength training who needs a reliable calculation between sets without doing arithmetic or depending on network access.

## Calculator modes

### Target Weight → Plates

The user selects or enters a desired total barbell weight. The application resolves it to the nearest achievable total and shows the plates to load on each side.

The normal result follows the familiar heaviest-first loading pattern. When another valid configuration reaches the same total using fewer plates, the application offers an optional `Reduce plates` action.

### Plates → Total Weight

The user adds plates representing one side of the bar. The application assumes a matching load on the other side and immediately displays the total barbell weight. A displayed plate can be removed with one tap. Double-tapping the displayed current total clears every selected plate and returns the calculator to the empty 45 lb bar. When the manual selection differs from the greedy, heaviest-first configuration for the same total, an `Optimize` action replaces it with that canonical loading pattern.

## Fixed domain assumptions

- The bar always weighs 45 lb and is not configurable.
- Plates are loaded symmetrically.
- Plate inventory is unlimited.
- The supported denominations and display colors are:

| Plate | Color |
| --- | --- |
| 45 lb | Red |
| 35 lb | Blue |
| 25 lb | Yellow |
| 10 lb | Green |
| 5 lb | Black |
| 2.5 lb | Gray |

- The application displays pounds only in version 1.

## Product goals

- Make both calculations require as few interactions as practical.
- Keep the current total and plate configuration understandable at a glance.
- Provide immediate feedback without a separate Calculate button.
- Make the primary workflow comfortable on a portrait-oriented phone.
- Produce deterministic results from the same inputs.
- Continue providing every calculator function without a connection after the app has been loaded and cached.

## Interaction principles

### Fast input

Target weight can be changed with `−5` and `+5` controls or by tapping the displayed value for direct entry. Direct entry requests a numeric keypad, supports decimals, and is optimized for replacing the current value.

### One-sided mental model

The interface shows and manipulates plates for one side. The application handles symmetry automatically.

### Immediate and reversible

Adding plates, removing plates, resetting the reverse load from the current total, changing the target, switching modes, reducing target-mode plate count, and optimizing a manual load take effect without confirmation.

### Clear adjustment

If a requested target is not achievable, the nearest achievable total becomes the primary result. A subtle message explains the adjustment without interrupting the workflow.

## Version 1 scope

Version 1 includes:

- both calculator modes;
- target rounding;
- default greedy plate selection;
- optional target-mode plate-count reduction;
- optional reverse-mode normalization to the greedy loading pattern;
- one-side barbell visualization;
- mobile numeric entry;
- installable PWA behavior;
- offline calculator operation.

Version 1 excludes:

- accounts or cloud synchronization;
- favorites and user preferences;
- workout logging, exercise tracking, timers, or social features;
- kilogram input or output;
- configurable bars, plate sets, or inventory limits;
- asymmetric loading;
- warm-up, percentage, or programming calculators;
- advertisements.

Favorites and customization are plausible later additions, but they do not change the version 1 scope.

