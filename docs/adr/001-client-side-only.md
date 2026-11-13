# ADR-001: Use a Fully Client-Side Application

## Status

Accepted

## Context

All version 1 behavior consists of deterministic calculations and local interaction. The product requires offline use after its first successful load, but does not require accounts, shared data, synchronization, server-side processing, or centralized persistence.

## Decision

Implement the application entirely in the browser. The production artifact consists only of static HTML, JavaScript, CSS, manifest, icons, and service-worker assets.

Version 1 has no application server, backend API, database, authentication, or server-side rendering. Calculation logic and transient application state execute locally.

## Consequences

Positive consequences:

- calculator interactions have no network latency;
- normal use can remain fully offline;
- static hosting and deployment are simple;
- there is no backend infrastructure to operate or secure;
- initial hosting cost can remain effectively zero.

Negative consequences:

- data is not synchronized between devices;
- any later persistence is initially browser/device-specific;
- accounts or centralized features require adding a remote boundary later.

## Future considerations

Favorites and preferences may be stored locally through a small storage adapter without changing this decision. If cross-device synchronization is later required, a backend can be added while keeping the calculation engine client-side and framework-independent.

