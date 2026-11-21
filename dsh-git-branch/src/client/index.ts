/** Browser registration for the composer Git branch indicator. */
import type { Context } from '@deepseek-ai/cordis'
import type { WorkspaceFileText } from '@deepseek-ai/dsh-api-workspace-files/types'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-api-gateway/client'
import type {} from '@deepseek-ai/dsh-api-session-controller/remote'
import type {} from '@deepseek-ai/dsh-api-workspace-files/remote'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-working-directory'
import type { GitFileRead } from './git-branch.ts'
import type { GitBranchPillInjected } from './GitBranchPill.tsx'
import { GitBranchPill } from './GitBranchPill.tsx'
import { de, en, es, fr, ja, pt, ru, zh } from './locales.ts'
import {
  gitBranchRemote,
  type GitBranchList,
  type GitBranchRemote,
  type GitBranchSwitchResult,
} from '../remote.ts'

/** Required browser services: the dock declaration, locale, and authorized workspace file reads. */
export const inject = ['slots', 'locale', 'remote', 'remote.workspaceFiles']

const NS = 'gitBranch'

/**
 * Register the branch entry beneath the composer.
 * @param ctx - browser plugin context.
 */
export async function apply(ctx: Context): Promise<() => Promise<void>> {
  const unmountRemote = await ctx.remote.$mount(gitBranchRemote)
  const remote = ctx.get('remote.gitBranch') as GitBranchRemote | undefined
  if (remote === undefined) {
    await unmountRemote()
    throw new Error('git-branch: mounted Remote namespace is unavailable')
  }
  try {
    ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'git-branch: copy')
    const face = (): GitBranchPillInjected => ({
      read: (sessionId, path, signal) => readFile(ctx, sessionId, path, signal),
      list: (sessionId, signal) => listBranches(remote, sessionId, signal),
      switch: (sessionId, branch, signal) => switchBranch(remote, sessionId, branch, signal),
    })
    ctx.effect(() => ctx.slots.inject('conversation.composer.dock', () =>
      ctx.slots.register({
        name: 'conversation.composer.dock',
        id: 'git-branch',
        order: 2,
        locale: NS,
        inject: face,
      }, GitBranchPill)), 'git-branch: composer reading')
    return unmountRemote
  } catch (error) {
    await unmountRemote()
    throw error
  }
}

/**
 * Reduce a workspaceFiles read to the three repository-discovery outcomes.
 * @param ctx - browser context carrying the generated Remote namespace.
 * @param sessionId - Session authorizing the path.
 * @param path - absolute Host path.
 * @param signal - read cancellation.
 * @returns classified file read.
 */
async function readFile(
  ctx: Context,
  sessionId: SessionId,
  path: string,
  signal: AbortSignal,
): Promise<GitFileRead> {
  const result: RemoteResult<WorkspaceFileText> = await ctx.remote.workspaceFiles.read(sessionId, path, { limit: 2 }, signal)
  if (result.ok) return { kind: 'text', path: result.value.absolutePath, text: result.value.text }
  switch (result.error.code) {
    case 'workspace-file/not-found':
      return { kind: 'missing' }
    case 'workspace-file/not-regular-file':
      return result.error.details.kind === 'directory' ? { kind: 'directory' } : { kind: 'unavailable' }
    default:
      return { kind: 'unavailable' }
  }
}

/**
 * Read all local branches through the Host Git service.
 * @param remote - mounted Client Remote namespace.
 * @param sessionId - Session whose checkout is read.
 * @param signal - request cancellation.
 * @returns local branches and the current branch.
 */
async function listBranches(remote: GitBranchRemote, sessionId: SessionId, signal: AbortSignal): Promise<GitBranchList> {
  const result = await remote.list(sessionId, signal)
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

/**
 * Switch through the Host after its clean-worktree check.
 * @param remote - mounted Client Remote namespace.
 * @param sessionId - Session whose checkout is switched.
 * @param branch - exact local branch selected in the menu.
 * @param signal - request cancellation.
 * @returns switched, dirty, or a Git refusal.
 */
async function switchBranch(
  remote: GitBranchRemote,
  sessionId: SessionId,
  branch: string,
  signal: AbortSignal,
): Promise<GitBranchSwitchResult> {
  const result = await remote.switch(sessionId, branch, signal)
  return result.ok ? result.value : { status: 'failed', message: result.error.message }
}
