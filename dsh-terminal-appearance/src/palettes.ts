/** Curated terminal palettes used by the settings preview and the scoped runtime stylesheet. */
import type { AppearanceMode, PresetId } from './settings.ts'

/** ANSI colors in xterm order: normal 0-7 followed by bright 0-7. */
export type AnsiPalette = readonly [
  string, string, string, string, string, string, string, string,
  string, string, string, string, string, string, string, string,
]

/** Colors used by one terminal scheme variant. */
export interface TerminalPalette {
  /** Opaque terminal background. */
  background: string
  /** Default foreground text. */
  foreground: string
  /** Selection background. */
  selection: string
  /** ANSI normal and bright colors. */
  ansi: AnsiPalette
}

/** Light and dark variants of one palette. */
export interface TerminalPreset {
  /** Variant for light application themes. */
  light: TerminalPalette
  /** Variant for dark application themes. */
  dark: TerminalPalette
}

/** xterm's fallback ANSI palette used by the DSH default preset. */
export const XTERM_DEFAULT_ANSI: AnsiPalette = [
  '#2e3436', '#cc0000', '#4e9a06', '#c4a000', '#3465a4', '#75507b', '#06989a', '#d3d7cf',
  '#555753', '#ef2929', '#8ae234', '#fce94f', '#729fcf', '#ad7fa8', '#34e2e2', '#eeeeec',
]

/** The user's iTerm2 Homebrew preset, used for both light and dark application themes. */
const homebrew: TerminalPalette = {
  background: '#000000',
  foreground: '#28fe14',
  selection: 'rgba(12, 46, 238, 0.65)',
  ansi: [
    '#000000', '#c91b00', '#00c200', '#c7c400', '#0225c7', '#ca30c6', '#00c5c7', '#c7c7c7',
    '#686868', '#ff6e67', '#5ff967', '#fecb6e', '#6871ff', '#ff76ff', '#5ffcff', '#ffffff',
  ],
}

const graphLight: TerminalPalette = {
  background: '#f5f6f8',
  foreground: '#20242c',
  selection: '#c9d8ea',
  ansi: [
    '#252a33', '#b42332', '#2f7d32', '#8a6100', '#1f62b0', '#8a3b92', '#087b82', '#68707d',
    '#5a626f', '#d13a47', '#3d9340', '#a97b08', '#2c79cf', '#a64caf', '#0c929a', '#20242c',
  ],
}

const graphDark: TerminalPalette = {
  background: '#14161b',
  foreground: '#e6e8ec',
  selection: '#394251',
  ansi: [
    '#252a33', '#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd', '#56b6c2', '#d7dae0',
    '#5c6370', '#ef7a82', '#b5d68a', '#f0d39a', '#7ac0ff', '#d69ae6', '#71cbd5', '#f5f6f8',
  ],
}

const nordLight: TerminalPalette = {
  background: '#eceff4',
  foreground: '#2e3440',
  selection: '#c8d1df',
  ansi: [
    '#3b4252', '#bf4e5a', '#688a4d', '#9b741c', '#4b78a8', '#8b5d92', '#287f8b', '#5f6876',
    '#4c566a', '#b13f4b', '#5a7c3e', '#865f0c', '#356492', '#774a80', '#176d78', '#2e3440',
  ],
}

const nordDark: TerminalPalette = {
  background: '#2e3440',
  foreground: '#d8dee9',
  selection: '#4c566a',
  ansi: [
    '#3b4252', '#bf616a', '#a3be8c', '#ebcb8b', '#81a1c1', '#b48ead', '#88c0d0', '#e5e9f0',
    '#4c566a', '#c76f77', '#afc89a', '#efd29b', '#91afcd', '#c09bb8', '#8fbcbb', '#eceff4',
  ],
}

const tokyoLight: TerminalPalette = {
  background: '#e6e7ed',
  foreground: '#3760bf',
  selection: '#c4c8da',
  ansi: [
    '#343b58', '#8c4351', '#485e30', '#8f5e15', '#34548a', '#5a4a78', '#166775', '#6172b0',
    '#4d5775', '#a33f4e', '#55703a', '#a36d18', '#3f65a0', '#6c588b', '#1d7d8c', '#2e4a8f',
  ],
}

const tokyoDark: TerminalPalette = {
  background: '#1a1b26',
  foreground: '#c0caf5',
  selection: '#33467c',
  ansi: [
    '#15161e', '#f7768e', '#9ece6a', '#e0af68', '#7aa2f7', '#bb9af7', '#7dcfff', '#a9b1d6',
    '#414868', '#ff899d', '#a9e77c', '#e9c37c', '#8db0ff', '#c9a8ff', '#91d7e3', '#c0caf5',
  ],
}

const solarizedLight: TerminalPalette = {
  background: '#fdf6e3',
  foreground: '#586e75',
  selection: '#d9d2bf',
  ansi: [
    '#073642', '#dc322f', '#859900', '#b58900', '#268bd2', '#d33682', '#2aa198', '#eee8d5',
    '#586e75', '#cb4b16', '#657b83', '#a57800', '#2176b6', '#b82e70', '#248a83', '#fdf6e3',
  ],
}

const solarizedDark: TerminalPalette = {
  background: '#002b36',
  foreground: '#93a1a1',
  selection: '#0d4652',
  ansi: [
    '#073642', '#dc322f', '#859900', '#b58900', '#268bd2', '#d33682', '#2aa198', '#eee8d5',
    '#586e75', '#cb4b16', '#93a1a1', '#a57800', '#2176b6', '#b82e70', '#248a83', '#fdf6e3',
  ],
}

const gruvboxLight: TerminalPalette = {
  background: '#fbf1c7',
  foreground: '#3c3836',
  selection: '#d7c9a8',
  ansi: [
    '#3c3836', '#9d2029', '#4f6a1f', '#8f6200', '#366486', '#8c3d6f', '#287576', '#665c54',
    '#7c6f64', '#b02f39', '#5d7a26', '#a57300', '#43769b', '#a04b81', '#318887', '#282828',
  ],
}

const gruvboxDark: TerminalPalette = {
  background: '#282828',
  foreground: '#ebdbb2',
  selection: '#504945',
  ansi: [
    '#282828', '#fb4934', '#b8bb26', '#fabd2f', '#83a598', '#d3869b', '#8ec07c', '#d5c4a1',
    '#928374', '#fe8019', '#b8bb26', '#fabd2f', '#83a598', '#d3869b', '#8ec07c', '#fbf1c7',
  ],
}

/** Non-default presets, in settings display order. */
export const TERMINAL_PRESETS: Readonly<Record<Exclude<PresetId, 'dsh'>, TerminalPreset>> = Object.freeze({
  'homebrew': { light: homebrew, dark: homebrew },
  'graphite': { light: graphLight, dark: graphDark },
  'nord': { light: nordLight, dark: nordDark },
  'tokyo-night': { light: tokyoLight, dark: tokyoDark },
  'solarized': { light: solarizedLight, dark: solarizedDark },
  'gruvbox': { light: gruvboxLight, dark: gruvboxDark },
})

/**
 * Resolve the palette shown by one preset.
 * @param preset - selected preset id.
 * @param mode - whether to follow the application scheme or force one.
 * @param applicationScheme - currently resolved application color scheme.
 * @returns the effective palette, or undefined for the built-in DSH colors.
 */
export function resolveTerminalPalette(
  preset: PresetId,
  mode: AppearanceMode,
  applicationScheme: 'light' | 'dark',
): TerminalPalette | undefined {
  if (preset === 'dsh') return undefined
  const variant = mode === 'follow' ? applicationScheme : mode
  return TERMINAL_PRESETS[preset][variant]
}
