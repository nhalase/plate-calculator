import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const pwaMocks = vi.hoisted(() => ({
  registerSW: vi.fn(),
  updateServiceWorker: vi.fn(),
}))

vi.mock('virtual:pwa-register', () => ({
  registerSW: pwaMocks.registerSW,
}))

type RegisterOptions = {
  immediate?: boolean
  onNeedRefresh?: () => void
  onOfflineReady?: () => void
  onRegisteredSW?: (
    serviceWorkerUrl: string,
    registration: ServiceWorkerRegistration | undefined,
  ) => void
  onRegisterError?: (error: unknown) => void
}

const originalServiceWorker = Object.getOwnPropertyDescriptor(
  navigator,
  'serviceWorker',
)
const originalOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine')
const originalVisibility = Object.getOwnPropertyDescriptor(
  document,
  'visibilityState',
)

function defineBrowserState({
  supported = true,
  online = true,
  visibility = 'visible',
}: {
  supported?: boolean
  online?: boolean
  visibility?: DocumentVisibilityState
} = {}) {
  if (supported) {
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {},
    })
  } else {
    Reflect.deleteProperty(navigator, 'serviceWorker')
  }
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    value: online,
  })
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: visibility,
  })
}

function restoreProperty(
  target: object,
  name: string,
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor === undefined) {
    Reflect.deleteProperty(target, name)
  } else {
    Object.defineProperty(target, name, descriptor)
  }
}

async function loadPwaModule() {
  const module = await import('./pwa')
  module.initializePwaUpdates()
  const options = pwaMocks.registerSW.mock.calls[0]?.[0] as
    | RegisterOptions
    | undefined
  return { module, options }
}

describe('Slice 006 PWA update lifecycle', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    defineBrowserState()
    pwaMocks.registerSW.mockReset()
    pwaMocks.updateServiceWorker.mockReset()
    pwaMocks.updateServiceWorker.mockResolvedValue(undefined)
    pwaMocks.registerSW.mockReturnValue(pwaMocks.updateServiceWorker)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true }),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    restoreProperty(navigator, 'serviceWorker', originalServiceWorker)
    restoreProperty(navigator, 'onLine', originalOnLine)
    restoreProperty(document, 'visibilityState', originalVisibility)
  })

  it('AC-PWA-004-1 and S6-AC-006 register once and check on registration, online, foreground, and hourly triggers', async () => {
    const windowListeners = new Map<string, EventListener>()
    const documentListeners = new Map<string, EventListener>()
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
      windowListeners.set(type, listener as EventListener)
    })
    vi.spyOn(document, 'addEventListener').mockImplementation((type, listener) => {
      documentListeners.set(type, listener as EventListener)
    })
    const update = vi.fn().mockResolvedValue(undefined)
    const registration = { installing: null, update } as unknown as ServiceWorkerRegistration
    const { module, options } = await loadPwaModule()

    module.initializePwaUpdates()
    expect(pwaMocks.registerSW).toHaveBeenCalledTimes(1)
    expect(options?.immediate).toBe(true)

    options?.onRegisteredSW?.('/plate-calculator/sw.js', registration)
    await vi.runAllTicks()
    expect(fetch).toHaveBeenCalledWith('/plate-calculator/sw.js', {
      cache: 'no-store',
      headers: { cache: 'no-store', 'cache-control': 'no-cache' },
    })
    expect(update).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    windowListeners.get('online')?.(new Event('online'))
    await vi.runAllTicks()
    expect(update).toHaveBeenCalledTimes(2)

    documentListeners.get('visibilitychange')?.(new Event('visibilitychange'))
    await vi.runAllTicks()
    expect(update).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000)
    expect(update).toHaveBeenCalledTimes(3)
  })

  it('AC-PWA-004-2 through AC-PWA-004-4 publish readiness and apply the waiting update only on request', async () => {
    vi.spyOn(window, 'addEventListener').mockImplementation(() => undefined)
    vi.spyOn(document, 'addEventListener').mockImplementation(() => undefined)
    const { module, options } = await loadPwaModule()
    const listener = vi.fn()
    module.subscribeToPwaUpdates(listener)

    expect(module.getPwaUpdateSnapshot()).toBe('idle')
    options?.onNeedRefresh?.()

    expect(listener).toHaveBeenCalledTimes(1)
    expect(module.getPwaUpdateSnapshot()).toBe('ready')
    await module.applyPwaUpdate()
    expect(pwaMocks.updateServiceWorker).toHaveBeenCalledWith(true)
    expect(module.getPwaUpdateSnapshot()).toBe('applying')
  })

  it('AC-PWA-004-5 restores the ready action when applying an update fails', async () => {
    vi.spyOn(window, 'addEventListener').mockImplementation(() => undefined)
    vi.spyOn(document, 'addEventListener').mockImplementation(() => undefined)
    pwaMocks.updateServiceWorker.mockRejectedValueOnce(new Error('offline'))
    const { module, options } = await loadPwaModule()
    options?.onNeedRefresh?.()

    await module.applyPwaUpdate()

    expect(module.getPwaUpdateSnapshot()).toBe('ready')
  })

  it('AC-PWA-004-5 keeps the cached app idle when offline checks are unavailable', async () => {
    defineBrowserState({ online: false })
    vi.spyOn(window, 'addEventListener').mockImplementation(() => undefined)
    vi.spyOn(document, 'addEventListener').mockImplementation(() => undefined)
    const update = vi.fn()
    const registration = { installing: null, update } as unknown as ServiceWorkerRegistration
    const { module, options } = await loadPwaModule()

    options?.onRegisteredSW?.('/plate-calculator/sw.js', registration)
    await vi.runAllTicks()

    expect(fetch).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
    expect(module.getPwaUpdateSnapshot()).toBe('idle')
  })

  it('S6-AC-010 remains an ordinary website when service workers are unsupported', async () => {
    defineBrowserState({ supported: false })
    const module = await import('./pwa')

    module.initializePwaUpdates()

    expect(pwaMocks.registerSW).not.toHaveBeenCalled()
    expect(module.getPwaUpdateSnapshot()).toBe('idle')
  })
})
