/** Git checkout discovery and HEAD parsing over the workspaceFiles read face. */

/** One readable-file outcome, with Host errors reduced to the distinctions discovery needs. */
export type GitFileRead =
  | { readonly kind: 'text'; readonly path: string; readonly text: string }
  | { readonly kind: 'directory' }
  | { readonly kind: 'missing' }
  | { readonly kind: 'unavailable' }

/** Read one Host file through the Session-authorized workspaceFiles namespace. */
export type GitFileReader<Session extends string = string> = (
  sessionId: Session,
  path: string,
  signal: AbortSignal,
) => Promise<GitFileRead>

/** Checked-out branch name or the commit named by a detached HEAD. */
export type GitHead =
  | { readonly kind: 'branch'; readonly branch: string }
  | { readonly kind: 'detached'; readonly commit: string; readonly shortCommit: string }

/** Repository facts needed to render and refresh one checkout's HEAD. */
export interface GitCheckout {
  readonly root: string
  readonly gitDir: string
  readonly headPath: string
  readonly head: GitHead
}

const WINDOWS_DRIVE = /^[a-zA-Z]:[\\/]/
const WINDOWS_ROOT = /^[a-zA-Z]:[\\/]?$/
const UNC_ROOT = /^\\\\[^\\]+\\[^\\]+\\?$/
const GITDIR = /^gitdir:\s*(.+?)\s*$/i
const OBJECT_ID = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i

/** @returns whether the path uses Windows drive or UNC syntax. */
export function isWindowsPath(path: string): boolean {
  return WINDOWS_DRIVE.test(path) || path.startsWith('\\\\')
}

/**
 * Join a host path without importing Node's browser-incompatible path module.
 * @param base - absolute base directory.
 * @param child - relative child path.
 * @returns the joined path using the base path's separator.
 */
export function joinHostPath(base: string, child: string): string {
  const separator = isWindowsPath(base) ? '\\' : '/'
  const trimmed = base.replace(/[\\/]+$/, '')
  if (trimmed === '') return `${separator}${child}`
  return `${trimmed}${trimmed.endsWith('/') || trimmed.endsWith('\\') ? '' : separator}${child}`
}

/**
 * Resolve one path emitted by Git against its repository working directory.
 * @param base - repository working directory.
 * @param path - absolute or relative path from a `.git` file.
 * @returns a host absolute path.
 */
export function resolveHostPath(base: string, path: string): string {
  return path.startsWith('/') || WINDOWS_DRIVE.test(path) || path.startsWith('\\\\')
    ? path
    : joinHostPath(base, path)
}

/**
 * Find the parent directory Git discovery would visit next.
 * @param path - absolute host path.
 * @returns the parent, or undefined at a filesystem root or for a non-absolute path.
 */
export function parentHostPath(path: string): string | undefined {
  const trimmed = path.replace(/[\\/]+$/, '')
  if (!isWindowsPath(trimmed) && !trimmed.startsWith('/')) return undefined
  if (trimmed === '') return undefined
  if (isWindowsPath(trimmed)) {
    if (WINDOWS_ROOT.test(trimmed) || UNC_ROOT.test(trimmed)) return undefined
    const index = Math.max(trimmed.lastIndexOf('\\'), trimmed.lastIndexOf('/'))
    if (index <= 2) return `${trimmed.slice(0, 2)}\\`
    return trimmed.slice(0, index)
  }
  if (trimmed === '/') return undefined
  const index = trimmed.lastIndexOf('/')
  return index <= 0 ? '/' : trimmed.slice(0, index)
}

/**
 * Parse `.git/HEAD`.
 * @param text - committed HEAD file content.
 * @returns the checked-out ref or detached commit, or undefined for malformed content.
 */
export function parseGitHead(text: string): GitHead | undefined {
  const value = text.split(/\r?\n/, 1)[0]?.trim() ?? ''
  if (value.startsWith('ref: ')) {
    const ref = value.slice('ref: '.length)
    if (ref.startsWith('refs/heads/')) {
      const branch = ref.slice('refs/heads/'.length)
      return branch === '' ? undefined : { kind: 'branch', branch }
    }
    if (ref.startsWith('refs/')) {
      const branch = ref.slice('refs/'.length)
      return branch === '' ? undefined : { kind: 'branch', branch }
    }
    return undefined
  }
  return OBJECT_ID.test(value)
    ? { kind: 'detached', commit: value.toLowerCase(), shortCommit: value.slice(0, 7).toLowerCase() }
    : undefined
}

/** Read one HEAD file and parse it. */
async function readHead<Session extends string>(
  read: GitFileReader<Session>,
  sessionId: Session,
  headPath: string,
  signal: AbortSignal,
): Promise<{ readonly path: string; readonly head: GitHead } | undefined> {
  const result = await read(sessionId, headPath, signal)
  if (result.kind !== 'text') return undefined
  const head = parseGitHead(result.text)
  return head === undefined ? undefined : { path: result.path, head }
}

/**
 * Resolve the nearest repository containing `cwd`, including linked worktrees and submodules whose `.git` is a file.
 * @param read - Session-authorized file reader.
 * @param sessionId - Session authorizing the reads.
 * @param cwd - Session working directory, absolute in the Host execution world.
 * @param signal - cancellation.
 * @returns checkout facts, or undefined when no enclosing Git checkout has a readable HEAD.
 */
export async function findGitCheckout<Session extends string>(
  read: GitFileReader<Session>,
  sessionId: Session,
  cwd: string,
  signal: AbortSignal,
): Promise<GitCheckout | undefined> {
  for (let directory: string | undefined = cwd; directory !== undefined; directory = parentHostPath(directory)) {
    signal.throwIfAborted()
    const dotGitPath = joinHostPath(directory, '.git')
    const dotGit = await read(sessionId, dotGitPath, signal)
    if (dotGit.kind === 'missing') continue
    if (dotGit.kind === 'unavailable') return undefined

    let gitDir: string
    if (dotGit.kind === 'directory') {
      gitDir = dotGitPath
    } else {
      const match = GITDIR.exec(dotGit.text)
      if (match?.[1] === undefined) return undefined
      gitDir = resolveHostPath(directory, match[1])
    }

    const head = await readHead(read, sessionId, joinHostPath(gitDir, 'HEAD'), signal)
    return head === undefined
      ? undefined
      : { root: directory, gitDir, headPath: head.path, head: head.head }
  }
  return undefined
}

/**
 * Refresh a discovered checkout by reading only HEAD; rediscover the repository
 * when that HEAD disappears or becomes malformed.
 */
export class GitBranchTracker<Session extends string = string> {
  private checkout: GitCheckout | undefined
  private cwd: string | undefined

  /**
   * @param read - Session-authorized file reader.
   */
  constructor(private readonly read: GitFileReader<Session>) {}

  /**
   * Read the current branch for one Session directory.
   * @param sessionId - Session authorizing the reads.
   * @param cwd - current Session working directory.
   * @param signal - cancellation.
   * @returns current checkout, or undefined outside a readable Git repository.
   */
  async refresh(sessionId: Session, cwd: string, signal: AbortSignal): Promise<GitCheckout | undefined> {
    if (this.cwd === cwd && this.checkout !== undefined) {
      const head = await readHead(this.read, sessionId, this.checkout.headPath, signal)
      if (head !== undefined) {
        if (head.head === this.checkout.head) return this.checkout
        this.checkout = { ...this.checkout, headPath: head.path, head: head.head }
        return this.checkout
      }
    }
    this.cwd = cwd
    this.checkout = await findGitCheckout(this.read, sessionId, cwd, signal)
    return this.checkout
  }

  /** Drop cached discovery so the next refresh walks the directory tree again. */
  reset(): void {
    this.cwd = undefined
    this.checkout = undefined
  }
}
