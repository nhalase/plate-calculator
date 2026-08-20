# Slice 006: PWA, Offline Operation, and GitHub Pages

## Status

Approved and implemented

## Goal

Complete the Version 1 delivery boundary by making the existing calculator installable as a Progressive Web App, fully usable offline after one successful online load, safe to update, and deployable to the GitHub Pages project path for `nhalase/plate-calculator`.

This slice packages and publishes the already completed application. It shall not change calculation results, calculator state transitions, interaction behavior, or the approved Slice 005 interface.

## Dependencies

- Slice 001 is approved, implemented, and verified.
- Slice 002 is approved, implemented, and verified.
- Slice 003 is approved, implemented, and verified.
- Slice 004 is approved, implemented, and verified.
- Slice 005 is approved, implemented, and verified.
- [ADR-001: Fully client-side application](../adr/001-client-side-only.md) remains binding.
- [ADR-002: React, TypeScript, Vite, Vitest, and plain CSS](../adr/002-react-typescript-vite.md) remains binding.
- [ADR-003: Offline PWA on GitHub Pages](../adr/003-pwa-github-pages.md) governs the delivery model.

## Requirements covered

This slice completes:

- REQ-PWA-001 — Installability;
- REQ-PWA-002 — Offline operation;
- REQ-PWA-003 — Static hosting.

It also verifies that every Version 1 behavior delivered by Slices 001 through 005 remains available from the deployed, cached production application.

## Scope

This slice includes:

- adding `vite-plugin-pwa` to the existing Vite build;
- generating a standards-based web app manifest;
- providing local application icons for ordinary, maskable, and Apple touch contexts;
- registering a production service worker;
- precaching the complete local application shell;
- supporting offline launch and reload after one successful controlled online load;
- defining automatic service-worker update and outdated-cache cleanup behavior;
- configuring Vite for the GitHub Pages `/plate-calculator/` project path;
- adding a GitHub Actions workflow that builds and deploys `dist/` to GitHub Pages;
- adding deterministic build-artifact verification;
- verifying the installed and offline production experience in a real browser.

## Explicit non-goals

This slice does not include:

- new calculator behavior or domain rules;
- any visual redesign or new navigation;
- an Install button, installation tutorial, offline badge, update banner, toast, or settings screen;
- persistence of calculator state across reloads or launches;
- local storage, IndexedDB application data, accounts, synchronization, or a backend;
- runtime caching of third-party resources or APIs;
- push notifications, background sync, periodic sync, share targets, file handlers, or protocol handlers;
- analytics, telemetry, error reporting, or advertising;
- client-side routing or a `404.html` fallback;
- a custom domain;
- native App Store packaging;
- Slice 007 or later work.

Service-worker Cache Storage is permitted only for the static application assets required by this slice. It is not application-state persistence.

## Delivery environments

### Development

The normal Vite development server shall not register or run the production service worker. Hot module replacement and ordinary development refreshes shall not be affected by stale production caches.

### Production build and preview

The production build shall use `/plate-calculator/` as its Vite base path. Local production verification shall therefore open the application at a URL equivalent to:

```text
http://127.0.0.1:<port>/plate-calculator/
```

All generated document, script, stylesheet, manifest, icon, and service-worker references shall resolve correctly from that project path. The local preview root is not the production contract.

### GitHub Pages

The deployment target is the project site for:

```text
https://github.com/nhalase/plate-calculator
```

The expected public application path is:

```text
https://nhalase.github.io/plate-calculator/
```

Repository renaming or custom-domain support is outside this slice and would require an explicit base-path decision.

## Package and configuration contract

The implementation shall add `vite-plugin-pwa` as a development dependency and update the lockfile through the repository's existing `pnpm` workflow.

`vite.config.ts` shall retain the existing React and Vitest configuration and add:

- production base path `/plate-calculator/`;
- the PWA plugin;
- manifest generation;
- production service-worker registration;
- precaching and obsolete-cache cleanup;
- an automatic-update registration strategy;
- no enabled service worker during normal development.

The implementation shall use the plugin's generated-service-worker strategy. A hand-authored service worker is not required because Version 1 has no runtime API, routing, or custom caching requirement.

## Manifest contract

The generated manifest shall contain values equivalent to:

| Field | Required value |
| --- | --- |
| `id` | `./` |
| `name` | `Barbell Plate Calculator` |
| `short_name` | `Plate Calculator` |
| `description` | `Calculate barbell plate configurations and loaded weight.` |
| `lang` | `en-US` |
| `start_url` | `./` |
| `scope` | `./` |
| `display` | `standalone` |
| `background_color` | `#000000` |
| `theme_color` | `#000000` |

No orientation lock is required. The installed application shall continue supporting portrait and responsive layouts rather than rejecting another orientation.

The relative `id`, `start_url`, and `scope` values shall resolve inside `/plate-calculator/`; none may resolve to the origin root.

The manifest shall contain all of these icon purposes:

- a 192 by 192 PNG with purpose `any`;
- a 512 by 512 PNG with purpose `any`;
- a distinct 512 by 512 PNG with purpose `maskable`.

The manifest shall not reference remote assets, SVG icons, missing files, or files outside the GitHub Pages project path.

## Icon and document metadata contract

The application shall provide these local raster assets under `public/` or an equivalent Vite-managed static location:

```text
pwa-192x192.png
pwa-512x512.png
pwa-maskable-512x512.png
apple-touch-icon.png
```

`apple-touch-icon.png` shall be 180 by 180 CSS-independent image pixels.

The icon design shall translate the approved Slice 005 brand into a simple app icon:

- black background matching the application page;
- white barbell mark derived from the CSS-rendered header mark;
- no text at icon scale;
- no external artwork or trademarked asset;
- opaque PNG output;
- the maskable icon's essential mark remains inside the central safe area so platform masks do not crop it.

Raster files are required here because operating systems consume app icons as packaged assets. They do not replace the CSS-rendered in-app logo and do not authorize raster UI artwork.

`index.html` shall retain the existing language, viewport, title, root element, and module entry. It shall also provide:

- a black `theme-color` meta value;
- a project-path-safe Apple touch icon reference;
- no remote font, stylesheet, script, icon, or metadata dependency.

The PWA plugin may inject the manifest and registration references. The implementation shall not add duplicate manifest links or duplicate service-worker registrations.

## Service-worker registration contract

The service worker shall be registered only in a production build.

Registration shall:

- use the `/plate-calculator/` scope;
- be derived from the configured Vite base rather than a hard-coded origin-root URL;
- occur automatically without an extra user action;
- fail without breaking the online calculator if service workers are unsupported or registration is rejected;
- create no visible status, install, or update UI;
- create no duplicate registrations during a normal page lifetime.

The application shall remain an ordinary functional website in browsers that do not support PWA installation or service workers.

## Precache contract

The generated service worker shall precache the complete production application shell needed to run both modes:

- the built HTML entry;
- every generated local JavaScript chunk;
- every generated local stylesheet;
- the manifest;
- all packaged application icons and other local runtime assets;
- any generated Workbox runtime file required by the service worker.

The build shall not precache source files, tests, specifications, screenshots, coverage, dependency directories, repository metadata, or GitHub workflow files.

The application has no runtime API or remote resource dependency. Therefore:

- no third-party runtime-caching route shall be added;
- no CDN fallback shall be added;
- no network-first API rule shall be added;
- no special offline HTML page shall replace the application shell.

Navigation to the in-scope application start URL while offline shall resolve to the cached application entry.

## First-load and offline boundary

Offline support begins only after all of these have occurred:

1. the production application loads successfully while online;
2. its service worker installs and activates successfully;
3. the application is under service-worker control;
4. the required precache completes.

The first-ever visit is allowed to fail when the device has no network and no prior cache.

After the boundary is satisfied, disabling the network and reloading or relaunching the in-scope application shall render the complete calculator rather than a browser network-error page.

## Required offline behavior

From a successfully cached production build, all of the following shall work with the network disabled:

- initial rendering at the GitHub Pages project path;
- the approved Slice 005 layout, local styles, brand mark, and plate colors;
- Target → Plates mode at the 45 lb initial state;
- target increment and decrement;
- direct target entry, validation, normalization, midpoint tie behavior, and invalid-input recovery;
- default greedy plate calculation;
- `Reduce plates` availability and activation;
- switching to Plates → Total and back without reload;
- adding every supported denomination, including duplicates;
- removing individual graphical plates;
- reverse total calculation;
- `Optimize` availability and activation;
- barbell rendering, plate order, plate labels, internal overflow, and focus recovery.

Fresh application state remains intentional. Reloading or relaunching offline shall return to the established initial mode and calculator values because Version 1 does not persist calculator state.

## Automatic update behavior

This slice shall use automatic service-worker updates and shall not introduce update UI.

When a newer deployment is discovered online:

- the new worker and its complete new precache shall install before taking control;
- the new worker shall become active without requiring the user to find or confirm an update prompt;
- obsolete versioned caches owned by this application shall be removed after the replacement activates;
- the next navigation or reload shall use one coherent new application shell;
- the update flow shall not combine an old HTML entry with missing new hashed assets;
- unrelated caches from another origin or application shall never be deleted.

An already rendered document may continue using the assets it has loaded until navigation or reload. This slice does not force an interruption during an active calculation and does not preserve that calculation across an eventual reload.

## GitHub Pages workflow contract

Add one workflow at:

```text
.github/workflows/deploy-pages.yml
```

The workflow shall:

- run on pushes to `main`;
- support manual `workflow_dispatch`;
- use one deployment concurrency group and prevent overlapping Pages deployments;
- grant `contents: read`, `pages: write`, and `id-token: write` permissions only;
- check out the repository;
- install the repository's declared pnpm version and a supported Node LTS version;
- enable pnpm dependency caching;
- install dependencies with the frozen lockfile;
- run type checking;
- run the complete Vitest suite;
- build the production application;
- run the deterministic PWA artifact verifier;
- configure GitHub Pages;
- upload only `dist/` as the Pages artifact;
- deploy that artifact to the `github-pages` environment;
- expose the deployment URL through the environment deployment record.

The workflow shall use official GitHub Pages actions for configuration, artifact upload, and deployment. It shall not commit generated `dist/` files to `main`, publish a separate `gh-pages` branch, require a personal access token, or deploy pull-request builds.

GitHub repository Pages settings must use **GitHub Actions** as the source. That external repository setting cannot be guaranteed by source code; it shall be recorded as a release prerequisite and verified when the first deployment runs.

## Artifact verification contract

Add a repository script callable through pnpm, equivalent to:

```text
pnpm run verify:pwa
```

The verifier shall inspect the production `dist/` output without starting a development server. It shall fail with a nonzero exit code and a specific diagnostic when any required invariant is absent.

At minimum it shall verify:

- `dist/index.html` exists;
- built document asset references use `/plate-calculator/` rather than origin-root application paths;
- a manifest exists and parses as JSON;
- every required manifest field has the contracted value;
- manifest `id`, `start_url`, and `scope` remain inside the project path when resolved;
- every manifest icon entry identifies an emitted PNG with the declared dimensions and purpose;
- the Apple touch icon is emitted and is 180 by 180;
- a generated service worker exists;
- the built document registers or references the generated service worker through the project base;
- the service worker's precache includes the built HTML, JavaScript, CSS, and packaged icons;
- the output contains no `http://` or `https://` runtime dependency required by the application;
- no expected asset reference escapes to `/assets/`, `/manifest.webmanifest`, `/sw.js`, or another origin-root application path.

The verifier shall not depend on filenames containing a particular content hash. It shall discover emitted hashed assets from the built document and manifest.

## Automated test contract

All existing Slice 001 through Slice 005 tests shall remain green.

New automated coverage shall map assertions to these Slice 006 acceptance criteria:

- S6-AC-001: exact manifest identity, display, colors, start URL, and scope;
- S6-AC-002: icon presence, declared dimensions, purposes, and Apple touch icon;
- S6-AC-003: project-path-safe HTML and asset URLs;
- S6-AC-004: generated service worker and application-shell precache;
- S6-AC-005: absence of remote runtime dependencies;
- S6-AC-006: automatic update and outdated-cache configuration;
- S6-AC-011: workflow triggers, permissions, commands, artifact path, and Pages deployment job;
- S6-AC-012: development service worker remains disabled and existing application code remains free of persistence behavior.

Static configuration tests may inspect authored configuration and workflow data. Production artifact assertions shall inspect a freshly generated `dist/` directory. Tests shall not assert incidental Workbox hashes or minified implementation text when an observable file or configuration contract can be asserted instead.

S6-AC-007 through S6-AC-010 require real-browser production verification because jsdom and static artifact inspection cannot prove service-worker control, offline navigation, installed display behavior, or cache-version transitions.

## Required real-browser verification

Use a fresh browser context and a production server that serves the application at `/plate-calculator/`.

### Installability and scope

1. Load `/plate-calculator/` online.
2. Confirm the manifest is detected without errors.
3. Confirm the service worker installs, activates, controls the page, and uses the `/plate-calculator/` scope.
4. Confirm the manifest start URL resolves to `/plate-calculator/`, not `/`.
5. Confirm the 192, 512, maskable, and Apple touch icons return successfully with correct MIME types.
6. Where the browser exposes installation diagnostics, confirm there is no manifest or service-worker installability error.

### Offline reload

1. Complete the successful online-load boundary and confirm the controller is active.
2. Disable the network through browser emulation.
3. Reload `/plate-calculator/`.
4. Confirm the application renders with its local CSS and no failed required resource.
5. Confirm the browser console has no application error.
6. Confirm a fresh offline reload returns to the expected 45 lb Target → Plates initial state.

### Offline target workflow

While still offline:

1. Enter `137.5` and confirm it resolves downward to 135 with adjustment feedback.
2. Enter 165 and confirm default `45 + 10 + 5`.
3. Activate `Reduce plates` and confirm `35 + 25` without changing 165.
4. Exercise `−5`, `+5`, invalid-input recovery, and mode switching.

### Offline reverse workflow

While still offline:

1. Switch to Plates → Total.
2. Add 35 and 25 and confirm total 165 and visible Optimize.
3. Remove and re-add a graphical plate and confirm total, ordering, and focus behavior.
4. Activate Optimize and confirm `45 + 10 + 5`, unchanged total 165, and correct focus recovery.
5. Add duplicates and enough plates to confirm the visualization still overflows internally.

### Update lifecycle

Use two distinguishable production builds or equivalent controlled service-worker fixtures:

1. Load and control the page with build A.
2. Serve build B at the same origin and project path.
3. Restore online access and trigger the normal update check through navigation or reload.
4. Confirm build B installs and becomes active without an application prompt.
5. Confirm the next navigation or reload returns build B with all required assets.
6. Confirm the old application cache is removed and no mixed-version resource error occurs.

### Deployed Pages verification

After an explicitly authorized push to `main` and a successful deployment:

1. Confirm the GitHub Actions workflow succeeds.
2. Open `https://nhalase.github.io/plate-calculator/`.
3. Confirm no redirect escapes the project path.
4. Confirm the app, manifest, icons, and service worker return successfully.
5. Repeat the cached offline reload and representative target/reverse calculations against the deployed origin.

## Acceptance criteria

### S6-AC-001 — Installable manifest identity

Given the production application manifest is loaded from `/plate-calculator/`,
then it identifies `Barbell Plate Calculator`,
uses `Plate Calculator` as the short name,
uses standalone display with black background and theme colors,
and its ID, start URL, and scope resolve within `/plate-calculator/`.

Maps to REQ-PWA-001 and REQ-PWA-003.

### S6-AC-002 — Complete local icon set

Given the manifest and document metadata are inspected,
then local 192 by 192 and 512 by 512 ordinary PNG icons are present,
and a distinct 512 by 512 maskable PNG is present,
and a local 180 by 180 Apple touch icon is present,
and every declared file exists at the project path with no remote dependency.

Maps to REQ-PWA-001 and REQ-PWA-003.

### S6-AC-003 — GitHub Pages project-path safety

Given a production build is served beneath `/plate-calculator/`,
when its HTML, manifest, registration, scripts, styles, icons, and service worker are requested,
then every request resolves successfully within that project path,
and no required application URL incorrectly resolves to the origin root.

Maps to REQ-PWA-003.

### S6-AC-004 — Complete application-shell precache

Given a fresh production build,
when its generated service worker is inspected and installed,
then the HTML entry, every local JavaScript and CSS asset, manifest, icons, and required service-worker runtime assets are available from the application cache,
and source, test, specification, screenshot, workflow, and repository files are excluded.

Maps to REQ-PWA-002 and REQ-PWA-003.

### S6-AC-005 — No runtime network dependency

Given the production output is inspected,
then the calculator requires no remote script, stylesheet, font, image, API, or CDN resource,
and core behavior does not depend on a backend.

Maps to REQ-PWA-002 and REQ-PWA-003.

### S6-AC-006 — Coherent automatic updates

Given build A currently controls the application and build B becomes available online,
when the normal service-worker update lifecycle runs,
then build B installs and activates without an in-app confirmation prompt,
and the next navigation or reload uses build B's coherent shell,
and obsolete application caches are removed without deleting unrelated caches.

Maps to REQ-PWA-002.

### S6-AC-007 — Cached offline launch and reload

Given one successful online production load has completed service-worker activation and precaching,
when the network is disabled and the application is launched or reloaded at `/plate-calculator/`,
then the complete calculator renders rather than a network-error page,
and it starts in the established Target → Plates 45 lb state.

Maps to REQ-PWA-002.

### S6-AC-008 — Complete offline target workflow

Given the cached application is offline,
when the user enters, increments, decrements, normalizes, and recovers target values and activates Reduce plates where available,
then all established target calculations, feedback, visualization, layout, and focus behavior remain correct.

Maps to REQ-PWA-002.

### S6-AC-009 — Complete offline reverse workflow

Given the cached application is offline,
when the user switches modes, adds, removes, duplicates, and optimizes plates,
then totals, ordering, visualization, internal overflow, action availability, and focus recovery remain correct.

Maps to REQ-PWA-002.

### S6-AC-010 — Progressive enhancement

Given service workers or PWA installation are unsupported or registration fails,
when the application is loaded online,
then both calculator modes remain functional as an ordinary website,
and no installability or offline-only UI is shown.

Maps to REQ-PWA-001 and REQ-PWA-002.

### S6-AC-011 — Main-branch Pages deployment

Given an authorized commit reaches `main`,
when the Pages workflow runs,
then it installs from the frozen lockfile, type-checks, tests, builds, verifies, uploads only `dist/`, and deploys through the `github-pages` environment with least-privilege permissions,
and the application is served from `https://nhalase.github.io/plate-calculator/`.

Maps to REQ-PWA-003.

### S6-AC-012 — No calculator persistence or regression

Given the application is reloaded online or from cache,
then calculator state returns to the established initial state,
and no local-storage or application-data persistence has been introduced,
and all Slice 001 through Slice 005 automated tests still pass.

Protects the Version 1 non-requirements and all previous slice contracts.

## Verification commands

The implementation plan shall use the repository's actual scripts. At minimum, local verification shall include commands equivalent to:

```text
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm test
pnpm run build
pnpm run verify:pwa
pnpm exec vite preview --host 127.0.0.1
```

The implementation plan shall identify any additional command used to test service-worker update fixtures or inspect the deployed GitHub Pages workflow.

## Definition of done

Slice 006 is complete when:

- the exact manifest and local icon contracts are implemented;
- production assets and registration are project-path safe;
- the generated service worker controls the production application and precaches its complete shell;
- offline reload and every representative workflow pass in a real browser;
- automatic update replacement and obsolete-cache cleanup are verified;
- the artifact verifier passes against a fresh build;
- all prior automated tests remain green;
- the GitHub Pages workflow is present and locally reviewable;
- after an explicitly authorized push, the workflow and deployed project URL are verified;
- no calculator behavior, UI scope, persistence, remote dependency, or later-slice feature is introduced.

## Deterministic decisions

This specification resolves the implementation choices as follows:

- the fixed production base is `/plate-calculator/`;
- the manifest uses relative in-scope ID, start URL, and scope values;
- installation uses packaged PNG icons, including a distinct maskable icon;
- the application remains orientation-responsive rather than locked;
- the service worker is generated by `vite-plugin-pwa` and disabled in normal development;
- all required runtime assets are precached and no remote runtime caching is added;
- update activation is automatic and has no application UI;
- reloads intentionally reset calculator state;
- GitHub Actions deploys `dist/` directly to Pages from `main` without a deployment branch;
- Pages repository settings remain a documented external prerequisite;
- deployment and push remain separately authorized actions even though the workflow is part of the slice.

No ambiguity or contradiction remains that prevents an implementation plan.
