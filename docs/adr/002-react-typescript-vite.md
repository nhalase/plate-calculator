# ADR-002: Use React, TypeScript, Vite, Vitest, and Plain CSS

## Status

Accepted

## Context

The initial calculator is small, but its two modes share visual and interaction patterns, and anticipated future work may introduce favorites, customization, and persistent preferences. The application should remain lightweight while providing a maintainable state-driven UI and a strongly typed, independently testable domain.

## Decision

Use:

- React for components and UI state;
- TypeScript for UI and domain logic;
- Vite for development and production builds;
- Vitest for automated tests;
- plain application-local CSS for styling.

Core calculation rules live in framework-independent TypeScript modules. React components consume those modules but do not define or duplicate the rules.

Version 1 does not introduce React Router, Redux, Zustand, MobX, a CSS framework, or a large component library without a new concrete requirement and decision.

## Consequences

Positive consequences:

- UI follows a declarative component and state model;
- future favorites and customization fit the chosen structure;
- domain concepts and interfaces are strongly typed;
- calculations can be tested without rendering React;
- the development and build setup remains compact;
- static deployment remains straightforward.

Negative consequences:

- React adds runtime and conceptual overhead beyond the minimum needed for a calculator;
- the application has more dependencies than an equivalent vanilla TypeScript implementation;
- discipline is required to keep calculation logic out of components.

