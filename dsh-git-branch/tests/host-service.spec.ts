import { Context } from '@deepseek-ai/cordis'
import type { Session } from '@deepseek-ai/dsh-session'
import TypertRegistry from '@deepseek-ai/dsh-typert-registry'
import { describe, expect, it, vi } from 'vitest'
import GitBranchService from '../src/index.ts'

describe('Git branch Host service', () => {
  it('registers its strict Remote descriptors and withdraws them with the service', async () => {
    const ctx = new Context()
    await ctx.plugin(TypertRegistry)
    ctx.provide('subprocess', {} as never)
    ctx.provide('workingDirectory', { get: () => '/work/repo' } as never)
    const fiber = ctx.plugin(GitBranchService)
    await fiber

    expect(ctx.typert.local.get('gitBranch/list')).toMatchObject({
      service: 'gitBranch',
      namespace: 'gitBranch',
      method: 'list',
      parameters: [{
        name: 'session',
        wire: 'sessionId',
        source: 'lookup',
        lookup: 'session',
      }],
    })
    expect(ctx.typert.local.get('gitBranch/switch')).toMatchObject({
      service: 'gitBranch',
      namespace: 'gitBranch',
      method: 'switch',
    })
    expect(ctx.get('gitBranch')).toMatchObject({
      typertRemote: {
        serviceKey: 'gitBranch',
        namespace: 'gitBranch',
      },
    })

    await fiber.dispose()
    expect(ctx.typert.local.get('gitBranch/list')).toBeUndefined()
  })

  it('aborts and waits for an in-flight Git process range when the service unloads', async () => {
    const ctx = new Context()
    await ctx.plugin(TypertRegistry)
    let spawnedSignal: AbortSignal | undefined
    let terminate!: ReturnType<typeof vi.fn>
    let waitForExit!: ReturnType<typeof vi.fn>
    const spawn = vi.fn((spec: { readonly signal?: AbortSignal }) => {
      spawnedSignal = spec.signal
      const done = Promise.withResolvers<{ exitCode: number | null; signal: string | null }>()
      const exited = Promise.withResolvers<void>()
      const stop = (): void => {
        done.reject(new Error('terminated'))
        exited.resolve()
      }
      spec.signal?.addEventListener('abort', stop, { once: true })
      terminate = vi.fn(() => {
        stop()
      })
      waitForExit = vi.fn(() => exited.promise)
      return {
        done: done.promise,
        terminate,
        waitForExit,
        collected: {
          stdout: { readFrom: () => ({ text: '', lossy: false }) },
          stderr: { readFrom: () => ({ text: '', lossy: false }) },
        },
      }
    })
    ctx.provide('subprocess', {
      resolveExecutable: async () => '/usr/bin/git',
      spawn,
    } as never)
    ctx.provide('workingDirectory', { get: () => '/work/repo' } as never)
    const fiber = ctx.plugin(GitBranchService)
    await fiber
    const service = ctx.get('gitBranch') as GitBranchService
    const result = service.list({} as Session, new AbortController().signal).then(
      () => null,
      (error: unknown) => error,
    )
    await vi.waitFor(() => { expect(spawn).toHaveBeenCalledOnce() })
    expect(spawnedSignal?.aborted).toBe(false)

    await fiber.dispose()
    await result
    expect(spawnedSignal?.aborted).toBe(true)
    expect(terminate).toHaveBeenCalled()
    expect(waitForExit).toHaveBeenCalled()
  })
})
