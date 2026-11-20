import { describe, expect, it } from 'vitest'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { RecentSessionCycle } from '../src/client/cycle.ts'

const session = (value: string): SessionId => value as SessionId

describe('RecentSessionCycle', () => {
  it('cycles through the three most recently viewed Sessions', () => {
    const a = session('a')
    const b = session('b')
    const c = session('c')
    const eligible = [a, b, c]
    const cycle = new RecentSessionCycle()

    cycle.observe(a, eligible, 1_000)
    cycle.observe(b, eligible, 2_000)
    cycle.observe(c, eligible, 3_000)
    expect(cycle.snapshot().map(visit => visit.id)).toEqual([c, b, a])

    const first = cycle.next(4_000)
    expect(first).toBe(b)
    cycle.accept(first!, 4_000)
    cycle.observe(b, eligible, 4_000)

    const second = cycle.next(5_000)
    expect(second).toBe(a)
    cycle.accept(second!, 5_000)
    cycle.observe(a, eligible, 5_000)

    expect(cycle.next(6_000)).toBe(c)
  })

  it('rebuilds the cycle when navigation happens outside the shortcut', () => {
    const a = session('a')
    const b = session('b')
    const c = session('c')
    const d = session('d')
    const eligible = [a, b, c, d]
    const cycle = new RecentSessionCycle()

    cycle.observe(a, eligible, 1_000)
    cycle.observe(b, eligible, 2_000)
    cycle.observe(c, eligible, 3_000)
    cycle.observe(d, eligible, 4_000)

    expect(cycle.snapshot().map(visit => visit.id)).toEqual([d, c, b])
    expect(cycle.next(5_000)).toBe(c)
  })

  it('drops archived Sessions and blocks with fewer than two hourly targets', () => {
    const a = session('a')
    const b = session('b')
    const c = session('c')
    const now = 3_600_000
    const cycle = new RecentSessionCycle([
      { id: c, visitedAt: now - 1_000 },
      { id: b, visitedAt: now - 2_000 },
      { id: a, visitedAt: now - 3_600_001 },
    ])

    expect(cycle.observe(c, [c, b], now)).toBe(true)
    expect(cycle.snapshot().map(visit => visit.id)).toEqual([c, b])
    cycle.observe(c, [c], now)
    expect(cycle.snapshot().map(visit => visit.id)).toEqual([c])
    expect(cycle.next(now)).toBeUndefined()
  })

  it('expires visits older than one hour', () => {
    const a = session('a')
    const b = session('b')
    const c = session('c')
    const now = 7_200_000
    const cycle = new RecentSessionCycle([
      { id: c, visitedAt: now - 1_000 },
      { id: b, visitedAt: now - 2_000 },
      { id: a, visitedAt: now - 3_600_001 },
    ])
    cycle.observe(c, [a, b, c], now)
    expect(cycle.snapshot().map(visit => visit.id)).toEqual([c, b])
    expect(cycle.next(now + 3_600_000)).toBeUndefined()
  })
})
