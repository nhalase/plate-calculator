import { registerSW } from 'virtual:pwa-register'

export type PwaUpdateState = 'idle' | 'ready' | 'applying'

type UpdateListener = () => void

const CHECK_THROTTLE_MS = 5 * 60 * 1000
const CHECK_INTERVAL_MS = 60 * 60 * 1000

let initialized = false
let snapshot: PwaUpdateState = 'idle'
let registration: ServiceWorkerRegistration | undefined
let serviceWorkerUrl: string | undefined
let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | undefined
let lastCheckStartedAt = Number.NEGATIVE_INFINITY
let scheduledCheck: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<UpdateListener>()

function publish(nextSnapshot: PwaUpdateState) {
  if (snapshot === nextSnapshot) {
    return
  }

  snapshot = nextSnapshot
  for (const listener of listeners) {
    listener()
  }
}

function scheduleNextCheck(delay = CHECK_INTERVAL_MS) {
  if (scheduledCheck !== undefined) {
    clearTimeout(scheduledCheck)
  }

  scheduledCheck = setTimeout(() => {
    scheduledCheck = undefined
    void requestPwaUpdateCheck()
  }, delay)
}

async function requestPwaUpdateCheck() {
  if (
    registration === undefined ||
    serviceWorkerUrl === undefined ||
    registration.installing !== null ||
    !navigator.onLine ||
    document.visibilityState !== 'visible'
  ) {
    scheduleNextCheck()
    return
  }

  const now = Date.now()
  const elapsed = now - lastCheckStartedAt
  if (elapsed < CHECK_THROTTLE_MS) {
    return
  }

  lastCheckStartedAt = now
  scheduleNextCheck()

  try {
    const response = await fetch(serviceWorkerUrl, {
      cache: 'no-store',
      headers: {
        cache: 'no-store',
        'cache-control': 'no-cache',
      },
    })

    if (response.ok) {
      await registration.update()
    }
  } catch {
    // Update detection is progressive enhancement. The cached app stays usable.
  }
}

export function initializePwaUpdates() {
  if (
    initialized ||
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator)
  ) {
    return
  }

  initialized = true
  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      publish('ready')
    },
    onOfflineReady() {
      // Offline readiness has no visible UI in this application.
    },
    onRegisteredSW(swUrl, registeredWorker) {
      serviceWorkerUrl = swUrl
      registration = registeredWorker
      void requestPwaUpdateCheck()
    },
    onRegisterError() {
      // Registration failure must not block the online calculator.
    },
  })

  window.addEventListener('online', requestPwaUpdateCheck)
  document.addEventListener('visibilitychange', requestPwaUpdateCheck)
  scheduleNextCheck()
}

export function subscribeToPwaUpdates(listener: UpdateListener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getPwaUpdateSnapshot() {
  return snapshot
}

export async function applyPwaUpdate() {
  if (snapshot !== 'ready' || updateServiceWorker === undefined) {
    return
  }

  publish('applying')
  try {
    await updateServiceWorker(true)
  } catch {
    publish('ready')
  }
}
