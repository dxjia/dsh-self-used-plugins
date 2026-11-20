/** Ordered three-session cycle built from observable main-view navigation. */
import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** Maximum number of sessions retained in the cycle. */
export const SESSION_CYCLE_SIZE = 3

/** Sessions older than this are no longer eligible for the shortcut. */
export const SESSION_CYCLE_WINDOW_MS = 60 * 60 * 1000

/** One Session and the time it most recently became the main view. */
export interface RecentSessionVisit {
  readonly id: SessionId
  readonly visitedAt: number
}

/**
 * Keep one stable cycle across consecutive shortcut-driven switches while
 * rebuilding it around navigation performed by any other UI.
 */
export class RecentSessionCycle {
  private visits: RecentSessionVisit[]
  private current: SessionId | undefined
  private cursor = 0
  /** Target requested by this plugin and not yet observed as the main view. */
  private pending: SessionId | undefined

  /**
   * @param initialVisits - persisted visit records, most recent first.
   */
  constructor(initialVisits: readonly RecentSessionVisit[] = []) {
    this.visits = this.unique(initialVisits).slice(0, SESSION_CYCLE_SIZE)
  }

  /** @returns the retained visit records, cycle order first. */
  snapshot(): readonly RecentSessionVisit[] {
    return this.visits
  }

  /**
   * Reconcile the cycle with the current main view and currently navigable Sessions.
   * @param current - Session currently retained by the main view.
   * @param eligible - Sessions that may participate in navigation.
   * @param now - current wall-clock time used for the one-hour window.
   * @returns whether the persisted visit sequence changed.
   */
  observe(current: SessionId | undefined, eligible: readonly SessionId[], now: number): boolean {
    const previous = this.visits
    const allowed = new Set(eligible)
    const cutoff = now - SESSION_CYCLE_WINDOW_MS
    this.visits = this.visits.filter(visit => allowed.has(visit.id) && visit.visitedAt > cutoff)

    if (current === undefined || !allowed.has(current)) {
      this.current = undefined
      this.pending = undefined
      if (this.visits.length === 0) this.cursor = 0
      else this.cursor = Math.min(this.cursor, this.visits.length - 1)
      return !sameVisits(previous, this.visits)
    }

    if (this.pending === current) {
      this.current = current
      const index = this.visits.findIndex(visit => visit.id === current)
      if (index >= 0) this.cursor = index
      this.pending = undefined
      return !sameVisits(previous, this.visits)
    }

    if (current !== this.current) {
      const previousCurrent = this.current
      this.visits = this.visits
        .map(visit => visit.id === previousCurrent ? { ...visit, visitedAt: now } : visit)
      if (!this.visits.some(visit => visit.id === current)) {
        this.visits.unshift({ id: current, visitedAt: now })
      }
      this.visits = this.unique([
        ...this.visits.filter(visit => visit.id === current),
        ...(previousCurrent === undefined ? [] : this.visits.filter(visit => visit.id === previousCurrent)),
        ...this.visits,
      ]).slice(0, SESSION_CYCLE_SIZE)
      this.current = current
      this.cursor = 0
      this.pending = undefined
      return !sameVisits(previous, this.visits)
    }

    this.cursor = Math.max(0, this.visits.findIndex(visit => visit.id === current))
    return !sameVisits(previous, this.visits)
  }

  /**
   * Read the next Session without committing a shortcut-driven transition.
   * @param now - current wall-clock time used for the one-hour window.
   * @returns next Session, or undefined while no second Session is available.
   */
  next(now: number): SessionId | undefined {
    const cutoff = now - SESSION_CYCLE_WINDOW_MS
    this.visits = this.visits.filter(visit => visit.visitedAt > cutoff)
    if (this.visits.length < 2) return undefined
    const currentIndex = this.current === undefined
      ? -1
      : this.visits.findIndex(visit => visit.id === this.current)
    const index = currentIndex < 0 ? 0 : (currentIndex + 1) % this.visits.length
    return this.visits[index]?.id
  }

  /**
   * Record the target immediately before asking DSH to open it.
   * @param target - Session the plugin is about to open.
   * @param now - current wall-clock time recorded as the new visit time.
   */
  accept(target: SessionId, now: number): void {
    this.visits = this.visits.map(visit => visit.id === target ? { ...visit, visitedAt: now } : visit)
    this.pending = target
  }

  /** Cancel a target whose navigation failed synchronously. */
  cancel(): void {
    this.pending = undefined
  }

  private unique(visits: readonly RecentSessionVisit[]): RecentSessionVisit[] {
    const seen = new Set<SessionId>()
    return visits.filter((visit) => {
      if (seen.has(visit.id)) return false
      seen.add(visit.id)
      return true
    })
  }
}

function sameVisits(left: readonly RecentSessionVisit[], right: readonly RecentSessionVisit[]): boolean {
  return left.length === right.length
    && left.every((visit, index) => visit.id === right[index]?.id && visit.visitedAt === right[index]?.visitedAt)
}
