import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateSync } from 'node:zlib'

const PROJECT_BASE = '/plate-calculator/'
const TEST_ORIGIN = 'https://example.test'
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])
const failures = []

function check(condition, diagnostic) {
  if (!condition) failures.push(diagnostic)
}

async function readRequiredFile(filename, encoding = 'utf8') {
  try {
    return await readFile(filename, encoding)
  } catch {
    failures.push(`missing required file: ${filename}`)
    return encoding ? '' : Buffer.alloc(0)
  }
}

async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const relative = path.posix.join(prefix, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path.join(directory, entry.name), relative)))
    } else {
      files.push(relative)
    }
  }
  return files
}

function tags(html, name) {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) ?? []
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'))
  return match?.[1]
}

function projectUrl(reference, base = `${TEST_ORIGIN}${PROJECT_BASE}`) {
  try {
    return new URL(reference, base)
  } catch {
    failures.push(`invalid URL reference: ${reference}`)
    return null
  }
}

function requireProjectUrl(reference, label, base) {
  const resolved = projectUrl(reference, base)
  check(resolved?.origin === TEST_ORIGIN, `${label} must remain same-origin: ${reference}`)
  check(
    resolved?.pathname.startsWith(PROJECT_BASE),
    `${label} escapes ${PROJECT_BASE}: ${reference}`,
  )
  return resolved
}

function distPathFromUrl(url) {
  return decodeURIComponent(url.pathname.slice(PROJECT_BASE.length)) || 'index.html'
}

function parsePng(buffer, label) {
  check(buffer.subarray(0, 8).equals(PNG_SIGNATURE), `${label} has an invalid PNG signature`)
  let offset = 8
  let header
  const imageData = []

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const dataStart = offset + 8
    const dataEnd = dataStart + length
    if (dataEnd + 4 > buffer.length) break
    const data = buffer.subarray(dataStart, dataEnd)
    if (type === 'IHDR') header = data
    if (type === 'IDAT') imageData.push(data)
    offset = dataEnd + 4
    if (type === 'IEND') break
  }

  check(header?.length === 13, `${label} is missing a valid IHDR chunk`)
  if (!header || header.length !== 13) return null

  const metadata = {
    width: header.readUInt32BE(0),
    height: header.readUInt32BE(4),
    bitDepth: header[8],
    colorType: header[9],
    interlace: header[12],
  }
  check(imageData.length > 0, `${label} is missing image data`)

  let scanlines = Buffer.alloc(0)
  try {
    scanlines = inflateSync(Buffer.concat(imageData))
  } catch {
    failures.push(`${label} contains invalid compressed image data`)
  }

  return { ...metadata, scanlines }
}

function verifyOpaqueRgbaPng(parsed, label, maskable = false) {
  if (!parsed) return
  check(parsed.bitDepth === 8, `${label} must use 8-bit channels`)
  check(parsed.colorType === 6, `${label} must use RGBA color type 6`)
  check(parsed.interlace === 0, `${label} must be non-interlaced`)

  const stride = parsed.width * 4
  check(
    parsed.scanlines.length === (stride + 1) * parsed.height,
    `${label} has an unexpected scanline length`,
  )
  if (parsed.scanlines.length !== (stride + 1) * parsed.height) return

  const safeStart = Math.floor(parsed.width * 0.1)
  const safeEnd = Math.ceil(parsed.width * 0.9)
  for (let row = 0; row < parsed.height; row += 1) {
    const rowOffset = row * (stride + 1)
    check(parsed.scanlines[rowOffset] === 0, `${label} must use deterministic PNG filter 0`)
    for (let column = 0; column < parsed.width; column += 1) {
      const pixelOffset = rowOffset + 1 + column * 4
      const red = parsed.scanlines[pixelOffset]
      const green = parsed.scanlines[pixelOffset + 1]
      const blue = parsed.scanlines[pixelOffset + 2]
      const alpha = parsed.scanlines[pixelOffset + 3]
      check(alpha === 255, `${label} must be fully opaque`)
      if (
        maskable &&
        red > 200 &&
        green > 200 &&
        blue > 200 &&
        (column < safeStart || column >= safeEnd || row < safeStart || row >= safeEnd)
      ) {
        failures.push(`${label} places the essential white mark outside its safe area`)
        return
      }
    }
  }
}

function ordered(source, values, label) {
  let previous = -1
  for (const value of values) {
    const current = source.indexOf(value)
    check(current >= 0, `${label} is missing: ${value}`)
    check(current > previous, `${label} has an incorrect command order near: ${value}`)
    previous = current
  }
}

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDirectory = path.join(repositoryRoot, 'dist')
const indexPath = path.join(distDirectory, 'index.html')
const indexHtml = await readRequiredFile(indexPath)
const distFiles = await listFiles(distDirectory).catch(() => {
  failures.push(`missing production directory: ${distDirectory}`)
  return []
})

check(indexHtml.includes('<title>Barbell Plate Calculator</title>'), 'built title is incorrect')
check(
  tags(indexHtml, 'meta').some(
    (tag) => attribute(tag, 'name') === 'theme-color' && attribute(tag, 'content') === '#000000',
  ),
  'built document is missing the black theme-color metadata',
)

const resourceTags = [...tags(indexHtml, 'link'), ...tags(indexHtml, 'script')]
for (const tag of resourceTags) {
  const reference = attribute(tag, 'href') ?? attribute(tag, 'src')
  if (!reference || reference.startsWith('data:')) continue
  requireProjectUrl(reference, `built document resource ${reference}`)
}

const manifestTag = tags(indexHtml, 'link').find(
  (tag) => attribute(tag, 'rel') === 'manifest',
)
check(Boolean(manifestTag), 'built document is missing its manifest link')
const manifestReference = manifestTag ? attribute(manifestTag, 'href') : undefined
const manifestUrl = manifestReference
  ? requireProjectUrl(manifestReference, 'manifest link')
  : null
const manifestPath = manifestUrl
  ? path.join(distDirectory, ...distPathFromUrl(manifestUrl).split('/'))
  : path.join(distDirectory, 'manifest.webmanifest')
const manifestText = await readRequiredFile(manifestPath)
let manifest = {}
try {
  manifest = JSON.parse(manifestText)
} catch {
  failures.push('generated manifest is not valid JSON')
}

const expectedManifest = {
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
}
for (const [field, value] of Object.entries(expectedManifest)) {
  check(manifest[field] === value, `manifest ${field} must equal ${JSON.stringify(value)}`)
}

const manifestBase = manifestUrl?.href ?? `${TEST_ORIGIN}${PROJECT_BASE}manifest.webmanifest`
for (const field of ['id', 'start_url', 'scope']) {
  if (typeof manifest[field] === 'string') {
    requireProjectUrl(manifest[field], `manifest ${field}`, manifestBase)
  }
}

const expectedIcons = [
  { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any', width: 192 },
  { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any', width: 512 },
  {
    src: 'pwa-maskable-512x512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable',
    width: 512,
    maskable: true,
  },
]
check(Array.isArray(manifest.icons), 'manifest icons must be an array')
check(manifest.icons?.length === expectedIcons.length, 'manifest must contain exactly three icons')

for (const expected of expectedIcons) {
  const icon = manifest.icons?.find((candidate) => candidate.src === expected.src)
  check(Boolean(icon), `manifest is missing ${expected.src}`)
  if (!icon) continue
  check(icon.sizes === expected.sizes, `${expected.src} has the wrong declared sizes`)
  check(icon.type === expected.type, `${expected.src} has the wrong MIME type`)
  check(icon.purpose === expected.purpose, `${expected.src} has the wrong purpose`)
  const iconUrl = requireProjectUrl(icon.src, `manifest icon ${icon.src}`, manifestBase)
  if (!iconUrl) continue
  const iconBuffer = await readRequiredFile(
    path.join(distDirectory, ...distPathFromUrl(iconUrl).split('/')),
    null,
  )
  const parsed = parsePng(iconBuffer, expected.src)
  check(
    parsed?.width === expected.width && parsed?.height === expected.width,
    `${expected.src} must be ${expected.width}x${expected.width}`,
  )
  verifyOpaqueRgbaPng(parsed, expected.src, expected.maskable)
}

const appleTag = tags(indexHtml, 'link').find(
  (tag) => attribute(tag, 'rel') === 'apple-touch-icon',
)
check(Boolean(appleTag), 'built document is missing the Apple touch icon')
if (appleTag) {
  const appleReference = attribute(appleTag, 'href')
  const appleUrl = appleReference
    ? requireProjectUrl(appleReference, 'Apple touch icon')
    : null
  if (appleUrl) {
    const appleBuffer = await readRequiredFile(
      path.join(distDirectory, ...distPathFromUrl(appleUrl).split('/')),
      null,
    )
    const parsed = parsePng(appleBuffer, 'apple-touch-icon.png')
    check(parsed?.width === 180 && parsed?.height === 180, 'Apple touch icon must be 180x180')
    verifyOpaqueRgbaPng(parsed, 'apple-touch-icon.png')
  }
}

const serviceWorkerFiles = distFiles.filter((file) => /(^|\/)sw\.js$/.test(file))
check(serviceWorkerFiles.length === 1, 'build must emit exactly one sw.js')
const serviceWorkerPath = serviceWorkerFiles[0]
  ? path.join(distDirectory, ...serviceWorkerFiles[0].split('/'))
  : path.join(distDirectory, 'sw.js')
const serviceWorker = await readRequiredFile(serviceWorkerPath)
check(serviceWorker.length > 0, 'generated service worker must not be empty')
check(/skipWaiting/.test(serviceWorker), 'service worker must activate updates with skipWaiting')
check(/clients\.claim/.test(serviceWorker), 'service worker must claim clients')
check(/index\.html/.test(serviceWorker), 'service worker must provide an application navigation fallback')

const runtimeFiles = distFiles.filter(
  (file) => /\.(?:html|js|css|png|webmanifest)$/.test(file) && file !== 'sw.js',
)
for (const file of runtimeFiles) {
  check(
    serviceWorker.includes(file),
    `service-worker precache is missing emitted runtime asset: ${file}`,
  )
}
for (const forbidden of ['src/', 'specs/', 'screenshots/', '.github/', '.git/', 'node_modules/', 'coverage/']) {
  check(!serviceWorker.includes(forbidden), `service-worker precache contains prohibited path: ${forbidden}`)
}

const registrationSources = [indexHtml]
for (const file of distFiles.filter((candidate) => /(^|\/)registerSW\.js$/.test(candidate))) {
  registrationSources.push(await readRequiredFile(path.join(distDirectory, ...file.split('/'))))
}
const registrationText = registrationSources.join('\n')
check(
  registrationText.includes(`${PROJECT_BASE}sw.js`),
  'built registration must reference /plate-calculator/sw.js',
)

for (const tag of resourceTags) {
  const reference = attribute(tag, 'href') ?? attribute(tag, 'src')
  check(!/^https?:\/\//i.test(reference ?? ''), `remote document dependency is prohibited: ${reference}`)
}
for (const cssFile of distFiles.filter((file) => file.endsWith('.css'))) {
  const css = await readRequiredFile(path.join(distDirectory, ...cssFile.split('/')))
  check(!/url\(\s*["']?https?:\/\//i.test(css), `remote CSS dependency is prohibited: ${cssFile}`)
}
for (const jsFile of distFiles.filter(
  (file) => file.endsWith('.js') && file !== 'sw.js' && !file.endsWith('registerSW.js'),
)) {
  const javascript = await readRequiredFile(path.join(distDirectory, ...jsFile.split('/')))
  check(
    !/(?:fetch|import)\s*\(\s*["']https?:\/\//i.test(javascript),
    `remote JavaScript runtime dependency is prohibited: ${jsFile}`,
  )
}

const packageJson = JSON.parse(
  await readRequiredFile(path.join(repositoryRoot, 'package.json')),
)
check(packageJson.packageManager === 'pnpm@11.19.0', 'packageManager must be pnpm@11.19.0')
check(
  packageJson.scripts?.['generate:icons'] === 'node scripts/generate-pwa-icons.mjs',
  'generate:icons script is incorrect',
)
check(
  packageJson.scripts?.['verify:pwa'] === 'node scripts/verify-pwa.mjs',
  'verify:pwa script is incorrect',
)
check(Boolean(packageJson.devDependencies?.['vite-plugin-pwa']), 'vite-plugin-pwa must be a dev dependency')

const viteConfig = await readRequiredFile(path.join(repositoryRoot, 'vite.config.ts'))
for (const required of [
  "base: '/plate-calculator/'",
  "registerType: 'autoUpdate'",
  "injectRegister: 'auto'",
  "strategies: 'generateSW'",
  'cleanupOutdatedCaches: true',
  'inlineWorkboxRuntime: true',
]) {
  check(viteConfig.includes(required), `Vite PWA configuration is missing: ${required}`)
}
check(!/devOptions\s*:/.test(viteConfig), 'development service worker must remain disabled')

const workflow = await readRequiredFile(
  path.join(repositoryRoot, '.github', 'workflows', 'deploy-pages.yml'),
)
for (const required of [
  'branches: [main]',
  'workflow_dispatch:',
  'contents: read',
  'pages: write',
  'id-token: write',
  'group: pages',
  'cancel-in-progress: true',
  'uses: actions/checkout@v6',
  'uses: pnpm/action-setup@v6',
  'uses: actions/setup-node@v7',
  'node-version: 24',
  'cache: pnpm',
  'uses: actions/configure-pages@v6',
  'uses: actions/upload-pages-artifact@v5',
  'path: ./dist',
  'needs: build',
  'name: github-pages',
  'steps.deployment.outputs.page_url',
  'id: deployment',
  'uses: actions/deploy-pages@v5',
]) {
  check(workflow.includes(required), `Pages workflow is missing: ${required}`)
}
ordered(
  workflow,
  [
    'pnpm install --frozen-lockfile',
    'pnpm run typecheck',
    'pnpm test',
    'pnpm run build',
    'pnpm run verify:pwa',
    'actions/configure-pages@v6',
    'actions/upload-pages-artifact@v5',
    'actions/deploy-pages@v5',
  ],
  'Pages workflow',
)
for (const forbidden of ['pull_request:', 'gh-pages', 'personal_access_token', 'PAT:', 'git push']) {
  check(!workflow.includes(forbidden), `Pages workflow contains prohibited behavior: ${forbidden}`)
}

if (failures.length > 0) {
  console.error(`PWA verification failed with ${failures.length} issue${failures.length === 1 ? '' : 's'}:`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exitCode = 1
} else {
  console.log(`verified base path: ${PROJECT_BASE}`)
  console.log(`verified manifest: ${path.relative(repositoryRoot, manifestPath)}`)
  console.log('verified icons: 192, 512, maskable 512, Apple touch 180')
  console.log(`verified service worker and ${runtimeFiles.length} precached runtime assets`)
  console.log('verified GitHub Pages workflow')
}
