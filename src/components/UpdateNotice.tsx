import { useSyncExternalStore } from 'react'

import {
  applyPwaUpdate,
  getPwaUpdateSnapshot,
  subscribeToPwaUpdates,
} from '../pwa'

export function UpdateNotice() {
  const updateState = useSyncExternalStore(
    subscribeToPwaUpdates,
    getPwaUpdateSnapshot,
    getPwaUpdateSnapshot,
  )

  if (updateState === 'idle') {
    return null
  }

  const applying = updateState === 'applying'

  return (
    <div
      className="update-notice"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span>Update available</span>
      <button
        type="button"
        disabled={applying}
        onClick={() => void applyPwaUpdate()}
      >
        {applying ? 'Updating…' : 'Update app'}
      </button>
    </div>
  )
}
