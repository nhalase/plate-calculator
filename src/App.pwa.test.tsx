import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const updateStore = vi.hoisted(() => {
  const listeners = new Set<() => void>()
  return {
    apply: vi.fn(),
    getSnapshot: vi.fn(() => 'idle' as 'idle' | 'ready' | 'applying'),
    listeners,
    set(next: 'idle' | 'ready' | 'applying') {
      this.getSnapshot.mockReturnValue(next)
      for (const listener of listeners) listener()
    },
  }
})

vi.mock('./pwa', () => ({
  applyPwaUpdate: updateStore.apply,
  getPwaUpdateSnapshot: updateStore.getSnapshot,
  subscribeToPwaUpdates(listener: () => void) {
    updateStore.listeners.add(listener)
    return () => updateStore.listeners.delete(listener)
  },
}))

import { App } from './App'

describe('Slice 006 application update integration', () => {
  beforeEach(() => {
    updateStore.apply.mockReset()
    updateStore.getSnapshot.mockReturnValue('idle')
    updateStore.listeners.clear()
  })

  it('AC-PWA-004-3 and S6-AC-006 preserve calculator state while the update waits', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Edit target weight' }))
    const input = screen.getByRole('textbox', { name: 'Target weight' })
    await user.clear(input)
    await user.type(input, '155{Enter}')

    act(() => updateStore.set('ready'))

    expect(screen.getByRole('button', { name: 'Edit target weight' })).toHaveTextContent(
      '155',
    )
    expect(screen.getByRole('status')).toHaveTextContent('Update available')
  })
})
