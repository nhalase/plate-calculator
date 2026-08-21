# Slice 006: PWA, Offline Operation, and GitHub Pages — Implementation Plan

## Status

Approved and implemented

## Source specification

[Slice 006: PWA, Offline Operation, and GitHub Pages](../slices/006-pwa-offline-and-github-pages.md)

This plan implements the amended Slice 006 release boundary without changing the completed calculator domain or calculator state model. It adds only the contracted update notice and explicit reload action to the Slice 005 interface.

## Scope

Retain the generated offline-capable PWA build, deterministic local app icons, `/plate-calculator/` production-path handling, build-artifact verification, and least-privilege GitHub Pages workflow. Add explicit update detection, a stable update notice, and user-controlled activation while preserving all offline workflows.

Do not add application persistence, a custom service worker, install UI, offline-status UI, client-side routing, runtime APIs, remote assets, telemetry, a custom domain, new calculator behavior, visual redesign beyond the update notice, or later-slice placeholders.

## Authoritative implementation choices

The plan uses the following approved choices:

- Vite production base: `/plate-calculator/`.
- PWA strategy: `generateSW` through `vite-plugin-pwa`.
- Registration strategy: application-owned production registration through `virtual:pwa-register` with the prompt lifecycle; disable plugin-injected registration.
- Update checks: registration completion, `online`, return to visible state, and 60 minutes after the most recent attempt while visible and online, with a five-minute minimum between attempts.
- Current-page update behavior: show `Update available` only after a complete worker is waiting; reload only when the user activates `Update app`.
- Cache strategy: precache-only application shell with navigation fallback; no runtime API or third-party caching routes.
- Icon format: deterministic opaque PNG files generated locally from the approved barbell mark.
- Deployment: official GitHub Pages artifact workflow from `main`; no committed `dist/` and no `gh-pages` branch.
- Package manager: declare and use the repository's current exact pnpm version, `pnpm@11.19.0`.
- CI runtime: Node 24, a supported LTS line compatible with the current Vite toolchain.
- Action families: current official major releases available when this plan was authored—`actions/checkout@v6`, `pnpm/action-setup@v6`, `actions/setup-node@v7`, `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`, and `actions/deploy-pages@v5`.

Action revisions may be pinned to immutable commit SHAs during implementation. If pinned, an adjacent comment shall identify the approved major release, and verification shall accept the immutable revision rather than require a mutable tag literal.

## Files to create or modify

### Specification records

#### `specs/slices/006-pwa-offline-and-github-pages.md`

- Already changed from `Proposed` to `Approved` when this plan was authored.
- After implementation and every local check passes, change to `Approved and implemented`.
- Do not mark deployed verification complete until an explicitly authorized push has produced a successful Pages deployment.

#### `specs/plans/006-pwa-offline-and-github-pages-plan.md`

- This file records the implementation boundary and verification mapping.
- Keep `Ready for approval` until the user approves implementation.
- Change to `Approved` when implementation is authorized.
- Change to `Approved and implemented` only after the local definition of done passes.

### Package metadata

#### `package.json`

- Add `"packageManager": "pnpm@11.19.0"`.
- Add `vite-plugin-pwa` as a development dependency through pnpm; do not hand-edit its resolved version.
- Add `workbox-window` as an explicit development dependency because application-owned `virtual:pwa-register` code imports it at runtime under pnpm's strict dependency layout.
- Add `"generate:icons": "node scripts/generate-pwa-icons.mjs"`.
- Add `"verify:pwa": "node scripts/verify-pwa.mjs"`.
- Preserve the existing `dev`, `build`, `test`, and `typecheck` commands.
- Do not add a deployment command that writes to GitHub; deployment remains a workflow responsibility.

#### `pnpm-lock.yaml`

- Regenerate only through package-manager operations that install `vite-plugin-pwa` and the explicit `workbox-window` registration runtime.
- Confirm the lockfile remains version 9 and a subsequent `pnpm install --frozen-lockfile` succeeds.
- Do not update unrelated dependencies deliberately.

### Vite and PWA configuration

#### `vite.config.ts`

- Import `VitePWA` from `vite-plugin-pwa`.
- Set top-level `base: '/plate-calculator/'`.
- Preserve `react()` and the existing Vitest `environment` and `setupFiles` settings.
- Add one `VitePWA` plugin after `react()`.
- Do not enable `devOptions.enabled`; the normal development server must remain service-worker-free.

Use configuration equivalent to:

```ts
VitePWA({
  registerType: 'prompt',
  injectRegister: false,
  strategies: 'generateSW',
  includeAssets: [
    'pwa-192x192.png',
    'pwa-512x512.png',
    'pwa-maskable-512x512.png',
    'apple-touch-icon.png',
  ],
  manifest: { /* exact Slice 006 manifest values */ },
  workbox: {
    cleanupOutdatedCaches: true,
    globPatterns: ['**/*.{html,js,css,png,webmanifest}'],
    navigateFallback: 'index.html',
  },
})
```

The manifest shall use:

```ts
{
  id: './',
  name: 'Barbell Plate Calculator',
  short_name: 'Plate Calculator',
  description: 'Calculate barbell plate configurations and loaded weight.',
  lang: 'en-US',
  start_url: './',
  scope: './',
  display: 'standalone',
  background_color: '#000000',
  theme_color: '#000000',
  icons: [
    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}
```

Do not add `orientation`, screenshots, shortcuts, categories, share targets, handlers, or unrelated manifest fields.

`generateSW` supplies outdated-cache cleanup by default, but keep `cleanupOutdatedCaches: true` explicit because it is an acceptance criterion and artifact-verifier input.

#### `src/main.tsx`

Import and call `initializePwaUpdates()` before or after the initial React render. The initializer is production-safe and internally guarded, so React Strict Mode and repeated imports cannot create duplicate registrations, timers, or listeners.

Do not call the virtual registration helper directly from a React effect.

#### `src/vite-env.d.ts` and `tsconfig.json`

Add the `vite-plugin-pwa/client` type reference needed by `virtual:pwa-register`. Preserve all existing compiler options.

#### `src/pwa.ts`

Create the single registration and update-state boundary. It shall:

- import `registerSW` from `virtual:pwa-register`;
- guard initialization at module scope;
- expose `initializePwaUpdates()`, `subscribeToPwaUpdates(listener)`, `getPwaUpdateSnapshot()`, and `applyPwaUpdate()`;
- represent UI state as `'idle' | 'ready' | 'applying'`;
- retain the helper-returned update function and the `ServiceWorkerRegistration` without placing either in React state;
- request checks through one throttled function using a five-minute minimum and one rescheduled 60-minute timer;
- check only while online, visible, and not already installing;
- fetch `swUrl` with `cache: 'no-store'` and no-cache request headers before `registration.update()`;
- attach exactly one `online` listener, one `visibilitychange` listener, and one scheduled timer;
- set state to `ready` only from `onNeedRefresh`;
- ignore `onOfflineReady` for visible UI;
- set state to `applying` before calling the helper update function with reload enabled;
- return to `ready` if that promise rejects before reload;
- treat unsupported service workers and registration/check failures as silent progressive-enhancement fallbacks;
- export no calculator state and write nothing to local storage, IndexedDB, or Cache Storage directly.

#### `src/components/UpdateNotice.tsx`

Create one presentation component that subscribes to the external update snapshot with `useSyncExternalStore` or an equivalent tear-free subscription. It shall render nothing for `idle` and otherwise render:

- a fixed container with `role="status"` and `aria-live="polite"`;
- visible `Update available` text;
- a native `Update app` button while ready;
- a disabled `Updating…` button while applying.

The notice shall not autofocus, trap focus, include a dismiss control, or own registration logic.

#### `src/App.tsx`

Render `UpdateNotice` once at the application-shell boundary, outside the mode-specific calculators. Preserve both calculators' mounting, mode retention, and state ownership.

#### `src/styles.css`

Add a fixed bottom notice using the existing dark surface, border, blue action, focus ring, type tokens, and `env(safe-area-inset-bottom)`. Keep the notice within the viewport and add invariant page-end clearance sufficient for its maximum height so it cannot cover the final calculator control. The notice appearing or disappearing shall not change calculator-card geometry or document width. Its action remains at least 44 by 44 CSS pixels at 320 CSS pixels and above.

#### `src/pwa.test.ts`, `src/components/UpdateNotice.test.tsx`, and `src/App.pwa.test.tsx`

Mock `virtual:pwa-register` and timers. Cover the S6-AC-006 registration, trigger, throttle, subscription, ready, applying, rejection, unsupported, focus, singleton, and calculator-state-preservation contracts. Do not attempt to install a real worker in jsdom.

### Document metadata

#### `index.html`

- Preserve `lang="en"`, UTF-8, viewport metadata, title, root element, and the Vite module entry.
- Add `<meta name="theme-color" content="#000000" />`.
- Add `<link rel="apple-touch-icon" href="%BASE_URL%apple-touch-icon.png" />` so Vite expands the reference to `/plate-calculator/apple-touch-icon.png` in the production document.
- Let the PWA plugin inject the manifest and registration references.
- Do not add a manual manifest link or a second service-worker script.
- Do not add remote metadata or assets.

### Deterministic icon generation

#### `scripts/generate-pwa-icons.mjs`

Create a dependency-free Node ESM generator using only `node:fs`, `node:path`, and `node:zlib`.

The script shall:

- create `public/` when absent;
- generate RGBA pixel buffers at 192, 512, 512 maskable, and 180 pixels square;
- fill every pixel with opaque black;
- draw the same simple white barbell geometry at integer-aligned coordinates;
- keep the maskable mark inside the central 80 percent safe square;
- encode valid non-interlaced, 8-bit RGBA PNGs;
- write the four exact filenames from the slice;
- overwrite only those four known generated assets;
- print the generated filenames and dimensions;
- produce byte-identical files from identical source.

The barbell mark shall be composed from filled rectangles only:

- one centered horizontal shaft;
- one inner and one outer vertical plate on each side;
- symmetric geometry around both axes;
- no text, transparency, shadow, gradient, or embedded metadata.

Use a small internal CRC-32 implementation for PNG chunks and `zlib.deflateSync` for scanline data. Do not add Sharp, Canvas, SVG conversion, ImageMagick, or a runtime image dependency.

Run `pnpm run generate:icons` during implementation and commit both the generator and its four outputs. The build workflow shall not regenerate icons; committed generated inputs keep deployment deterministic and allow ordinary frozen installs.

### Static PWA assets

#### `public/pwa-192x192.png`

- Generated ordinary application icon, exactly 192 by 192, opaque RGBA PNG.

#### `public/pwa-512x512.png`

- Generated ordinary application icon, exactly 512 by 512, opaque RGBA PNG.

#### `public/pwa-maskable-512x512.png`

- Generated maskable application icon, exactly 512 by 512, opaque RGBA PNG, with the essential mark inside the safe area.

#### `public/apple-touch-icon.png`

- Generated Apple touch icon, exactly 180 by 180, opaque RGBA PNG.

### Production artifact verifier

#### `scripts/verify-pwa.mjs`

Create a dependency-free Node ESM command using only Node built-ins. It shall collect all failures, print each diagnostic, and exit nonzero if any check fails. On success it shall print a concise summary of the verified base, manifest, icons, service worker, precache, and workflow.

Implement private helpers equivalent to:

```js
readRequiredFile(path)
assert(condition, diagnostic)
extractAttributeTags(html, tagName)
resolveProjectUrl(reference)
readPngMetadata(buffer)
findManifestPath(indexHtml)
findServiceWorkerFiles(distEntries)
findPrecacheReferences(serviceWorkerSource)
verifyWorkflow(workflowSource)
```

The verifier shall not export or duplicate calculator-domain logic.

#### Build document checks

- Require `dist/index.html`.
- Require the expected title, black theme-color metadata, generated manifest link, Apple touch icon, generated stylesheet, and generated JavaScript entry.
- Require no injected `registerSW.js`; registration must be bundled through the application-owned virtual-module import.
- Resolve local references against `https://example.test/plate-calculator/` and require every application path to begin `/plate-calculator/`.
- Fail origin-root paths such as `/assets/`, `/manifest.webmanifest`, `/sw.js`, and `/apple-touch-icon.png`.
- Permit document-standard URLs such as the HTML namespace only when they are not fetched runtime dependencies.

#### Manifest checks

- Discover the emitted manifest from the built link rather than assuming its filename.
- Parse JSON and compare every contracted scalar field exactly.
- Require exactly the three contracted manifest icon entries.
- Resolve `id`, `start_url`, and `scope` and require all three to remain within `/plate-calculator/`.
- Reject remote or origin-escaping icon references.

#### PNG checks

Read the PNG signature and IHDR directly. For every required icon:

- require the exact width and height;
- require 8-bit depth;
- require truecolor-with-alpha color type 6;
- require no interlacing;
- require the file to exist in `dist/`;
- require the declared MIME type to be `image/png` where the manifest declares it.

The generator makes all pixels opaque; the verifier shall inflate IDAT data and confirm each alpha byte is 255. It shall also sample the maskable safe-area boundary to ensure no white mark escapes outside the central 80 percent square.

#### Service-worker and precache checks

- Discover `sw.js` and any generated Workbox runtime rather than assuming a hashed runtime filename.
- Require the service-worker file to be nonempty.
- Require every built HTML, JavaScript, CSS, manifest, and required PNG basename or normalized relative path to appear in the precache manifest or plugin-generated inclusion.
- Require navigation fallback behavior for the application entry.
- Require prompt registration configuration, disabled injected registration, and one application-owned virtual registration import.
- Require the generated worker and helper protocol needed to promote a waiting worker only after the update action.
- Require obsolete-cache cleanup configuration or generated behavior.
- Reject precache references to `src/`, `specs/`, `screenshots/`, `.github/`, `.git/`, `node_modules/`, `coverage/`, or test files.
- Reject required remote runtime URLs in the built HTML and CSS and recognizable remote `fetch`, dynamic import, font, stylesheet, script, or image references in built JavaScript.

Do not assert content hashes, minifier formatting, Workbox variable names, or the total number of precache entries.

#### Authored configuration and workflow checks

Read `vite.config.ts`, `package.json`, and `.github/workflows/deploy-pages.yml` to verify:

- exact base and manifest values;
- `generateSW`, prompt registration, disabled injection, development-disabled, and cleanup choices;
- exact pnpm declaration and required scripts;
- push-to-main and manual workflow triggers;
- one Pages concurrency group with cancellation enabled;
- least-privilege permissions;
- supported checkout, pnpm, Node, configure-pages, upload-pages-artifact, and deploy-pages actions;
- frozen install, typecheck, test, build, and PWA-verifier commands in order;
- upload path `./dist` or `dist` only;
- deployment job needs the build job;
- `github-pages` environment and `page_url` output;
- absence of a PAT, `gh-pages` branch push, `dist` commit, or PR deployment.

Keep workflow checks structural and targeted. Do not implement a general YAML parser with regular expressions.

### GitHub Pages workflow

#### `.github/workflows/deploy-pages.yml`

Create two jobs: `build` and `deploy`.

Global behavior:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true
```

The `build` job shall:

1. run on `ubuntu-latest`;
2. check out the repository;
3. install pnpm from `packageManager` through `pnpm/action-setup`;
4. install Node 24 and enable `cache: pnpm` through `actions/setup-node`;
5. run `pnpm install --frozen-lockfile`;
6. run `pnpm run typecheck`;
7. run `pnpm test`;
8. run `pnpm run build`;
9. run `pnpm run verify:pwa`;
10. run `actions/configure-pages`;
11. upload `./dist` through `actions/upload-pages-artifact`.

The `deploy` job shall:

- run on `ubuntu-latest`;
- declare `needs: build`;
- target the `github-pages` environment;
- set the environment URL from `steps.deployment.outputs.page_url`;
- contain only the official `actions/deploy-pages` deployment step with `id: deployment`.

No repository secret is required. Use the workflow-provided GitHub token with the declared Pages and OIDC permissions.

### Existing calculator code and tests

Do not modify `src/domain/**`, either calculator component, the barbell component, or any Slice 001 through Slice 005 calculation and interaction acceptance criterion. `App.tsx`, the focused `App.pwa.test.tsx` integration test, and `styles.css` may change only to mount, verify, and present the update notice. A need to alter calculator-owned state or domain behavior indicates scope drift and shall be reported before proceeding.

## Build and URL behavior

After `pnpm run build`, `dist/index.html` shall contain project-path-prefixed generated resources. The expected request relationship is:

```text
/plate-calculator/
├── index.html
├── manifest.webmanifest
├── sw.js
├── workbox-<hash>.js        when emitted by the selected plugin version
├── assets/
│   ├── index-<hash>.js
│   └── index-<hash>.css
├── pwa-192x192.png
├── pwa-512x512.png
├── pwa-maskable-512x512.png
└── apple-touch-icon.png
```

The physical `dist/` directory does not contain a nested `plate-calculator/` folder. Vite base URLs and the hosting mount create that public path.

No `404.html` is planned because the application exposes no route-dependent deep links.

## Registration and update state model

Registration mechanics remain outside calculator state. React observes only the external update snapshot:

```text
unsupported or registration failed
  -> online application continues without offline capability

supported + first online load
  -> worker installing
  -> precache complete
  -> worker active and page controlled
  -> offline-ready boundary satisfied

controlled build A + contracted check discovers online build B
  -> build B worker installing with complete B precache
  -> build B waiting; snapshot = ready
  -> fixed Update available notice; build A and calculator state unchanged
  -> user activates Update app; snapshot = applying
  -> helper promotes build B and reloads exactly once
  -> fresh document receives coherent build B
  -> obsolete application caches removed

check or registration failure
  -> snapshot remains idle
  -> current online or cached application remains usable

activation failure before reload
  -> snapshot returns from applying to ready
  -> Update app is retryable
```

The external store contains only `idle`, `ready`, or `applying`. No calculator state is written to browser storage.

## Failure behavior

- A service-worker registration failure shall appear only through browser diagnostics and shall not block React rendering.
- A failed update check shall not display the notice or affect cached offline operation.
- A failed update activation shall restore the ready notice and permit retry without changing calculator state.
- A missing or malformed PWA artifact shall fail `pnpm run verify:pwa` and the workflow before upload.
- Typecheck, test, build, or verification failure shall prevent the upload and deployment jobs.
- A failed deploy shall leave the previously deployed Pages version in place; no rollback code is introduced.
- A first-ever offline visit may show the browser's network error because nothing has been cached.
- A Pages-source configuration error is an external release blocker, not a reason to alter application code.

## Automated verification mapped to acceptance criteria

| Acceptance criterion | Automated verification |
| --- | --- |
| S6-AC-001 | `verify:pwa` parses the emitted manifest and asserts exact identity, display, colors, ID, start URL, and scope. |
| S6-AC-002 | `generate:icons` produces deterministic files; `verify:pwa` checks manifest purposes, PNG signature/IHDR, dimensions, opacity, and maskable safe area. |
| S6-AC-003 | `verify:pwa` resolves every built HTML, manifest, icon, and registration reference against `/plate-calculator/` and rejects origin-root escapes. |
| S6-AC-004 | `verify:pwa` discovers the generated worker and confirms every emitted runtime asset is precached while prohibited repository paths are absent. |
| S6-AC-005 | `verify:pwa` rejects remote runtime resource references; the production browser run confirms no failed required request. |
| S6-AC-006 | Unit/component tests prove singleton registration, all check triggers, throttling, notice state, focus behavior, user-controlled activation, failure recovery, and calculator-state preservation; config/artifact checks prove prompt registration and cleanup; the two-build browser fixture proves coherent replacement. |
| S6-AC-007 | Real-browser cached offline reload verifies the controlled app launches at the initial 45 lb target state. |
| S6-AC-008 | Real-browser offline target workflow exercises rounding, invalid recovery, greedy output, Reduce plates, controls, and visualization. |
| S6-AC-009 | Real-browser offline reverse workflow exercises switching, add/remove/reset, duplicates, Optimize, overflow, and focus. |
| S6-AC-010 | Production browser run with service-worker capability disabled or registration blocked confirms online progressive enhancement. |
| S6-AC-011 | `verify:pwa` inspects workflow structure; a later authorized main push verifies the actual Actions run and deployed URL. |
| S6-AC-012 | Current 138-test suite remains green; source inspection confirms no storage adapter or application-state persistence. |

The suite increased from the original 131-test Slice 006 baseline to 138 after focused heading and current-total reset acceptance tests were added. Do not add jsdom tests that merely restate generated artifact assertions.

## Local verification sequence

Run from a clean working tree except for the Slice 006 implementation:

```text
pnpm install --frozen-lockfile
pnpm run generate:icons
pnpm run generate:icons
git diff --exit-code -- public/pwa-192x192.png public/pwa-512x512.png public/pwa-maskable-512x512.png public/apple-touch-icon.png
pnpm run typecheck
pnpm test
pnpm run build
pnpm run verify:pwa
pnpm exec vite preview --host 127.0.0.1
```

The second icon-generation run and diff check prove deterministic output. If those assets were already modified before verification, record their hashes before the first run and compare hashes after the second run rather than relying on an otherwise dirty diff.

Inspect the build output to confirm:

- no warning introduced by the PWA plugin;
- no maximum-file-size precache warning;
- no duplicate registration or manifest link;
- no unintended source map or development service worker;
- `dist/` remains ignored by Git.

## Real-browser verification plan

Serve the production build and open the project-path URL, not the preview origin root. Use a fresh browser context so earlier service-worker registrations and caches cannot satisfy the checks accidentally.

### Production online baseline

1. Open `/plate-calculator/` at 402 by 874 CSS pixels.
2. Confirm the Slice 005 interface is visually unchanged.
3. Inspect manifest diagnostics and require the exact name, standalone display, start URL, scope, colors, and icon set.
4. Wait for the service worker to become active and for `navigator.serviceWorker.controller` to be present; one reload after activation is permitted to establish control.
5. Confirm service-worker scope is the full project path and not the origin root.
6. Confirm all required responses succeed and the console contains no error or warning introduced by the slice.

### Cached offline reload

1. After control and precaching, set the browser context offline.
2. Reload the exact project-path URL.
3. Confirm the app shell, CSS, icon metadata, and calculator render without a network error.
4. Confirm the initial state is Target → Plates at 45 lb.
5. Confirm no document-level horizontal overflow at the standard viewport.

### Offline target workflow

1. Enter `137.5`; confirm resolved 135 and adjustment feedback.
2. Enter 165; confirm default `45 + 10 + 5`.
3. Activate Reduce plates; confirm `35 + 25`, unchanged total, and stable card/slot geometry.
4. Exercise `−5`, `+5`, Escape cancellation, and one invalid direct entry.
5. Confirm plate order, labels, colors, bar notch, and focus remain unchanged.

### Offline reverse workflow

1. Switch to Plates → Total.
2. Add 35 and 25; confirm 165 and visible Optimize.
3. Remove 25; confirm 115 and correct focus, then re-add 25.
4. Activate Optimize; confirm `45 + 10 + 5`, total 165, absent action, stable geometry, and focus on Remove 45 lb plate.
5. Add duplicate plates until the barbell overflows; confirm internal scrolling and no document overflow.

### Unsupported-registration fallback

1. Use a fresh context with service workers unavailable or registration deliberately blocked while the network remains online.
2. Open `/plate-calculator/`.
3. Confirm both calculator modes and all ordinary interactions remain functional.
4. Confirm there is no install, offline, error, or update UI when registration is unsupported or fails.

### Update lifecycle fixture

Create temporary build A and build B directories outside tracked source. Build A is the normal output. Build B shall be produced from a temporary copy with one harmless build-only document marker changed so its HTML revision differs; do not modify or revert tracked user files to create the fixture.

Serve A and establish control. Replace the served directory atomically with B at the same origin and `/plate-calculator/` scope. Verify:

- B's worker installs with B's complete precache;
- registration, `online`, foreground return, and the rescheduled 60-minute timer each trigger the common check boundary;
- checks within five minutes are coalesced;
- B waits while the current page and its calculator state remain on A;
- one fixed `Update available` notice appears without focus movement or calculator-card geometry change;
- ignoring the notice leaves A fully usable;
- activating `Update app` shows `Updating…`, promotes B, and reloads exactly once;
- the reloaded document returns marker B in the established fresh calculator state;
- all B runtime assets succeed;
- old application precache entries are removed;
- no unrelated cache is removed;
- no mixed-version resource or console error occurs.

Repeat the fixture with an offline/failed check and with a rejected activation promise. Confirm no notice for the failed check, preserved cached behavior, and a retryable notice after activation failure.

Temporary fixture files shall remain outside the repository and be deleted after verification.

### Desktop and installed presentation

1. At 1024 by 900, confirm the centered 480-pixel maximum shell remains unchanged.
2. Where supported, launch from the installed/standalone surface and confirm no browser navigation chrome is requested by the manifest display mode.
3. Confirm responsive behavior remains usable if the installed window changes orientation or width.

## Deployment verification plan

Creating the workflow file does not authorize a commit, push, Pages setting change, workflow dispatch, or deployment. Perform external actions only when the user explicitly requests them.

After authorization:

1. Confirm GitHub repository Settings → Pages uses **GitHub Actions** as the source.
2. Commit with semantic style.
3. Push the authorized commit to `main`.
4. Inspect the resulting `deploy-pages.yml` run rather than blindly dispatching a duplicate.
5. Require the build and deploy jobs to succeed.
6. Confirm the environment URL is `https://nhalase.github.io/plate-calculator/` or the canonical trailing-slash equivalent.
7. Run the deployed online, service-worker-control, offline-reload, and representative target/reverse checks.
8. Report the workflow run and deployment URL.

If Pages has not been enabled for GitHub Actions, stop and report that exact external prerequisite. Do not change repository settings without separate authorization.

## Risk controls

- **Wrong project base:** enforce `/plate-calculator/` in Vite, built references, manifest resolution, local preview, and deployment verification.
- **Development cache interference:** leave PWA development support disabled and always use a fresh production browser context.
- **Missing icon precache:** list icons in both manifest/includeAssets and verify their emitted paths and worker references.
- **Unsafe maskable crop:** generate within the central 80 percent and verify no mark pixel escapes it.
- **Update loses an active calculation without consent:** use prompt registration and call the reload helper only from `Update app`; prove ignored notices leave state unchanged.
- **Installed app misses long-lived updates:** check at registration, reconnection, foreground return, and hourly while visible, with no-store validation of the worker URL.
- **Duplicate checks or registration under Strict Mode:** keep initialization, listeners, timer, timestamp, and registration outside React and guard them once.
- **Notice covers controls or moves layout:** use a fixed notice plus invariant page-end clearance and browser rectangle checks at 320, 402 by 874, and desktop widths.
- **Mixed hashed assets:** require build B's full precache before activation and verify the next load uses only B.
- **Overbroad cache deletion:** use Workbox application-cache cleanup and verify an unrelated sentinel cache survives the fixture.
- **Artifact verifier brittleness:** discover hashed paths and inspect stable semantics; do not match minified variable names or exact hashes.
- **Workflow supply-chain drift:** pin official action revisions where practical and label their reviewed major versions.
- **Accidental deployment:** keep GitHub writes and Pages settings outside implementation authorization.
- **Scope growth:** permit only the contracted update notice; reject install UI, persistence, routing, remote runtime resources, analytics, and calculator changes.

## Deviations and unresolved decisions

No ambiguity or contradiction prevents deterministic implementation.

This amendment supersedes the original `autoUpdate`/injected-registration decision. Prompt registration preserves the current document until the user explicitly activates `Update app`, while application-owned registration supplies deterministic update detection and a safe reload boundary.

The exact resolved `vite-plugin-pwa` package version is intentionally assigned by `pnpm add -D vite-plugin-pwa` and pinned by `pnpm-lock.yaml`; runtime behavior is fixed by the configuration and artifact checks rather than an unverified version guessed in this plan.

GitHub Pages enablement and the first production deployment are external release conditions. Local implementation can be completed and verified before the separately authorized push, but deployed verification remains outstanding until the workflow has actually run.

## Implementation order

1. Change the amendment status to `Approved` when implementation is authorized.
2. Change Vite registration from injected `autoUpdate` to application-owned `prompt` and add the virtual-module type reference.
3. Implement the singleton external update store, contracted check triggers, throttling, and activation failure recovery.
4. Add and mount the update notice without changing calculator ownership.
5. Add fixed-notice styling and invariant page-end clearance.
6. Update `verify:pwa` for prompt registration and application-owned registration artifacts.
7. Add unit/component tests for S6-AC-006 and keep every earlier test green.
8. Run frozen install, typecheck, test, build, and artifact verification commands.
9. Run online, offline, unsupported, responsive, and two-build update-lifecycle browser workflows.
10. Mark the slice and plan `Approved and implemented` after all local checks pass.
11. Commit, push, and verify deployment only with explicit authorization.

## Plan completion condition

This plan is ready for implementation approval when:

- every created or modified file is identified;
- manifest, icon, base-path, registration, cache, update-check, notice, activation, failure, and workflow choices are exact;
- artifact-verifier responsibilities are deterministic;
- S6-AC-001 through S6-AC-012 map to automated or real-browser evidence;
- local and deployed verification sequences are separated by authorization boundary;
- no earlier calculator behavior or later-slice scope is included.
