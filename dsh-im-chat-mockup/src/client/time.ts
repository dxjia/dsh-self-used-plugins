/** Local date/time formatting and model-name projection for message chrome. */
import type { ModelDirectoryState } from '@deepseek-ai/dsh-client-ui-model-selection/client'

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * Format a message's last update in local time.
 * @param time - Unix epoch milliseconds.
 * @returns local `MM/DD HH:mm` text.
 */
export function formatLastUpdated(time: number): string {
  const date = new Date(time)
  return `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

/**
 * Resolve the display name of the current session model.
 * @param state - current model directory state.
 * @param fallback - text used before the model catalog resolves.
 * @returns model display name, then model id, then the fallback.
 */
export function resolveModelDisplayName(state: ModelDirectoryState, fallback: string): string {
  const current = state.current
  if (current === null) return fallback
  const group = state.groups.find(candidate => candidate.id === current.provider)
  return group?.models.find(candidate => candidate.id === current.model)?.name ?? current.model
}

/**
 * Join optional role name and message time.
 * @param name - role display name.
 * @param time - formatted last-updated time.
 * @param showName - whether the role name is enabled.
 * @returns metadata text for the message header.
 */
export function messageMeta(name: string, time: string, showName: boolean): string {
  return showName ? `${name} · ${time}` : time
}
