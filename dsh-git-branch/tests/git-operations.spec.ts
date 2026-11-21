import { describe, expect, it, vi } from 'vitest'
import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { GitBranchOperations, type GitCommandResult, type GitCommandRunner } from '../src/git.ts'

function results(outputs: readonly GitCommandResult[]): GitCommandRunner {
  let index = 0
  return vi.fn(async (_cwd: string, _args: readonly string[]) => {
    const output = outputs[index++]
    if (output === undefined) throw new Error(`Unexpected Git command ${String(index)}`)
    return output
  })
}

const ok = (stdout = ''): GitCommandResult => ({ exitCode: 0, stdout, stderr: '' })
const fail = (exitCode: number, stderr: string): GitCommandResult => ({ exitCode, stdout: '', stderr })
const signal = new AbortController().signal
const exec = promisify(execFile)

const realGit: GitCommandRunner = async (cwd, args, operationSignal) => {
  try {
    const { stdout, stderr } = await exec('git', args, {
      cwd,
      signal: operationSignal,
      maxBuffer: 1024 * 1024,
    })
    return { exitCode: 0, stdout, stderr }
  } catch (error: unknown) {
    const failure = error as { code?: number; stdout?: string; stderr?: string }
    return {
      exitCode: typeof failure.code === 'number' ? failure.code : null,
      stdout: failure.stdout ?? '',
      stderr: failure.stderr ?? '',
    }
  }
}

describe('Git branch operations', () => {
  it('lists every local branch in Git order with the checked-out branch', async () => {
    const run = results([
      ok('/work/repo\n'),
      ok('refs/heads/topic\nrefs/heads/main\n'),
      ok('main\n'),
    ])
    await expect(new GitBranchOperations(run).list('/work/repo/src', signal)).resolves.toEqual({
      current: 'main',
      branches: ['topic', 'main'],
    })
  })

  it('reports detached HEAD without inventing a current branch', async () => {
    const run = results([
      ok('/work/repo\n'),
      ok('refs/heads/topic\nrefs/heads/main\n'),
      { exitCode: 1, stdout: '', stderr: '' },
    ])
    await expect(new GitBranchOperations(run).list('/work/repo', signal)).resolves.toMatchObject({ current: null })
  })

  it('refuses to switch while an untracked change exists', async () => {
    const run = results([
      ok('/work/repo\n'),
      ok('/work/repo\n'),
      ok('refs/heads/main\nrefs/heads/feature\n'),
      ok('main\n'),
      ok('?? notes.txt\u0000'),
    ])
    await expect(new GitBranchOperations(run).switch('/work/repo', 'feature', signal)).resolves.toEqual({ status: 'dirty' })
    expect(run).toHaveBeenCalledTimes(5)
    expect(run).not.toHaveBeenCalledWith('/work/repo', ['switch', '--no-guess', 'feature'], signal)
  })

  it('switches a clean worktree to a branch that is still listed', async () => {
    const run = results([
      ok('/work/repo\n'),
      ok('/work/repo\n'),
      ok('refs/heads/main\nrefs/heads/feature\n'),
      ok('main\n'),
      ok(),
      ok(),
    ])
    await expect(new GitBranchOperations(run).switch('/work/repo', 'feature', signal)).resolves.toEqual({
      status: 'switched', branch: 'feature',
    })
    expect(run).toHaveBeenLastCalledWith('/work/repo', ['switch', '--no-guess', 'feature'], signal)
  })

  it('does not invoke Git switch for a branch that vanished from the list', async () => {
    const run = results([
      ok('/work/repo\n'),
      ok('/work/repo\n'),
      ok('refs/heads/main\n'),
      ok('main\n'),
    ])
    await expect(new GitBranchOperations(run).switch('/work/repo', 'feature', signal)).resolves.toMatchObject({
      status: 'failed',
    })
    expect(run).toHaveBeenCalledTimes(4)
  })

  it('distinguishes a non-checkout from a failed Git read', async () => {
    const outside = results([fail(128, 'fatal: not a git repository (or any parent)\n')])
    await expect(new GitBranchOperations(outside).list('/tmp', signal)).rejects.toMatchObject({
      code: 'git-branch/not-a-checkout',
    })
    const broken = results([fail(1, 'fatal: bad object\n')])
    await expect(new GitBranchOperations(broken).list('/work/repo', signal)).rejects.toMatchObject({
      code: 'git-branch/git-failed',
      details: { operation: 'locate checkout' },
    })
  })

  it('lists, switches, and refuses a dirty checkout with the real Git CLI', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-git-branch-'))
    try {
      await realGit(root, ['init', '--quiet', '--initial-branch=main'], signal)
      await realGit(root, ['config', 'user.name', 'DSH Test'], signal)
      await realGit(root, ['config', 'user.email', 'dsh@example.invalid'], signal)
      await writeFile(join(root, 'README.md'), '# fixture\n')
      await realGit(root, ['add', 'README.md'], signal)
      await realGit(root, ['commit', '--quiet', '-m', 'initial'], signal)
      await realGit(root, ['branch', 'feature'], signal)

      const operations = new GitBranchOperations(realGit)
      await expect(operations.list(root, signal)).resolves.toMatchObject({ current: 'main' })
      const listed = await operations.list(root, signal)
      expect(new Set(listed.branches)).toEqual(new Set(['main', 'feature']))

      await expect(operations.switch(root, 'feature', signal)).resolves.toEqual({ status: 'switched', branch: 'feature' })
      await expect(operations.list(root, signal)).resolves.toMatchObject({ current: 'feature' })

      await writeFile(join(root, 'untracked.txt'), 'dirty\n')
      await expect(operations.switch(root, 'main', signal)).resolves.toEqual({ status: 'dirty' })
      await expect(operations.list(root, signal)).resolves.toMatchObject({ current: 'feature' })
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
