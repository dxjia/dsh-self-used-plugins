/** Host Git operations for branch listing and clean-worktree switching. */
import type { Context } from '@deepseek-ai/cordis'
import type { Session } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-subprocess'
import type { SubprocessHandle } from '@deepseek-ai/dsh-subprocess'
import type {} from '@deepseek-ai/dsh-typert-registry'
import type {} from '@deepseek-ai/dsh-working-directory'
import { RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { GitBranchOperations, type GitCommandResult } from './git.ts'
import { HOST_TYPERT, type GitBranchList, type GitBranchSwitchResult } from './remote.ts'

const GIT_TIMEOUT_MS = 10_000
const TERMINATE_GRACE_MS = 2_000
const STDOUT_MAX_BYTES = 1024 * 1024
const STDERR_MAX_BYTES = 64 * 1024

/** Serves the browser branch menu for one resolved Session at a time. */
export default class GitBranchService extends TypertRemoteService {
  static inject = ['subprocess', 'workingDirectory', 'typert']

  private executable: Promise<string> | undefined
  private readonly lifetime = new AbortController()
  private readonly active = new Set<SubprocessHandle>()

  /** @param ctx - Host context carrying subprocess, Session directory, and Typert registry services. */
  constructor(ctx: Context) {
    super(ctx, 'gitBranch')
    ctx.effect(() => ctx.typert.register(HOST_TYPERT), 'git-branch: Remote definitions')
    ctx.effect(() => async () => {
      this.lifetime.abort(new Error('git-branch Host service disposed'))
      const handles = [...this.active]
      for (const handle of handles) handle.terminate()
      const settled = await Promise.allSettled(handles.map(handle => handle.waitForExit()))
      this.active.clear()
      const failed = settled.filter(result => result.status === 'rejected').length
      if (failed > 0) ctx.logger.warn(`git-branch: ${String(failed)} Git process range(s) did not confirm exit`)
    }, 'git-branch: stop child process ranges')
  }

  /**
   * List local branches of the Session's current checkout.
   * @param session - Session whose current directory is inspected.
   * @param signal - caller cancellation.
   * @returns current branch and all local branches.
   */
  async list(session: Session, signal: AbortSignal): Promise<GitBranchList> {
    this.lifetime.signal.throwIfAborted()
    return new GitBranchOperations(this.runner(signal)).list(this.ctx.workingDirectory.get(session), signal)
  }

  /**
   * Switch the Session's checkout when the worktree has no changes.
   * @param session - Session whose current directory is switched.
   * @param branch - exact local branch selected from {@link list}.
   * @param signal - caller cancellation.
   * @returns switch outcome.
   */
  async switch(session: Session, branch: string, signal: AbortSignal): Promise<GitBranchSwitchResult> {
    this.lifetime.signal.throwIfAborted()
    return new GitBranchOperations(this.runner(signal)).switch(this.ctx.workingDirectory.get(session), branch, signal)
  }

  private runner(signal: AbortSignal): (cwd: string, args: readonly string[], signal: AbortSignal) => Promise<GitCommandResult> {
    return async (cwd, args, operationSignal) => {
      let executable: string
      try {
        executable = await this.gitExecutable(AbortSignal.any([signal, this.lifetime.signal]))
      } catch (error) {
        operationSignal.throwIfAborted()
        this.lifetime.signal.throwIfAborted()
        throw new RemoteError('git-branch/git-failed', 'Git could not be resolved', { operation: 'resolve git' }, { cause: error })
      }
      const timeout = AbortSignal.timeout(GIT_TIMEOUT_MS)
      const combined = AbortSignal.any([operationSignal, timeout, this.lifetime.signal])
      let handle: ReturnType<Context['subprocess']['spawn']>
      try {
        handle = this.ctx.subprocess.spawn({
          argv: [executable, '-c', 'core.quotePath=false', ...args],
          cwd,
          stdio: {
            stdin: 'ignore',
            stdout: { maxBytes: STDOUT_MAX_BYTES },
            stderr: { maxBytes: STDERR_MAX_BYTES },
          },
          graceMs: TERMINATE_GRACE_MS,
          signal: combined,
          env: {
            GIT_CONFIG_COUNT: '0',
            GIT_OPTIONAL_LOCKS: '0',
            GIT_TERMINAL_PROMPT: '0',
            LC_ALL: 'C',
          },
        })
      } catch (error) {
        operationSignal.throwIfAborted()
        this.lifetime.signal.throwIfAborted()
        throw new RemoteError('git-branch/git-failed', `Git could not start ${args[0] ?? 'command'}`, { operation: args[0] ?? 'git' }, { cause: error })
      }
      this.active.add(handle)
      let outcome: Awaited<typeof handle.done> | undefined
      let doneFailure: unknown
      try {
        outcome = await handle.done
      } catch (error) {
        doneFailure = error
      }
      let exitFailure: unknown
      try {
        await handle.waitForExit()
      } catch (error) {
        exitFailure = error
      }
      if (exitFailure === undefined) {
        this.active.delete(handle)
      } else {
        try {
          handle.terminate()
          await handle.waitForExit()
          exitFailure = undefined
          this.active.delete(handle)
        } catch (_retry) {
          // The handle remains owned for service-disposal retry and diagnostics.
        }
      }
      if (combined.aborted) {
        operationSignal.throwIfAborted()
        this.lifetime.signal.throwIfAborted()
        throw new RemoteError(
          'git-branch/git-failed',
          `Git ${args[0] ?? 'command'} timed out after ${GIT_TIMEOUT_MS}ms`,
          { operation: args[0] ?? 'git' },
        )
      }
      if (exitFailure !== undefined) {
        throw new RemoteError(
          'git-branch/git-failed',
          `Git ${args[0] ?? 'command'} did not confirm process exit`,
          { operation: args[0] ?? 'git' },
          { cause: exitFailure },
        )
      }
      if (doneFailure !== undefined) {
        throw new RemoteError(
          'git-branch/git-failed',
          `Git could not finish ${args[0] ?? 'command'}`,
          { operation: args[0] ?? 'git' },
          { cause: doneFailure },
        )
      }
      if (outcome === undefined) {
        operationSignal.throwIfAborted()
        this.lifetime.signal.throwIfAborted()
        throw new RemoteError('git-branch/git-failed', `Git did not report completion for ${args[0] ?? 'command'}`, { operation: args[0] ?? 'git' })
      }
      return {
        exitCode: outcome.exitCode,
        stdout: handle.collected.stdout?.readFrom(0).text ?? '',
        stderr: handle.collected.stderr?.readFrom(0).text ?? '',
      }
    }
  }

  private gitExecutable(signal: AbortSignal): Promise<string> {
    this.executable ??= this.ctx.subprocess.resolveExecutable('git', undefined, signal).catch((error: unknown) => {
      this.executable = undefined
      throw error
    })
    return this.executable
  }
}
