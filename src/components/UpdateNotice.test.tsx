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

vi.mock('../pwa', () => ({
  applyPwaUpdate: updateStore.apply,
  getPwaUpdateSnapshot: updateStore.getSnapshot,
  subscribeToPwaUpdates(listener: () => void) {
    updateStore.listeners.add(listener)
    return () => updateStore.listeners.delete(listener)
  },
}))

import { UpdateNotice } from './UpdateNotice'

describe('Slice 006 update notice', () => {
  beforeEach(() => {
    updateStore.apply.mockReset()
    updateStore.getSnapshot.mockReturnValue('idle')
    updateStore.listeners.clear()
  })

  it('AC-PWA-004-2 and S6-AC-006 remains absent until an update is ready and does not take focus', () => {
    render(
      <>
        <button type="button">Calculator action</button>
        <UpdateNotice />
      </>,
    )
    const calculatorAction = screen.getByRole('button', {
      name: 'Calculator action',
    })
    calculatorAction.focus()
    expect(screen.queryByText('Update available')).not.toBeInTheDocument()

    act(() => updateStore.set('ready'))

    expect(screen.getByRole('status')).toHaveTextContent('Update available')
    expect(
      screen.getByRole('button', { name: 'Update app' }),
    ).toBeEnabled()
    expect(calculatorAction).toHaveFocus()
  })

  it('AC-PWA-004-4 invokes the update action and exposes its applying state', async () => {
    const user = userEvent.setup()
    updateStore.getSnapshot.mockReturnValue('ready')
    render(<UpdateNotice />)

    await user.click(screen.getByRole('button', { name: 'Update app' }))
    expect(updateStore.apply).toHaveBeenCalledTimes(1)

    act(() => updateStore.set('applying'))
    expect(screen.getByRole('button', { name: 'Updating…' })).toBeDisabled()
  })
})
