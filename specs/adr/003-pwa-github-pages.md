# ADR-003: Deploy an Offline-Capable PWA on GitHub Pages

## Status

Accepted

## Context

The calculator is primarily used on a phone during workouts, including in locations with poor connectivity. It should be installable, launch in an app-like form where supported, function offline after its first successful load, and require minimal hosting infrastructure. The client-only build can be distributed as static files.

## Decision

Build the application as a Progressive Web App using `vite-plugin-pwa`, a Web App Manifest, and a service worker that precaches all assets required for core calculator behavior.

Use GitHub Pages as the initial production host and GitHub Actions for deployment. Configure Vite for repository project-path hosting rather than assuming the application is deployed at `/`.

Package all required JavaScript, CSS, icons, fonts (if any), and other runtime assets with the application. Core calculator behavior must not depend on a CDN or remote API.

## Offline behavior

After one successful online load has populated the cache, the following remain available offline:

- launching and reloading the application;
- switching modes;
- entering, incrementing, decrementing, and resolving a target;
- computing default and optimized plate configurations;
- adding and removing plates;
- calculating totals;
- rendering the barbell and plate visualization.

The first-ever load still requires access to the deployed static assets.

## Consequences

Positive consequences:

- the app is home-screen installable on supporting platforms;
- it remains useful in unreliable network conditions;
- hosting is inexpensive and operationally simple;
- the build remains portable to other static hosts.

Negative consequences:

- service-worker cache lifecycle and updates require explicit testing;
- a new deployment may not immediately control an already open client;
- project-path hosting requires correct base-path configuration;
- PWA installation behavior varies by browser and platform.

## Verification

Test installability, cached offline reload, all calculator actions while offline, update activation, and correct asset URLs from the GitHub Pages project path against a production build.

