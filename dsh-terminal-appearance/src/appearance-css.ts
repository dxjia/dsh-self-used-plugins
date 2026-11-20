/** Render the terminal-only CSS layer from a validated palette. */
import type { TerminalPalette } from './palettes.ts'

const ANSI_NAMES = [
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
  'bright-black', 'bright-red', 'bright-green', 'bright-yellow',
  'bright-blue', 'bright-magenta', 'bright-cyan', 'bright-white',
] as const

/**
 * Render the scoped CSS that applies a palette without changing the global DSH theme.
 * @param palette - effective terminal palette.
 * @returns stylesheet text targeting the sidebar terminal only.
 */
export function renderTerminalAppearanceCss(palette: TerminalPalette): string {
  const scope = '[data-sidebar-terminal]'
  const ansi = palette.ansi.map((color, index) => [
    `${scope} .xterm .xterm-fg-${index} { color: ${color} !important; }`,
    `${scope} .xterm .xterm-bg-${index} { background-color: ${color} !important; }`,
  ].join('\n')).join('\n')
  return [
    `${scope} {`,
    `  --terminal-appearance-background: ${palette.background};`,
    `  --terminal-appearance-foreground: ${palette.foreground};`,
    `  --terminal-appearance-selection: ${palette.selection};`,
    `  --dsw-alias-bg-base: var(--terminal-appearance-background);`,
    `  --dsw-alias-label-primary: var(--terminal-appearance-foreground);`,
    '}',
    `${scope} .xterm-viewport { background-color: var(--terminal-appearance-background) !important; }`,
    `${scope} .xterm-rows { color: var(--terminal-appearance-foreground) !important; }`,
    `${scope} .xterm-selection div { background-color: var(--terminal-appearance-selection) !important; }`,
    ansi,
  ].join('\n')
}

/**
 * Name one ANSI slot for diagnostics and tests.
 * @param index - zero-based ANSI palette index.
 * @returns a stable slot name.
 */
export function ansiSlotName(index: number): typeof ANSI_NAMES[number] {
  return ANSI_NAMES[index]!
}
