# Slice 001: Calculation Engine

## Status

Approved and implemented

## Goal

Implement and unit-test all framework-independent barbell calculation rules as pure TypeScript. This slice creates the trusted domain foundation for both calculator modes; it does not create UI or PWA behavior.

## Source requirements

- REQ-DOM-001 and REQ-DOM-002
- REQ-CALC-001 through REQ-CALC-004
- REQ-CALC-006
- the ordering portion of REQ-UI-004

See [requirements.md](../requirements.md) and [architecture.md](../architecture.md).

## Deliverables

Expected modules (names may change in an approved implementation plan):

```text
src/domain/plates.ts
src/domain/calculations.ts
src/domain/calculations.test.ts
```

The implementation shall export domain constants/types and behavior equivalent to:

```ts
type PlateWeight = 45 | 35 | 25 | 10 | 5 | 2.5
type PlateConfiguration = readonly PlateWeight[]

const BAR_WEIGHT: 45
const PLATE_WEIGHTS: readonly [45, 35, 25, 10, 5, 2.5]

normalizeTargetWeight(requested: number): number
calculateSideWeight(total: number): number
calculateDefaultPlates(total: number): PlateConfiguration
calculateOptimizedPlates(total: number): PlateConfiguration
hasOptimization(total: number): boolean
calculateTotalWeight(plates: readonly PlateWeight[]): number
sortPlates(plates: readonly PlateWeight[]): PlateConfiguration
```

Equivalent naming or a single result object is acceptable if it preserves the specified behaviors and separation.

## Behavioral specification

### Normalization

- Achievable totals are 45 and every 5 lb increment above it.
- Finite values below 45 normalize to 45.
- Choose the nearest achievable value.
- Exact midpoint ties choose the lower value.
- Do not use a default rounding primitive unless the tie-down behavior is made explicit.
- Non-finite programmatic inputs throw a documented error. String parsing is outside this slice.

Examples:

| Requested | Resolved |
| ---: | ---: |
| 42 | 45 |
| 45 | 45 |
| 137 | 135 |
| 137.5 | 135 |
| 138 | 140 |
| 142.5 | 140 |

### Default plates

Given an already normalized total:

1. Compute `(total − 45) / 2`.
2. Visit denominations in `[45, 35, 25, 10, 5, 2.5]` order.
3. At each denomination, take as many plates as fit in the remaining side load.
4. Return an exact, descending configuration.

Examples:

| Total | Side load | Default plates |
| ---: | ---: | --- |
| 45 | 0 | `[]` |
| 135 | 45 | `[45]` |
| 155 | 55 | `[45, 10]` |
| 165 | 60 | `[45, 10, 5]` |
| 185 | 70 | `[45, 25]` |
| 205 | 80 | `[45, 35]` |
| 225 | 90 | `[45, 45]` |

The 165 lb case is intentional. Greedy default behavior must not silently become a minimum-count algorithm.

### Optimization

- Find an exact configuration using the fewest plates.
- Treat inventory as unlimited.
- Among configurations with the same minimum count, prefer the one with more 45 lb plates; if tied, compare 35 lb counts, then 25, 10, 5, and 2.5.
- Return plates in descending order.
- `hasOptimization` is true only if the optimized result has fewer plates than the default result.

Required example:

```text
Total: 165 lb
Side load: 60 lb
Default:   [45, 10, 5]
Optimized: [35, 25]
hasOptimization: true
```

Calculations should use integer units of 2.5 lb internally where helpful so equality does not depend on imprecise floating-point accumulation.

### Reverse calculation

`calculateTotalWeight(plates)` returns `45 + 2 × sum(plates)`.

Examples:

| One-side plates | Total |
| --- | ---: |
| `[]` | 45 |
| `[45]` | 135 |
| `[45, 10]` | 155 |
| `[45, 45]` | 225 |
| `[45, 35, 2.5]` | 210 |

### Ordering and immutability

`sortPlates([10, 45, 5, 25])` returns `[45, 25, 10, 5]`. Public functions must not mutate input arrays or shared constants.

## Validation contract

- Calculation functions that accept totals expect normalized, achievable totals at or above 45.
- Unsupported plate values cannot be represented by the public `PlateWeight` type.
- Runtime validation shall reject invalid totals rather than returning a partial configuration.
- Error types/messages should be stable enough for tests but are not user-facing copy.

## Required tests

Vitest tests shall cover:

- all examples and acceptance criteria named above;
- midpoint tie-down behavior on more than one boundary;
- a value below bar weight;
- empty-bar and repeated-plate calculations;
- greedy results that are and are not already optimal;
- the 60 lb side-load optimization conflict;
- deterministic heavy-first tie-breaking for equal-count solutions;
- sorted outputs and input immutability;
- invalid/non-finite input handling;
- a representative range of achievable totals, asserting that every returned configuration exactly reconstructs its total.

Test titles should reference applicable acceptance-criteria IDs where practical.

## Non-goals

This slice does not include:

- React components or rendering;
- target input strings, focus, keypad, or validation messages;
- buttons, optimization presentation, or mode switching;
- CSS or plate visualization;
- state persistence;
- manifest, service worker, offline tests, or deployment;
- project-wide scaffolding beyond what is strictly needed to run the domain tests, unless separately authorized.

## Definition of done

- The exported calculation API is documented and framework-independent.
- All required Vitest tests pass.
- Type checking passes.
- No domain module imports React or browser APIs.
- Every returned plate configuration is exact, deterministic, descending, and immutable from the caller's perspective.
- The implementation is reviewed against this slice and its referenced requirements before UI work begins.

