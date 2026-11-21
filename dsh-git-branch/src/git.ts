/** Read-only branch discovery and clean-worktree switching through explicit Git argv. */
import { RemoteError } from '@deepseek-ai/dsh-typert-protocol'
import type {
  GitBranchList,
  GitBranchSwitchResult,
} from './remote.ts'

/** Settled direct Git command output. */
export interface GitCommandResult {
  readonly exitCode: number | null
  readonly stdout: string
  readonly stderr: string
}

/** Run one Git command in an absolute working directory. */
export type GitCommandRunner = (
  cwd: string,
  args: readonly string[],
  signal: AbortSignal,
) => Promise<GitCommandResult>

const HEADS_PREFIX = 'refs/heads/'

/**
 * List local branches and switch only when the complete worktree is clean.
 */
export class GitBranchOperations {
  /** @param run - explicit-argv Git runner bound to the Host execution world. */
  constructor(private readonly run: GitCommandRunner) {}

  /**
   * Read the enclosing checkout and its local branches.
   * @param directory - Session's current working directory.
   * @param signal - request cancellation.
   * @returns the checked-out branch and every local branch in recent-first order.
   * @throws {RemoteError} `git-branch/not-a-checkout` or `git-branch/git-failed`.
   */
  async list(directory: string, signal: AbortSignal): Promise<GitBranchList> {
    const root = await this.root(directory, signal)
    const [refs, current] = await Promise.all([
      this.run(root, ['for-each-ref', '--sort=-committerdate', '--format=%(refname)', HEADS_PREFIX], signal),
      this.run(root, ['symbolic-ref', '--quiet', '--short', 'HEAD'], signal),
    ])
    if (refs.exitCode !== 0) this.failed('list branches', refs)
    if (current.exitCode !== 0 && current.exitCode !== 1) this.failed('read current branch', current)
    const branches = refs.stdout.split(/\r?\n/)
      .filter(line => line.startsWith(HEADS_PREFIX))
      .map(line => line.slice(HEADS_PREFIX.length))
      .filter(branch => branch !== '')
    return {
      current: current.exitCode === 0 && current.stdout.trim() !== '' ? current.stdout.trim() : null,
      branches,
    }
  }

  /**
   * Switch to one listed local branch if every tracked and untracked worktree path is unchanged.
   * @param directory - Session's current working directory.
   * @param branch - local branch selected from {@link list}.
   * @param signal - request cancellation.
   * @returns switched, dirty, or a Git refusal without changing branches.
   * @throws {RemoteError} when checkout discovery or status reading fails.
   */
  async switch(directory: string, branch: string, signal: AbortSignal): Promise<GitBranchSwitchResult> {
    const root = await this.root(directory, signal)
    const listed = await this.list(root, signal)
    if (!listed.branches.includes(branch)) {
      return { status: 'failed', message: `Local branch "${branch}" no longer exists` }
    }
    if (listed.current === branch) return { status: 'switched', branch }
    const status = await this.run(root, ['status', '--porcelain=v1', '-z', '--untracked-files=normal'], signal)
    if (status.exitCode !== 0) this.failed('read worktree status', status)
    if (status.stdout.length > 0) return { status: 'dirty' }
    const switched = await this.run(root, ['switch', '--no-guess', branch], signal)
    if (switched.exitCode !== 0) {
      const diagnostic = firstLine(switched.stderr) || firstLine(switched.stdout) || 'Git refused the branch switch'
      return { status: 'failed', message: diagnostic }
    }
    return { status: 'switched', branch }
  }

  private async root(directory: string, signal: AbortSignal): Promise<string> {
    const found = await this.run(directory, ['rev-parse', '--show-toplevel'], signal)
    if (found.exitCode === 128 && /not a git repository/i.test(found.stderr)) {
      throw new RemoteError('git-branch/not-a-checkout', `"${directory}" is not inside a Git checkout`, {})
    }
    if (found.exitCode !== 0) this.failed('locate checkout', found)
    const root = found.stdout.split(/\r?\n/, 1)[0]?.trim() ?? ''
    if (root === '') this.failed('locate checkout', found)
    return root
  }

  private failed(operation: string, result: GitCommandResult): never {
    const diagnostic = firstLine(result.stderr) || firstLine(result.stdout) || `exit ${String(result.exitCode)}`
    throw new RemoteError('git-branch/git-failed', `Git could not ${operation}: ${diagnostic}`, { operation })
  }
}

function firstLine(output: string): string {
  return (output.split(/\r?\n/, 1)[0] ?? '').trim().slice(0, 300)
}
