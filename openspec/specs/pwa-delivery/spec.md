# pwa-delivery Specification

## Purpose

Makes the calculator installable, fully usable offline after one successful load, deployable as static assets to the `/plate-calculator/` GitHub Pages project path, verifiable from its build output, and safely updatable under the user's control.

## Requirements

### Requirement: Installability
The application SHALL provide a valid manifest, application name, icons, and standalone launch behavior where the platform supports PWA installation. (REQ-PWA-001)

#### Scenario: Installable on supporting platforms
- **WHEN** the production app is opened on a platform that supports PWA installation
- **THEN** a valid manifest with name and icons is detected without errors and the installed app launches standalone

### Requirement: Manifest contents
The manifest SHALL contain `id` `./`, `name` `Barbell Plate Calculator`, `short_name` `Plate Calculator`, `description` `Calculate barbell plate configurations and loaded weight.`, `lang` `en-US`, `start_url` `./`, `scope` `./`, `display` `standalone`, and black `background_color` and `theme_color`, with no orientation lock. (REQ-PWA-005)

#### Scenario: S6-AC-001 Installable manifest identity
- **WHEN** the production manifest is loaded from `/plate-calculator/`
- **THEN** it has the contracted name, short name, standalone display, and black colors, and its ID, start URL, and scope resolve within `/plate-calculator/`

### Requirement: Icons and document metadata
The app SHALL ship local opaque PNG icons: 192 and 512 pixel `any` icons, a distinct 512 pixel `maskable` icon with the mark in the safe area, and a 180 pixel Apple touch icon. Icons show the white barbell mark on black with no text. `index.html` SHALL add a black `theme-color` and a project-path-safe Apple touch icon link. (REQ-PWA-006)

#### Scenario: S6-AC-002 Complete local icon set
- **WHEN** the manifest and document metadata are inspected
- **THEN** the 192, 512, distinct maskable 512, and 180 Apple touch PNGs exist at the project path with no remote dependency

#### Scenario: No duplicate injection
- **WHEN** the built document is inspected
- **THEN** it has exactly one manifest link and one service-worker registration

### Requirement: Offline operation
After a successful online load has cached the current application assets, every version 1 calculator behavior SHALL work without a network connection. Offline support begins once the page is controlled by an activated service worker with a complete precache; a first-ever offline visit may fail. (REQ-PWA-002)

#### Scenario: S6-AC-007 Cached offline launch and reload
- **WHEN** the network is disabled after the online-load boundary and the app is launched or reloaded at `/plate-calculator/`
- **THEN** the full calculator renders instead of a network error, in the Target → Plates 45 lb initial state

#### Scenario: S6-AC-008 Complete offline target workflow
- **WHEN** the cached app is offline and the user enters, steps, normalizes, and recovers targets and activates `Reduce plates`
- **THEN** calculations, feedback, visualization, layout, and focus behave as online

#### Scenario: S6-AC-009 Complete offline reverse workflow
- **WHEN** the cached app is offline and the user switches modes, adds, removes, duplicates, resets, and optimizes plates
- **THEN** totals, ordering, visualization, overflow, action availability, and focus recovery behave as online

### Requirement: Static hosting
The production build SHALL use the base path `/plate-calculator/` and be deployable as static assets to `https://nhalase.github.io/plate-calculator/`. Core behavior SHALL NOT require remotely hosted scripts, styles, fonts, images, APIs, or CDNs, and no client-side routing fallback is needed. (REQ-PWA-003)

#### Scenario: S6-AC-003 GitHub Pages project-path safety
- **WHEN** the production build is served beneath `/plate-calculator/` and its HTML, manifest, scripts, styles, icons, and service worker are requested
- **THEN** every request resolves within that path and none resolves to the origin root

#### Scenario: S6-AC-005 No runtime network dependency
- **WHEN** the production output is inspected
- **THEN** it requires no remote script, stylesheet, font, image, API, CDN, or backend

### Requirement: Production-only registration and progressive enhancement
A `vite-plugin-pwa` generated service worker SHALL register automatically only in production, scoped to the configured base. The Vite dev server MUST NOT register it. Unsupported or failed registration SHALL leave a working website with no install, offline, or update UI. (REQ-PWA-007)

#### Scenario: S6-AC-010 Progressive enhancement
- **WHEN** service workers are unsupported or registration fails
- **THEN** both modes work as an ordinary website and no install, offline, or update UI appears

#### Scenario: Development unaffected
- **WHEN** the app runs on the Vite dev server
- **THEN** no service worker is registered

### Requirement: Application-shell precache
The service worker SHALL precache built HTML, JS, CSS, PNG, and manifest files, with its Workbox runtime inlined and navigation falling back to the cached entry. It MUST NOT precache source, tests, specs, screenshots, coverage, dependencies, or repo metadata, or add runtime caching routes. (REQ-PWA-008)

#### Scenario: S6-AC-004 Complete application-shell precache
- **WHEN** a fresh build's service worker is inspected and installed
- **THEN** the HTML, JS, CSS, manifest, icons, and runtime assets are cached and repository files are excluded

### Requirement: User-controlled updates
While online, the installed application SHALL check for a newer service worker and visibly notify the user once a complete new application shell is ready. The current session SHALL continue unchanged until the user explicitly activates the update. (REQ-PWA-004)

#### Scenario: AC-PWA-004-1 Update check triggers
- **WHEN** the app registers in production, connectivity returns, the document returns to the foreground, or an hour passes while visible and online
- **THEN** it checks for a newer service worker

#### Scenario: AC-PWA-004-2 Update notice
- **WHEN** an update is ready
- **THEN** a persistent, keyboard-accessible `Update app` action appears without moving calculator content or taking focus

#### Scenario: AC-PWA-004-3 Ignoring the notice
- **WHEN** the user ignores the update notice
- **THEN** the current document and calculator state are unchanged

#### Scenario: AC-PWA-004-4 Applying the update
- **WHEN** the user activates `Update app`
- **THEN** the fully installed worker is promoted and the app reloads into one coherent new application shell

#### Scenario: AC-PWA-004-5 Failed or offline check
- **WHEN** an update check fails or the device is offline
- **THEN** offline operation and the previously cached application remain available

#### Scenario: S6-AC-006 Detectable, user-controlled coherent updates
- **WHEN** build A controls the app and a check fully installs build B
- **THEN** build A and its state stay active, a non-focus-stealing notice offers `Update app`, activating it shows `Updating…` and reloads once into build B, and obsolete app caches are removed

### Requirement: Update check mechanics
Checks SHALL run only while visible, online, and not installing, at least five minutes apart, with the hourly check rescheduled after each attempt. Listeners SHALL be installed once, outside React. Each check SHALL fetch the worker URL with `cache: 'no-store'` and call `registration.update()` only on success, failing silently. (REQ-PWA-009)

#### Scenario: Throttled checks
- **WHEN** several triggers fire within five minutes
- **THEN** only one check begins

#### Scenario: Silent failure
- **WHEN** the worker fetch fails, returns non-success, the device is offline, or a worker is already installing
- **THEN** the check ends silently with no UI change and no state change

### Requirement: Update notice and activation
The notice SHALL show `Update available` and one native `Update app` button, at least 44 by 44, as a polite status fixed above the bottom safe area, with page-end space always reserved. It has no dismiss action. Activation SHALL disable the button, show `Updating…`, and reload once; failure SHALL restore a retryable `Update app`. (REQ-PWA-010)

#### Scenario: No notice without an update
- **WHEN** the app becomes ready offline, registration fails, the device is offline, or a check finds nothing
- **THEN** no update notice appears

#### Scenario: Activation failure
- **WHEN** activating the update fails before reload
- **THEN** the notice returns to `Update available` with an enabled `Update app` and the cached app keeps working

#### Scenario: Coherent cache replacement
- **WHEN** the new worker activates
- **THEN** obsolete caches owned by this app are deleted, unrelated caches are kept, and old HTML is never combined with missing new assets

### Requirement: GitHub Pages deployment workflow
`.github/workflows/deploy-pages.yml` SHALL run on pushes to `main` and manual dispatch, use one `pages` concurrency group that cancels in-progress runs, and grant only `contents: read`, `pages: write`, and `id-token: write`. It SHALL install from the frozen lockfile, typecheck, test, build, verify, and deploy only `dist/` via official Pages actions. (REQ-PWA-011)

#### Scenario: S6-AC-011 Main-branch Pages deployment
- **WHEN** an authorized commit reaches `main`
- **THEN** the workflow installs, type-checks, tests, builds, verifies, uploads only `dist/`, and deploys to the `github-pages` environment with least privilege

#### Scenario: No deployment branch
- **WHEN** the workflow runs
- **THEN** it commits no `dist/` files, publishes no `gh-pages` branch, needs no personal access token, and does not deploy pull requests

### Requirement: Build artifact verification
`pnpm run verify:pwa` SHALL inspect `dist/`, `vite.config.ts`, and the Pages workflow without a server, list every failure, and exit nonzero if URLs, manifest, icons, worker, precache, remote URLs, PWA config, or workflow steps are wrong. It MUST discover hashed asset names, not hard-code them. (REQ-PWA-012)

#### Scenario: Verifier catches an origin-root path
- **WHEN** the built output references `/assets/`, `/manifest.webmanifest`, or `/sw.js` at the origin root
- **THEN** `verify:pwa` fails with a diagnostic naming the problem

#### Scenario: S6-AC-012 No calculator persistence or regression
- **WHEN** the app reloads online or from cache
- **THEN** calculator state returns to its initial state, no application-data persistence exists, and all earlier automated tests still pass
