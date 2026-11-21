import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { GitCheckout } from '../src/client/git-branch.ts'
import { branchMenuItems, branchSwitchNotice, GitBranchReading } from '../src/client/GitBranchPill.tsx'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', async () => {
  const { createElement: h } = await import('react')
  return {
    IconBranchOutlineRegular: () => h('svg', { 'data-icon': 'branch' }),
    IconWarningOutlineRegular: () => h('svg', { 'data-icon': 'warning' }),
    Menu: ({ anchor }: { anchor?: ReactNode }) => anchor,
    Toast: ({ text }: { text: string }) => h('div', { role: 'alert' }, text),
    Tooltip: ({ children }: { children?: ReactNode }) => children,
  }
})

const checkout = (head: GitCheckout['head']): GitCheckout => ({
  root: '/work/repo',
  gitDir: '/work/repo/.git',
  headPath: '/work/repo/.git/HEAD',
  head,
})

const translate = (key: string, params?: Record<string, unknown>): string => {
  if (key === 'tooltip') return `Git branch: ${String(params?.branch)}`
  if (key === 'detached') return `Detached HEAD @ ${String(params?.commit)}`
  if (key === 'detachedTooltip') return `Git HEAD is at commit ${String(params?.commit)}`
  if (key === 'openMenu') return `Open branches; current branch is ${String(params?.branch)}`
  if (key === 'switched') return `Switched to branch ${String(params?.branch)}`
  if (key === 'dirty') return `The worktree has uncommitted changes; cannot switch to ${String(params?.branch)}`
  if (key === 'switchFailed') return `Could not switch branches: ${String(params?.reason)}`
  return key
}

describe('Git branch reading', () => {
  it('renders a clickable branch control as a composer statistic', () => {
    const html = renderToStaticMarkup(createElement(GitBranchReading, {
      checkout: checkout({ kind: 'branch', branch: 'feature/git-branch' }),
      open: false,
      onToggle: () => {},
      t: translate as never,
    }))
    expect(html).toContain('data-composer-stat="git-branch"')
    expect(html).toContain('feature/git-branch')
    expect(html).toContain('type="button"')
    expect(html).toContain('aria-haspopup="menu"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('aria-label="Open branches; current branch is feature/git-branch"')
  })

  it('labels a detached HEAD by its abbreviated commit', () => {
    const html = renderToStaticMarkup(createElement(GitBranchReading, {
      checkout: checkout({
        kind: 'detached',
        commit: '0123456789abcdef0123456789abcdef01234567',
        shortCommit: '0123456',
      }),
      open: true,
      onToggle: () => {},
      t: translate as never,
    }))
    expect(html).toContain('Detached HEAD @ 0123456')
    expect(html).toContain('aria-expanded="true"')
  })

  it('marks the current branch disabled and exposes every other local branch', () => {
    const entries = branchMenuItems({
      phase: 'ready',
      value: { current: 'main', branches: ['main', 'feature', 'release/1.0'] },
    }, null, translate as never)
    expect(entries).toHaveLength(3)
    expect(entries[0]).toMatchObject({ id: 'main', disabled: true })
    expect(entries[1]).toMatchObject({ id: 'feature', disabled: false })
    expect(entries[2]).toMatchObject({ id: 'release/1.0', disabled: false })
  })

  it('turns a dirty switch refusal into a warning Toast notice', () => {
    expect(branchSwitchNotice({ status: 'dirty' }, 'feature', translate as never)).toEqual({
      text: 'The worktree has uncommitted changes; cannot switch to feature',
      tone: 'warning',
    })
  })
})
