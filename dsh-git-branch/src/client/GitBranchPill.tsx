/** Composer statistics entry with the current checkout's Git branch menu. */
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  IconBranchOutlineRegular,
  IconWarningOutlineRegular,
  Menu,
  Toast,
  Tooltip,
  type MenuEntry,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { SessionListState, SessionSnapshot } from '@deepseek-ai/dsh-api-session-controller/client'
import type { InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-working-directory'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { GitBranchList, GitBranchSwitchResult } from '../remote.ts'
import type { GitCheckout, GitFileRead } from './git-branch.ts'
import { GitBranchTracker } from './git-branch.ts'

const RUNNING_REFRESH_MS = 3_000
const IDLE_REFRESH_MS = 15_000
const MISSING_REFRESH_MS = 30_000

interface ResolvedCheckout {
  readonly sessionId: SessionId
  readonly cwd: string
  readonly checkout: GitCheckout | null
}

type BranchMenuState =
  | { readonly phase: 'idle' }
  | { readonly phase: 'loading' }
  | { readonly phase: 'ready'; readonly value: GitBranchList }
  | { readonly phase: 'error'; readonly message: string }

interface BranchToast {
  readonly seq: number
  readonly text: string
  readonly tone: 'success' | 'warning'
}

/** Host-backed actions exposed to the browser component. */
export interface GitBranchPillInjected {
  /**
   * Read one file through the current Session's workspaceFiles authorization.
   * @param sessionId - Session authorizing the path.
   * @param path - absolute Host path.
   * @param signal - component lifetime and read cancellation.
   */
  read: (sessionId: SessionId, path: string, signal: AbortSignal) => Promise<GitFileRead>
  /**
   * List the checkout's local branches through the Host Git service.
   * @param sessionId - Session whose checkout is read.
   * @param signal - request cancellation.
   */
  list: (sessionId: SessionId, signal: AbortSignal) => Promise<GitBranchList>
  /**
   * Switch after the Host checks tracked and untracked worktree changes.
   * @param sessionId - Session whose checkout is switched.
   * @param branch - exact local branch selected in the menu.
   * @param signal - request cancellation.
   */
  switch: (sessionId: SessionId, branch: string, signal: AbortSignal) => Promise<GitBranchSwitchResult>
}

type Props = PropsRuntime<'conversation.composer.dock'>
  & PropsLocale<'gitBranch'>
  & InjectFace<GitBranchPillInjected>

const pillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  boxSizing: 'border-box',
  maxWidth: 'min(42vw, 320px)',
  padding: '1px 8px',
  border: 'none',
  borderRadius: 'var(--dsw-radius-sm)',
  background: 'transparent',
  color: 'var(--dsw-alias-label-tertiary)',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 'calc(var(--dsh-content-font-size-secondary, 13px) - 1px)',
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 'calc(20px + var(--dsh-content-font-delta-secondary, 0px))',
  whiteSpace: 'nowrap',
}

const openPillStyle: CSSProperties = {
  ...pillStyle,
  background: 'var(--dsw-alias-interactive-bg-hover)',
  color: 'var(--dsw-alias-label-secondary)',
}

const labelStyle: CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const branchLabelStyle: CSSProperties = {
  display: 'block',
  maxWidth: 'min(60vw, 360px)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

/**
 * Follow the current Session directory and expose its branch menu.
 * @param props - Session standard props, localized copy, and Host-backed actions.
 * @returns the branch trigger, menu, and transient switch notice.
 */
export function GitBranchPill({
  sessionId, useSessions, useSession, useProjection, read, list, switch: switchBranch, t,
}: Props) {
  const projectedCwd = useProjection('workingDirectory')
  const listedCwd = useSessions((state: SessionListState) => state.byId[sessionId]?.cwd)
  const cwd = projectedCwd ?? listedCwd
  const running = useSession((state: SessionSnapshot) => state.running)
  const runningRef = useRef(running)
  runningRef.current = running
  const [resolved, setResolved] = useState<ResolvedCheckout | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [open, setOpen] = useState(false)
  const [branchMenu, setBranchMenu] = useState<BranchMenuState>({ phase: 'idle' })
  const [switching, setSwitching] = useState<string | null>(null)
  const [toast, setToast] = useState<BranchToast | null>(null)
  const toastSeq = useRef(0)
  const listRequest = useRef<AbortController | null>(null)
  const switchRequest = useRef<AbortController | null>(null)
  const switchSeq = useRef(0)
  const tracker = useRef(new GitBranchTracker(read))

  useEffect(() => {
    tracker.current.reset()
    if (cwd === undefined || cwd === '') return
    const lifetime = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    let active = true

    const refresh = async (): Promise<void> => {
      let next: GitCheckout | undefined
      try {
        next = await tracker.current.refresh(sessionId, cwd, lifetime.signal)
      } catch (error) {
        if (lifetime.signal.aborted) return
        console.warn('git-branch: refresh failed:', error)
      }
      if (!active || lifetime.signal.aborted) return
      setResolved(previous => previous?.sessionId === sessionId && previous.cwd === cwd
        && sameCheckout(previous.checkout, next ?? null)
        ? previous
        : { sessionId, cwd, checkout: next ?? null })
      const delay = next === undefined
        ? MISSING_REFRESH_MS
        : runningRef.current ? RUNNING_REFRESH_MS : IDLE_REFRESH_MS
      timer = setTimeout(() => { void refresh() }, delay)
    }

    void refresh()
    return () => {
      active = false
      lifetime.abort()
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [cwd, refreshVersion, sessionId])

  useEffect(() => {
    listRequest.current?.abort()
    switchRequest.current?.abort()
    switchSeq.current += 1
    setOpen(false)
    setBranchMenu({ phase: 'idle' })
    setSwitching(null)
    setToast(null)
    return () => {
      listRequest.current?.abort()
      switchRequest.current?.abort()
      switchSeq.current += 1
    }
  }, [cwd, sessionId])

  const checkout = resolved?.sessionId === sessionId && resolved.cwd === cwd ? resolved.checkout : null
  if (checkout === null) return null

  const showToast = (text: string, tone: BranchToast['tone']): void => {
    setToast({ seq: ++toastSeq.current, text, tone })
  }

  const loadBranches = (): void => {
    listRequest.current?.abort()
    const request = new AbortController()
    listRequest.current = request
    setBranchMenu({ phase: 'loading' })
    void list(sessionId, request.signal).then((value) => {
      if (!request.signal.aborted) setBranchMenu({ phase: 'ready', value })
    }, (error: unknown) => {
      if (!request.signal.aborted) {
        setBranchMenu({ phase: 'error', message: error instanceof Error ? error.message : String(error) })
      }
    })
  }

  const toggleMenu = (): void => {
    if (open) {
      listRequest.current?.abort()
      setOpen(false)
      return
    }
    setOpen(true)
    loadBranches()
  }

  const closeMenu = (): void => {
    listRequest.current?.abort()
    setOpen(false)
  }

  const selectBranch = (branch: string): void => {
    const current = branchMenu.phase === 'ready' ? branchMenu.value.current : null
    if (switching !== null || branch === current) return
    closeMenu()
    setSwitching(branch)
    const request = new AbortController()
    switchRequest.current = request
    const sequence = ++switchSeq.current
    void switchBranch(sessionId, branch, request.signal).then((result) => {
      if (request.signal.aborted || sequence !== switchSeq.current) return
      setSwitching(null)
      const notice = branchSwitchNotice(result, branch, t)
      if (notice === null) return
      showToast(notice.text, notice.tone)
      if (result.status === 'switched') {
        setRefreshVersion(value => value + 1)
      }
    }, (error: unknown) => {
      if (request.signal.aborted || sequence !== switchSeq.current) return
      setSwitching(null)
      showToast(t('switchFailed', { reason: error instanceof Error ? error.message : String(error) }), 'warning')
    })
  }

  const items = branchMenuItems(branchMenu, switching, t)
  const current = branchMenu.phase === 'ready' ? branchMenu.value.current ?? undefined : undefined
  return <>
    <Menu
      open={open}
      anchor={<GitBranchReading checkout={checkout} open={open} onToggle={toggleMenu} t={t} />}
      items={items}
      selectedId={current}
      onSelect={selectBranch}
      onClose={closeMenu}
      side="top"
      align="start"
      portal
      autoFocus
    />
    {toast !== null && (
      <Toast
        key={toast.seq}
        text={toast.text}
        {...toast.tone === 'success'
          ? { tone: 'success' as const }
          : { icon: <IconWarningOutlineRegular /> }}
        onDone={() => { setToast(null) }}
      />
    )}
  </>
}

/**
 * Clickable branch reading used as the menu anchor.
 * @param props - checkout, menu state, toggle callback, and localized copy.
 * @returns the branch button.
 */
export function GitBranchReading({
  checkout, open, onToggle, t,
}: {
  readonly checkout: GitCheckout
  readonly open: boolean
  readonly onToggle: () => void
  readonly t: TranslateNS<'gitBranch'>
}) {
  const display = checkout.head.kind === 'branch'
    ? checkout.head.branch
    : t('detached', { commit: checkout.head.shortCommit })
  const tooltip = checkout.head.kind === 'branch'
    ? t('tooltip', { branch: display })
    : t('detachedTooltip', { commit: checkout.head.commit })

  return (
    <Tooltip label={tooltip} side="top" portal delayMs={200} onlyWhenClipped disabled={open}>
      <button
        type="button"
        style={open ? openPillStyle : pillStyle}
        aria-label={t('openMenu', { branch: display })}
        aria-haspopup="menu"
        aria-expanded={open}
        data-composer-stat="git-branch"
        onClick={onToggle}
      >
        <IconBranchOutlineRegular size={14} />
        <span style={labelStyle}>{display}</span>
      </button>
    </Tooltip>
  )
}

/**
 * Present one menu snapshot without branching over React state in the render tree.
 * @param state - branch list request state.
 * @param switching - branch currently being switched, or null.
 * @param t - localized copy.
 * @returns menu data rows, labels, or an empty list.
 */
export function branchMenuItems(
  state: BranchMenuState,
  switching: string | null,
  t: TranslateNS<'gitBranch'>,
): readonly MenuEntry[] {
  if (state.phase === 'idle' || state.phase === 'loading') {
    return [{ type: 'label', id: 'loading', text: t('loadingBranches') }]
  }
  if (state.phase === 'error') {
    return [{ type: 'label', id: 'error', text: t('loadFailed', { reason: state.message }) }]
  }
  if (state.value.branches.length === 0) {
    return [{ type: 'label', id: 'empty', text: t('noBranches') }]
  }
  return state.value.branches.map((branch): MenuEntry => ({
    id: branch,
    label: <span style={branchLabelStyle}>{branch}</span>,
    disabled: switching !== null || branch === state.value.current,
  }))
}

/**
 * Map one settled switch result to its localized Toast.
 * @param result - Host switch outcome.
 * @param branch - branch the person selected.
 * @param t - localized copy.
 * @returns success or warning notice.
 */
export function branchSwitchNotice(
  result: GitBranchSwitchResult,
  branch: string,
  t: TranslateNS<'gitBranch'>,
): Pick<BranchToast, 'text' | 'tone'> {
  switch (result.status) {
    case 'switched':
      return { text: t('switched', { branch: result.branch }), tone: 'success' }
    case 'dirty':
      return { text: t('dirty', { branch }), tone: 'warning' }
    case 'failed':
      return { text: t('switchFailed', { reason: result.message }), tone: 'warning' }
  }
}

function sameCheckout(left: GitCheckout | null, right: GitCheckout | null): boolean {
  if (left === null || right === null) return left === right
  if (left.root !== right.root || left.headPath !== right.headPath) return false
  if (left.head.kind === 'branch' && right.head.kind === 'branch') return left.head.branch === right.head.branch
  if (left.head.kind === 'detached' && right.head.kind === 'detached') return left.head.commit === right.head.commit
  return false
}
