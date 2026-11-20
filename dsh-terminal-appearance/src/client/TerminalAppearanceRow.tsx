/** Terminal palette cards and variant selection for the General settings section. */
import type { CSSProperties } from 'react'
import { useId, useState } from 'react'
import {
  Button, IconChevronDownOutlineRegular, IconChevronUpOutlineRegular, Input,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ThemeSnapshot } from '@deepseek-ai/dsh-client-ui-theme/client'
import type { TerminalPalette } from '../palettes.ts'
import { resolveTerminalPalette, XTERM_DEFAULT_ANSI } from '../palettes.ts'
import type { AppearanceMode, PresetId, TerminalAppearanceSettings } from '../settings.ts'
import type { AppearanceMutation } from './preference.ts'
import type {} from './locales.ts'
import css from './TerminalAppearanceRow.module.css'

/** Business face injected by the client plugin. */
export interface TerminalAppearanceInjected {
  hooks: {
    appearance: ObservableSnapshot<ConfigFormSnapshot<TerminalAppearanceSettings>>
    theme: ObservableSnapshot<ThemeSnapshot>
    mutation: ObservableSnapshot<AppearanceMutation>
  }
  setPreset(preset: PresetId): Promise<void>
  setMode(mode: AppearanceMode): Promise<void>
  reset(): Promise<void>
  setFontSize(px: number): void
  setFontFamily(value: string): void
}

type Props = PropsRuntime<'settings.general.item'> & PropsLocale<'terminalAppearance'>
  & InjectFace<TerminalAppearanceInjected>

const PRESETS: readonly PresetId[] = ['dsh', 'homebrew', 'graphite', 'nord', 'tokyo-night', 'solarized', 'gruvbox']
const MODES: readonly AppearanceMode[] = ['follow', 'dark', 'light']
const TERMINAL_FONT_SIZE_MIN = 10
const TERMINAL_FONT_SIZE_MAX = 20

type PreviewProperties = CSSProperties & Record<`--preview-${string}`, string>
type SwatchProperties = CSSProperties & { '--swatch-color': string }

function previewProperties(palette: TerminalPalette | undefined): PreviewProperties {
  if (palette === undefined) {
    return {
      '--preview-background': 'var(--dsw-alias-bg-base)',
      '--preview-foreground': 'var(--dsw-alias-label-primary)',
      '--preview-red': 'var(--dsw-alias-state-error-primary)',
      '--preview-green': 'var(--dsw-alias-state-success-primary)',
      '--preview-yellow': 'var(--dsw-alias-state-warn-primary)',
      '--preview-blue': 'var(--dsw-alias-state-business-primary)',
    }
  }
  return {
    '--preview-background': palette.background,
    '--preview-foreground': palette.foreground,
    '--preview-red': palette.ansi[1],
    '--preview-green': palette.ansi[2],
    '--preview-yellow': palette.ansi[3],
    '--preview-blue': palette.ansi[4],
  }
}

/**
 * Render terminal palette selection.
 * @param props - slot runtime, localized copy, snapshots, and write actions.
 * @returns the General settings row.
 */
export function TerminalAppearanceRow({
  useAppearance, useTheme, useMutation, setPreset, setMode, reset, setFontSize, setFontFamily, t,
}: Props) {
  const appearance = useAppearance(value => value)
  const theme = useTheme(value => value)
  const mutation = useMutation(value => value)
  const [expanded, setExpanded] = useState(false)
  const titleId = useId()
  const bodyId = useId()
  if (appearance.status === 'loading' && appearance.value === undefined) {
    return <div className={css.row} aria-busy="true">
      <div className={css.heading}>
        <div className={css.title}>{t('title')}</div>
        <div className={css.description}>{t('description')}</div>
      </div>
      <div className={css.presetGrid} aria-hidden="true">
        {PRESETS.slice(0, 3).map(id => <div key={id} className={css.skeleton} />)}
      </div>
    </div>
  }
  if (appearance.status === 'unavailable' || appearance.value === undefined) {
    return <div className={css.row}>
      <div className={css.title}>{t('title')}</div>
      <div className={css.inlineNotice} role="status">{t('unavailable')}</div>
    </div>
  }
  const settings = appearance.value
  const disabled = mutation.busy || !appearance.writable
  const modeDisabled = disabled || settings.preset === 'dsh'
  const isDefault = settings.preset === 'dsh' && settings.mode === 'follow'
  const terminalFont = theme.fontFamilies.terminal
  const terminalFontSize = theme.fontSizes.terminal
  const selectedPalette = resolveTerminalPalette(settings.preset, settings.mode, theme.active.colorScheme)
  const summaryAnsi = selectedPalette?.ansi ?? XTERM_DEFAULT_ANSI
  const summary = t('summary', {
    preset: t(`preset.${settings.preset}`),
    mode: t(settings.mode),
    size: String(terminalFontSize),
  })
  const notice = mutation.busy ? t('saving') : mutation.notice === 'saved' ? t('saved')
    : mutation.notice === 'failed' ? t('failed') : !appearance.writable ? t('readonly') : ''
  return <section className={css.row} aria-labelledby={titleId}>
    <button type="button" className={css.summary} aria-expanded={expanded} aria-controls={bodyId}
      onClick={() => { setExpanded(value => !value) }}>
      <span className={css.heading}>
        <span className={css.title} id={titleId}>{t('title')}</span>
        <span className={css.description}>{t('description')}</span>
      </span>
      <span className={css.summaryDetails}>
        <span className={css.summaryValue}>{summary}</span>
        <span className={css.summaryAction}>{expanded ? t('collapse') : t('expand')}</span>
      </span>
      <span className={css.summaryPalette} style={previewProperties(selectedPalette)} aria-hidden="true">
        {summaryAnsi.slice(0, 8).map((color, index) => <span key={index} className={css.summarySwatch}
          style={{ '--swatch-color': color } as SwatchProperties} />)}
      </span>
      <span className={css.summaryChevron} aria-hidden="true">
        <IconChevronDownOutlineRegular size={14} />
      </span>
    </button>
    <div className={css.expandedContent} id={bodyId} hidden={!expanded}>
      <div className={css.presetHeader}>
        <div className={css.label}>{t('palette')}</div>
        <Button variant="ghost" size="sm" disabled={disabled || isDefault}
          onClick={() => { void reset() }}>{t('reset')}</Button>
      </div>
      <div className={css.presetGrid} role="group" aria-label={t('palette')}>
        {PRESETS.map((preset) => {
          const selected = settings.preset === preset
          const palette = resolveTerminalPalette(preset, settings.mode, theme.active.colorScheme)
          const ansi = palette?.ansi ?? XTERM_DEFAULT_ANSI
          return <button key={preset} type="button" className={css.presetCard}
            data-selected={selected || undefined} aria-pressed={selected} disabled={disabled}
            onClick={() => { void setPreset(preset) }}>
            <span className={css.preview} style={previewProperties(palette)} aria-hidden="true">
              <span className={css.previewPrompt}>❯ <span className={css.previewCommand}>{t('previewCommand')}</span></span>
              <span className={css.ansiStrip}>
                {ansi.map((color, index) => <span key={index} className={css.ansiSwatch}
                  style={{ '--swatch-color': color } as SwatchProperties} />)}
              </span>
            </span>
            <span className={css.presetLabel}>
              <span className={css.presetName}>{t(`preset.${preset}`)}</span>
              {selected && <span className={css.selectedMark} aria-hidden="true">✓</span>}
            </span>
          </button>
        })}
      </div>
      <div className={css.modeRow}>
        <div className={css.label}>{t('mode')}</div>
        <div className={css.modeGroup} role="group" aria-label={t('mode')}>
          {MODES.map((mode) => <button key={mode} type="button" className={css.modeButton}
            aria-pressed={settings.mode === mode} disabled={modeDisabled}
            onClick={() => { void setMode(mode) }}>{t(mode)}</button>)}
        </div>
      </div>
      <div className={css.typographyRow}>
        <div className={css.typographyText}>
          <div className={css.label}>{t('typography')}</div>
          <div className={css.typographyHint}>{t('typographyHint', {
            size: String(terminalFontSize),
            family: terminalFont === '' ? t('defaultFont') : terminalFont,
          })}</div>
        </div>
        <div className={css.typographyControls}>
          <div className={css.sizeStepper}>
            <button type="button" className={css.stepButton} disabled={disabled || terminalFontSize <= TERMINAL_FONT_SIZE_MIN}
              aria-label={t('decreaseFontSize')} onClick={() => { setFontSize(terminalFontSize - 1) }}>
              <IconChevronDownOutlineRegular size={10} />
            </button>
            <span className={css.sizeValue}>{terminalFontSize}</span>
            <button type="button" className={css.stepButton} disabled={disabled || terminalFontSize >= TERMINAL_FONT_SIZE_MAX}
              aria-label={t('increaseFontSize')} onClick={() => { setFontSize(terminalFontSize + 1) }}>
              <IconChevronUpOutlineRegular size={10} />
            </button>
          </div>
          <Input
            key={terminalFont}
            className={css.fontField ?? ''}
            defaultValue={terminalFont}
            placeholder={t('defaultFont')}
            aria-label={t('terminalFont')}
            spellCheck={false}
            autoComplete="off"
            maxLength={200}
            disabled={disabled}
            onBlur={(event) => { setFontFamily(event.currentTarget.value) }}
            onKeyDown={(event) => {
              // oxlint-disable-next-line typescript/no-deprecated -- Some IMEs report composition only through keyCode 229.
              if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
          />
        </div>
      </div>
      <div className={css.footer}>
        <span className={mutation.notice === 'failed' ? css.errorNotice : css.inlineNotice}
          role={mutation.notice === 'failed' ? 'alert' : 'status'} aria-live="polite">{notice}</span>
      </div>
    </div>
  </section>
}
