import { describe, expect, it, vi } from 'vitest'
import {
  findGitCheckout, GitBranchTracker, joinHostPath, parentHostPath, parseGitHead, resolveHostPath,
  type GitFileRead, type GitFileReader,
} from '../src/client/git-branch.ts'

function readerFor(files: Readonly<Record<string, GitFileRead>>): GitFileReader {
  return vi.fn(async (_sessionId: string, path: string): Promise<GitFileRead> =>
    files[path] ?? { kind: 'missing' })
}

describe('host path helpers', () => {
  it('joins and walks POSIX directories', () => {
    expect(joinHostPath('/work/repo/', '.git')).toBe('/work/repo/.git')
    expect(joinHostPath('/', '.git')).toBe('/.git')
    expect(parentHostPath('/work/repo/src')).toBe('/work/repo')
    expect(parentHostPath('/work')).toBe('/')
    expect(parentHostPath('/')).toBeUndefined()
  })

  it('joins and walks Windows drive directories', () => {
    expect(joinHostPath('C:\\work\\repo\\', '.git')).toBe('C:\\work\\repo\\.git')
    expect(parentHostPath('C:\\work\\repo\\src')).toBe('C:\\work\\repo')
    expect(parentHostPath('C:\\work')).toBe('C:\\')
    expect(parentHostPath('C:\\')).toBeUndefined()
  })

  it('resolves worktree gitdir values relative to the checkout', () => {
    expect(resolveHostPath('/work/repo', '../repo.git/worktrees/topic')).toBe('/work/repo/../repo.git/worktrees/topic')
    expect(resolveHostPath('C:\\work\\repo', '..\\main.git\\worktrees\\topic')).toBe('C:\\work\\repo\\..\\main.git\\worktrees\\topic')
    expect(resolveHostPath('/work/repo', '/work/main.git/worktrees/topic')).toBe('/work/main.git/worktrees/topic')
  })
})

describe('Git HEAD parsing', () => {
  it('reads local branch refs and tolerates CRLF', () => {
    expect(parseGitHead('ref: refs/heads/feature/nested\r\n')).toEqual({
      kind: 'branch', branch: 'feature/nested',
    })
  })

  it('keeps non-head symbolic refs without the refs prefix', () => {
    expect(parseGitHead('ref: refs/remotes/origin/main\n')).toEqual({
      kind: 'branch', branch: 'remotes/origin/main',
    })
  })

  it('reports detached HEAD with its commit and seven-character abbreviation', () => {
    expect(parseGitHead('0123456789abcdef0123456789abcdef01234567\n')).toEqual({
      kind: 'detached',
      commit: '0123456789abcdef0123456789abcdef01234567',
      shortCommit: '0123456',
    })
  })

  it('rejects malformed HEAD content', () => {
    expect(parseGitHead('main')).toBeUndefined()
    expect(parseGitHead('ref: ')).toBeUndefined()
    expect(parseGitHead('0123456')).toBeUndefined()
  })
})

describe('Git checkout discovery', () => {
  const signal = () => new AbortController().signal

  it('finds the nearest normal repository above the Session directory', async () => {
    const read = readerFor({
      '/work/repo/sub/.git': { kind: 'missing' },
      '/work/repo/.git': { kind: 'directory' },
      '/work/repo/.git/HEAD': { kind: 'text', path: '/work/repo/.git/HEAD', text: 'ref: refs/heads/main\n' },
    })
    await expect(findGitCheckout(read, 's1', '/work/repo/sub', signal())).resolves.toEqual({
      root: '/work/repo',
      gitDir: '/work/repo/.git',
      headPath: '/work/repo/.git/HEAD',
      head: { kind: 'branch', branch: 'main' },
    })
  })

  it('reads a linked worktree HEAD through the gitdir file', async () => {
    const read = readerFor({
      '/work/topic/.git': { kind: 'text', path: '/work/topic/.git', text: 'gitdir: /work/main/.git/worktrees/topic\n' },
      '/work/main/.git/worktrees/topic/HEAD': {
        kind: 'text', path: '/work/main/.git/worktrees/topic/HEAD', text: 'ref: refs/heads/topic\n',
      },
    })
    await expect(findGitCheckout(read, 's1', '/work/topic', signal())).resolves.toMatchObject({
      root: '/work/topic',
      gitDir: '/work/main/.git/worktrees/topic',
      head: { kind: 'branch', branch: 'topic' },
    })
  })

  it('stops at the nearest .git marker instead of borrowing an outer repository', async () => {
    const read = readerFor({
      '/work/nested/.git': { kind: 'directory' },
      '/work/nested/.git/HEAD': { kind: 'missing' },
      '/work/.git': { kind: 'directory' },
      '/work/.git/HEAD': { kind: 'text', path: '/work/.git/HEAD', text: 'ref: refs/heads/outer\n' },
    })
    await expect(findGitCheckout(read, 's1', '/work/nested', signal())).resolves.toBeUndefined()
    expect(read).not.toHaveBeenCalledWith('s1', '/work/.git', expect.any(AbortSignal))
  })

  it('returns undefined outside a repository and when the nearest marker is unreadable', async () => {
    await expect(findGitCheckout(readerFor({}), 's1', '/tmp/project', signal())).resolves.toBeUndefined()
    const unreadable = readerFor({ '/work/project/.git': { kind: 'unavailable' } })
    await expect(findGitCheckout(unreadable, 's1', '/work/project', signal())).resolves.toBeUndefined()
  })
})

describe('GitBranchTracker', () => {
  it('refreshes a discovered checkout by reading only HEAD', async () => {
    let head = 'ref: refs/heads/main\n'
    const read = vi.fn(async (_sessionId: string, path: string): Promise<GitFileRead> => {
      if (path === '/work/repo/.git') return { kind: 'directory' }
      if (path === '/work/repo/.git/HEAD') return { kind: 'text', path, text: head }
      return { kind: 'missing' }
    })
    const tracker = new GitBranchTracker(read)
    const signal = new AbortController().signal
    expect(await tracker.refresh('s1', '/work/repo/src', signal)).toMatchObject({
      root: '/work/repo', head: { kind: 'branch', branch: 'main' },
    })
    head = 'ref: refs/heads/topic\n'
    expect(await tracker.refresh('s1', '/work/repo/src', signal)).toMatchObject({
      head: { kind: 'branch', branch: 'topic' },
    })
    expect(read).toHaveBeenCalledTimes(4)
  })
})
