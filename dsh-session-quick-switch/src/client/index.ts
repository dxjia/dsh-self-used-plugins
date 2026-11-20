/** Browser shortcut that cycles through the three most recently viewed Sessions. */
import type { Context } from '@deepseek-ai/cordis'
import type {
  SessionListState,
} from '@deepseek-ai/dsh-api-session-controller/client'
import type {
  WorkspaceSnapshot,
} from '@deepseek-ai/dsh-api-workspace-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { ShortcutCommandId } from '@deepseek-ai/dsh-client-shortcuts/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type {} from './locales.ts'
import {
  RecentSessionCycle,
  type RecentSessionVisit,
} from './cycle.ts'
import { de, en, es, fr, ja, pt, ru, zh } from './locales.ts'

/** Services used to observe navigation, navigate, and register the editable shortcut. */
export const inject = ['shortcuts', 'sessions', 'workspaces', 'uiWorkspace', 'locale']

const NS = 'sessionQuickSwitch'
const STORAGE_KEY = 'dsh.session-quick-switch.v1'

function persistedVisits(): RecentSessionVisit[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(value)
      ? value.flatMap((entry): RecentSessionVisit[] => {
        if (typeof entry !== 'object' || entry === null) return []
        const candidate = entry as { id?: unknown; visitedAt?: unknown }
        return typeof candidate.id === 'string' && candidate.id !== ''
          && typeof candidate.visitedAt === 'number' && Number.isFinite(candidate.visitedAt)
          ? [{ id: candidate.id as SessionId, visitedAt: candidate.visitedAt }]
          : []
      })
      : []
  } catch (_storageRead) {
    return []
  }
}

function persistVisits(visits: readonly RecentSessionVisit[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits))
  } catch (_storageWrite) {
    // Session switching remains available when storage is blocked.
  }
}

/**
 * Register the recent-session navigation command.
 * @param ctx - browser plugin context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }),
    'session-quick-switch: copy')
  const t = ctx.locale.bind(NS)
  const cycle = new RecentSessionCycle(persistedVisits())

  const sync = (): void => {
    const list: SessionListState = ctx.sessions.list.getSnapshot()
    const workspaces: WorkspaceSnapshot = ctx.workspaces.list.getSnapshot()
    const archived = new Set(workspaces.archivedSessionIds)
    const eligible = list.ids.filter((id: SessionId) => {
      const row = list.byId[id]
      return row !== undefined && row.origin !== 'subagent' && !archived.has(id)
    })
    const current = eligible.find((id: SessionId) => Object.entries(list.byId[id]?.retainedBy ?? {})
      .some(([source, count]) => source === 'mainView' && (count ?? 0) > 0))
    if (cycle.observe(current, eligible, Date.now())) persistVisits(cycle.snapshot())
  }
  sync()
  ctx.effect(() => {
    const stopSessions = ctx.sessions.list.subscribe(sync)
    const stopWorkspaces = ctx.workspaces.list.subscribe(sync)
    return () => {
      stopSessions()
      stopWorkspaces()
    }
  }, 'session-quick-switch: navigation history')

  ctx.effect(() => ctx.shortcuts.register({
    id: 'session.cycleRecent' as ShortcutCommandId,
    label: () => t('command'),
    aliases: ['switch recent sessions', 'cycle recent sessions', 'next recent session'],
    defaults: {
      'desktop:macos': { code: 'Tab', modifiers: ['control'] },
      'desktop:windows': { code: 'Tab', modifiers: ['control'] },
    },
    regions: ['page', 'editable'],
    modals: ['sidebar'],
    resolve: () => {
      const now = Date.now()
      const target = cycle.next(now)
      persistVisits(cycle.snapshot())
      if (target === undefined) return { status: 'pass' }
      return {
        status: 'handled',
        run: () => {
          cycle.accept(target, now)
          persistVisits(cycle.snapshot())
          try {
            ctx.uiWorkspace.openSession(target)
          } catch (error: unknown) {
            cycle.cancel()
            console.warn('recent Session switch failed:', error)
          }
        },
      }
    },
  }), 'session-quick-switch: command')
}
