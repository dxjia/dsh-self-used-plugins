import { describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { apply } from '../src/client/index.ts'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', async () => {
  const { createElement } = await import('react')
  return {
    IconBranchOutlineRegular: () => createElement('svg'),
    IconWarningOutlineRegular: () => createElement('svg'),
    Menu: ({ anchor }: { anchor?: unknown }) => anchor,
    Toast: () => null,
    Tooltip: ({ children }: { children?: unknown }) => children,
  }
})

async function harness() {
  let registration: {
    name: string
    id: string
    order: number
    locale: string
    inject: () => unknown
  } | undefined
  let dictionaries: Record<string, unknown> | undefined
  const unmountRemote = vi.fn(async () => {})
  const mountRemote = vi.fn(async () => unmountRemote)
  const list = vi.fn(async () => ({
    ok: true,
    value: { current: 'main', branches: ['main', 'feature'] },
  }))
  const switchBranch = vi.fn(async () => ({ ok: true, value: { status: 'dirty' } }))
  const effect = (factory: () => unknown): (() => void) => {
    const result = factory()
    return typeof result === 'function' ? result as () => void : () => {}
  }
  const ctx = {
    effect,
    get: (name: string) => name === 'remote.gitBranch'
      ? { list, switch: switchBranch }
      : undefined,
    locale: {
      register: (_name: string, value: Record<string, unknown>) => {
        dictionaries = value
        return () => {}
      },
    },
    slots: {
      inject: (_name: string, factory: () => unknown) => {
        const result = factory()
        return typeof result === 'function' ? result : () => {}
      },
      register: (value: typeof registration) => {
        registration = value
        return () => { registration = undefined }
      },
    },
    remote: {
      $mount: mountRemote,
      gitBranch: { list, switch: switchBranch },
      workspaceFiles: {
        read: vi.fn(async (_sessionId: string, path: string) => path.endsWith('/.git')
          ? { ok: false, error: { code: 'workspace-file/not-regular-file', details: { kind: 'directory' } } }
          : { ok: false, error: { code: 'workspace-file/not-found', details: { path } } }),
      },
    },
  } as unknown as Context
  await apply(ctx)
  return {
    registration: () => {
      if (registration === undefined) throw new Error('Git branch entry not registered')
      return registration
    },
    dictionaries: () => dictionaries,
    mountRemote,
  }
}

describe('Git branch composer entry', () => {
  it('mounts its Remote and registers one localized composer statistic entry', async () => {
    const h = await harness()
    expect(h.mountRemote).toHaveBeenCalledOnce()
    expect(h.registration()).toMatchObject({
      name: 'conversation.composer.dock',
      id: 'git-branch',
      order: 2,
      locale: 'gitBranch',
    })
    expect(h.dictionaries()).toHaveProperty('en')
    expect(h.dictionaries()).toHaveProperty('zh')
  })

  it('classifies remote reads for repository discovery', async () => {
    const h = await harness()
    const face = h.registration().inject() as {
      read: (sessionId: string, path: string, signal: AbortSignal) => Promise<unknown>
    }
    const signal = new AbortController().signal
    await expect(face.read('s1', '/repo/.git', signal)).resolves.toEqual({ kind: 'directory' })
    await expect(face.read('s1', '/repo/notes.txt', signal)).resolves.toEqual({ kind: 'missing' })
  })

  it('forwards branch listing and dirty switch outcomes through the injected face', async () => {
    const h = await harness()
    const face = h.registration().inject() as {
      list: (sessionId: string, signal: AbortSignal) => Promise<unknown>
      switch: (sessionId: string, branch: string, signal: AbortSignal) => Promise<unknown>
    }
    const signal = new AbortController().signal
    await expect(face.list('s1', signal)).resolves.toEqual({
      current: 'main', branches: ['main', 'feature'],
    })
    await expect(face.switch('s1', 'feature', signal)).resolves.toEqual({ status: 'dirty' })
  })
})
