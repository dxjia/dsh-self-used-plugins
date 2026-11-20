/** Scoped CSS generation for the IM-style Chat decoration. */
import type { BackgroundPreset, ChatAppearanceSettings } from '../settings.ts'

type ColorScheme = 'light' | 'dark'

const PRESET_BACKGROUNDS: Record<Exclude<BackgroundPreset, 'custom'>, string> = {
  dusk: 'linear-gradient(135deg, #724b46 0%, #8d695f 42%, #425c7b 100%)',
  ocean: 'linear-gradient(145deg, #17324f 0%, #315271 48%, #867661 100%)',
  night: 'linear-gradient(140deg, #202943 0%, #405477 48%, #6f4c56 100%)',
}

function channels(hex: string): readonly [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ]
}

function luminance(hex: string): number {
  const values = channels(hex).map((channel) => {
    const unit = channel / 255
    return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * values[0]! + 0.7152 * values[1]! + 0.0722 * values[2]!
}

/**
 * Choose readable text for an accent-colored user surface.
 * @param background - six-digit hexadecimal accent color.
 * @returns white or near-black foreground.
 */
export function readableForeground(background: string): '#ffffff' | '#101317' {
  return luminance(background) > 0.48 ? '#101317' : '#ffffff'
}

function cssString(value: string): string {
  return JSON.stringify(value).replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029')
}

function backgroundImage(
  settings: ChatAppearanceSettings,
  customImageUrl: string | undefined,
  colorScheme: ColorScheme,
): string {
  const overlay = colorScheme === 'dark'
    ? 'linear-gradient(125deg, rgba(8, 13, 22, 0.76), rgba(20, 31, 48, 0.42))'
    : 'linear-gradient(125deg, rgba(255, 255, 255, 0.10), rgba(20, 31, 48, 0.34))'
  if (settings.backgroundPreset === 'custom' && customImageUrl !== undefined) {
    return `${overlay}, url(${cssString(customImageUrl)})`
  }
  const preset = settings.backgroundPreset === 'custom' ? 'dusk' : settings.backgroundPreset
  return `${overlay}, ${PRESET_BACKGROUNDS[preset]}`
}

/**
 * Render the plugin stylesheet for one settings and theme combination.
 * @param settings - normalized appearance settings.
 * @param colorScheme - active DSH color scheme.
 * @param customImageUrl - object URL for a stored custom image, when available.
 * @returns scoped CSS text.
 */
export function renderChatAppearanceCss(
  settings: ChatAppearanceSettings,
  colorScheme: ColorScheme,
  customImageUrl?: string,
): string {
  const solidForeground = readableForeground(settings.accent)
  const modeRules = settings.style === 'bubble'
    ? `
[data-dsh-im-enabled] [data-message-bubble] {
  --dsh-im-user-surface: color-mix(in srgb, ${settings.accent} 16%, var(--dsw-alias-bg-layer-1));
  border: 0.5px solid color-mix(in srgb, ${settings.accent} 28%, transparent);
  border-radius: 16px 16px 5px 16px;
  background: var(--dsh-im-user-surface);
  color: var(--dsw-alias-label-primary);
  box-shadow: 0 5px 16px color-mix(in srgb, ${settings.accent} 12%, transparent);
}
[data-dsh-im-enabled] [data-chat-flow-kind="user"] [data-message-bubble]::after {
  position: absolute;
  right: -5px;
  bottom: 5px;
  width: 9px;
  height: 12px;
  background: var(--dsh-im-user-surface);
  clip-path: polygon(0 0, 100% 100%, 0 100%);
  content: "";
}`
    : settings.style === 'solid'
      ? `
[data-dsh-im-enabled] [data-message-bubble] {
  border: 0;
  border-radius: 12px;
  background: ${settings.accent};
  color: ${solidForeground};
  box-shadow: 0 5px 16px color-mix(in srgb, ${settings.accent} 22%, transparent);
}`
      : `
[data-dsh-im-enabled] [data-message-bubble] {
  border: 0.5px solid rgba(255, 255, 255, 0.18);
  border-radius: 15px;
  background-color: ${settings.accent};
  background-image: ${backgroundImage(settings, customImageUrl, colorScheme)};
  background-position: center;
  background-size: cover;
  box-shadow: 0 8px 24px rgba(15, 25, 40, 0.20);
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.30);
}`

  return `
[data-chat-flow] :is(
  [data-chat-flow-kind="user"],
  [data-chat-flow-kind="steering"],
  [data-chat-flow-kind="assistant-step"]:not([data-chat-group-part]),
  [data-chat-flow-kind="assistant-step"][data-chat-group-part="response"],
  [data-submission-echo],
  [data-pending-steering]
) {
  position: relative;
  padding-top: 21px;
}
[data-dsh-im-enabled] [data-dsh-im-meta]::before {
  position: absolute;
  top: 0;
  right: 5px;
  left: 5px;
  display: flex;
  align-items: baseline;
  min-width: 0;
  height: 16px;
  margin: 0;
  padding: 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  line-height: 16px;
  white-space: nowrap;
  content: attr(data-dsh-im-meta);
  user-select: none;
}
[data-dsh-im-enabled] :is(
  [data-chat-flow-kind="user"],
  [data-chat-flow-kind="steering"],
  [data-submission-echo],
  [data-pending-steering]
)[data-dsh-im-meta]::before {
  justify-content: flex-end;
}
[data-dsh-im-enabled] [data-chat-flow-kind="assistant-step"][data-dsh-im-meta]::before {
  justify-content: flex-start;
}
[data-dsh-im-enabled] [data-message-bubble] {
  position: relative;
  box-sizing: border-box;
}
[data-dsh-im-enabled] [data-dsh-im-assistant-surface] {
  box-sizing: border-box;
  width: 100%;
  padding: 12px 15px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 15px 15px 15px 5px;
  background: ${colorScheme === 'dark'
    ? 'color-mix(in srgb, var(--dsw-alias-bg-layer-1) 94%, #ffffff 6%)'
    : 'color-mix(in srgb, var(--dsw-alias-bg-layer-1) 86%, #ffffff)'};
  box-shadow: 0 6px 20px rgba(13, 19, 29, ${colorScheme === 'dark' ? '0.18' : '0.07'});
}
${modeRules}
@media (prefers-reduced-motion: no-preference) {
  [data-dsh-im-enabled] [data-dsh-im-assistant-surface] {
    transition: background-color 160ms ease, border-color 160ms ease;
  }
}
`.trim()
}
