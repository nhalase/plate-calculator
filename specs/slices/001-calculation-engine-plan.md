# Slice 001: Calculation Engine — Implementation Plan

## Status

Approved and implemented

## Prompt used to generate the plan

```text
Review `specs/slices/001-calculation-engine.md` and all specifications it references.

First, produce an implementation plan only. Do not modify any files yet.

The plan must include:

- files to create or modify;
- exported types, constants, and functions;
- the target-normalization algorithm;
- the greedy default plate-selection algorithm;
- the minimum-plate optimization algorithm and tie-breaking behavior;
- runtime validation behavior;
- Vitest tests mapped to the applicable acceptance-criteria IDs;
- commands that will verify type checking and tests.

Stay strictly within Slice 001. Do not implement React components, UI, CSS, PWA behavior, persistence, or deployment.

Identify any ambiguity or contradiction that prevents deterministic implementation.
```

## Files

Create:

```text
.gitignore
package.json
package-lock.json or equivalent package-manager lockfile
tsconfig.json
src/domain/plates.ts
src/domain/calculations.ts
src/domain/calculations.test.ts
```

Only the TypeScript and Vitest tooling needed to execute this slice will be introduced. React, the Vite application shell, CSS, PWA configuration, and deployment remain out of scope.

## Public domain API

`src/domain/plates.ts` exports the fixed bar weight, descending plate denominations, `PlateWeight`, and `PlateConfiguration`.

`src/domain/calculations.ts` exports:

```ts
normalizeTargetWeight(requested: number): number
calculateSideWeight(total: number): number
calculateDefaultPlates(total: number): PlateConfiguration
calculateOptimizedPlates(total: number): PlateConfiguration
hasOptimization(total: number): boolean
calculateTotalWeight(plates: readonly PlateWeight[]): number
sortPlates(plates: readonly PlateWeight[]): PlateConfiguration
```

Public functions do not mutate caller-owned arrays. Returned configurations and shared denomination constants are read-only and frozen.

## Algorithms

### Target normalization

Reject non-finite numbers. Clamp finite values at or below 45 lb to 45 lb. For larger values, calculate the achievable totals immediately below and above the request and compare their distances explicitly. Equal distances select the lower total.

### Total validation and side weight

Functions that require an achievable total reject non-finite totals, totals below 45 lb, and totals outside the 5 lb sequence beginning at 45 lb. Valid totals produce `(total - 45) / 2` pounds per side.

### Greedy default selection

Convert the side load to integer 2.5 lb units. Visit 45, 35, 25, 10, 5, and 2.5 lb plates in descending order, taking as many as fit before moving to the next denomination. Assert that no remainder remains.

### Minimum-plate optimization

Use unbounded coin-change dynamic programming in integer 2.5 lb units. For each reachable amount, retain the candidate with the lowest plate count. For equal counts, compare denomination counts from heaviest to lightest and prefer the first candidate with more plates of the heavier denomination. Expand the winning counts into a descending configuration.

`hasOptimization` is true only when the optimized configuration contains fewer plates than the greedy default.

### Reverse calculation and ordering

Calculate total weight as `45 + 2 * sum(one-side plates)`. Sorting returns a new descending, frozen array.

## Runtime validation

- Non-finite numeric inputs throw `TypeError`.
- Invalid total weights throw `RangeError`.
- Finite normalization requests below the bar weight resolve to 45 lb.
- Plate arrays rely on the public `PlateWeight` TypeScript type; runtime validation of deliberately untyped plate values is not required by this slice.
- Error messages are stable and testable but are not user-facing copy.

## Test coverage

Vitest tests map to:

- AC-CALC-001-1 through AC-CALC-001-6, plus the non-finite numeric portion of AC-CALC-001-7;
- AC-CALC-002-1 through AC-CALC-002-4;
- AC-CALC-003-1 through AC-CALC-003-6;
- AC-CALC-004-1, AC-CALC-004-2, the domain portion of AC-CALC-004-3, AC-CALC-004-4, and AC-CALC-004-5;
- AC-DOM-001-1 and the domain enforcement supporting AC-DOM-001-2 and AC-DOM-001-3;
- AC-DOM-002-1 through AC-DOM-002-3;
- AC-CALC-006-1 through AC-CALC-006-5;
- the ordering portion of AC-UI-004-3.

Additional tests cover multiple midpoint boundaries, invalid totals, deterministic heavy-first tie-breaking, repeated plates, input immutability, frozen outputs, and exact reconstruction over a representative range of achievable totals.

## Verification

```text
npm run typecheck
npm test
```

An equivalent package-manager invocation is acceptable in an environment where npm is unavailable.

## Deferred acceptance-criteria portions

- Empty/non-numeric string handling and preservation of the last valid target in AC-CALC-001-7 require UI parsing and state.
- Selecting an Optimize action in AC-CALC-004-3 requires UI behavior.
- Proving the user cannot configure the bar in AC-DOM-001-2 requires the UI boundary.
- Plate colors belong to REQ-DOM-003 and a later presentation slice.

These items do not make the calculation engine ambiguous; they prevent Slice 001 from claiming completion of their UI-facing portions.

