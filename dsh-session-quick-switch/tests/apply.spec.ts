import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { ShortcutCommand } from '@deepseek-ai/dsh-client-shortcuts/client'
import { bindingIssue, normalizeBinding } from '@deepseek-ai/dsh-client-shortcuts/protocol'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { apply } from '../src/client/index.ts'

const ids = ['a', 'b', 'c'] as SessionId[]

afterEach(() => { vi.useRealTimers() })

function harness(): {
  ctx: Context
  command(): ShortcutCommand
  show(id: string): void
  openSession: ReturnType<typeof vi.fn>
} {
  let current = 'a'
  const listeners = new Set<() => void>()
  let command: ShortcutCommand | undefined
  const openSession = vi.fn()
  const rows = () => Object.fromEntries(ids.map(id => [id, {
    id,
    displayTitle: id,
    running: false,
    retainedBy: id === current ? { mainView: 1 } : {},
    blank: false,
    updatedAt: 0,
  }]))
  const sessions = {
    list: {
      getSnapshot: () => ({ ids, byId: rows(), phase: 'ready', projectionsBySession: {} }),
      subscribe: (listener: () => void) => {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      },
    },
  }
  const effect = (factory: () => unknown): (() => void) => {
    const result = factory()
    return typeof result === 'function' ? result as () => void : () => {}
  }
  const locale = {
    register: () => () => {},
    bind: () => (key: string) => key === 'noTarget' ? 'no target' : 'Switch recent',
  }
  const shortcuts = {
    register: (value: ShortcutCommand) => {
      command = value
      return () => { command = undefined }
    },
  }
  const ctx = {
    effect,
    locale,
    shortcuts,
    sessions,
    workspaces: { list: { getSnapshot: () => ({ archivedSessionIds: [] }), subscribe: () => () => {} } },
    uiWorkspace: { openSession },
  } as unknown as Context
  return {
    ctx,
    command: () => {
      if (command === undefined) throw new Error('command not registered')
      return command
    },
    show: (id) => {
      current = id
      for (const listener of listeners) listener()
    },
    openSession,
  }
}

describe('recent Session shortcut registration', () => {
  it('cycles the three observed main-view Sessions in order', () => {
    vi.useFakeTimers()
    vi.setSystemTime(10_000)
    const h = harness()
    apply(h.ctx)
    vi.setSystemTime(11_000)
    h.show('b')
    vi.setSystemTime(12_000)
    h.show('c')

    const first = h.command().resolve({ region: 'page', modal: null, target: null })
    expect(first.status).toBe('handled')
    if (first.status === 'handled') first.run()
    expect(h.openSession).toHaveBeenLastCalledWith('b')
    vi.setSystemTime(13_000)
    h.show('b')

    const second = h.command().resolve({ region: 'page', modal: null, target: null })
    if (second.status === 'handled') second.run()
    expect(h.openSession).toHaveBeenLastCalledWith('a')
    vi.setSystemTime(14_000)
    h.show('a')

    const third = h.command().resolve({ region: 'page', modal: null, target: null })
    if (third.status === 'handled') third.run()
    expect(h.openSession).toHaveBeenLastCalledWith('c')
    vi.useRealTimers()
  })

  it('declares Ctrl+Tab only for macOS and Windows Desktop', () => {
    const h = harness()
    apply(h.ctx)
    expect(h.command().defaults).toMatchObject({
      'desktop:macos': { code: 'Tab', modifiers: ['control'] },
      'desktop:windows': { code: 'Tab', modifiers: ['control'] },
    })
    expect(h.command().defaults['web:macos']).toBeUndefined()
    expect(h.command().defaults['desktop:linux']).toBeUndefined()
  })

  it('uses valid Desktop Ctrl+Tab bindings and omits browser-reserved defaults', () => {
    const h = harness()
    apply(h.ctx)
    const defaults = h.command().defaults
    expect(bindingIssue(normalizeBinding(defaults['desktop:macos']!, 'macos'), 'desktop', 'macos')).toBeNull()
    expect(bindingIssue(normalizeBinding(defaults['desktop:windows']!, 'windows'), 'desktop', 'windows')).toBeNull()
    expect(defaults['web:macos']).toBeUndefined()
  })

  it('passes without switching when fewer than two hourly Sessions qualify', () => {
    vi.useFakeTimers()
    vi.setSystemTime(10_000)
    const h = harness()
    apply(h.ctx)
    const result = h.command().resolve({ region: 'page', modal: null, target: null })
    expect(result).toEqual({ status: 'pass' })
    expect(h.openSession).not.toHaveBeenCalled()
  })
})
