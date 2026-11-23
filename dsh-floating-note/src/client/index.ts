/** Browser registration for the persistent floating note. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { NoteIcon } from './NoteIcon.tsx'
import { NoteOverlay } from './NoteOverlay.tsx'
import { de, en, es, fr, ja, pt, ru, zh } from './locales.ts'
import { NotesSection } from './NotesSection.tsx'
import { createNoteState, type NoteInjected } from './state.ts'
import { installStyles } from './styles.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Floating note labels and controls. */
    floatingNote: keyof typeof zh
  }
}

/** Services required by the settings and overlay registrations. */
export const inject = ['slots', 'locale']

const LOCALE = 'floatingNote'

/** Register the first-level settings page and the floating note overlay. */
export function apply(ctx: Context): void {
  installStyles(ctx)
  ctx.effect(() => ctx.locale.register(LOCALE, { zh, en, ja, es, fr, de, ru, pt }), 'floating-note: copy')
  const state = createNoteState()
  const t = ctx.locale.bind(LOCALE)
  const face = (): NoteInjected => ({ hooks: { note: state.store }, actions: state.actions })
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: 'floating-note', order: 12, label: () => t('title'), locale: LOCALE, inject: face,
  }, NotesSection))
  ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
    name: 'settings.section.icon', id: 'floating-note', locale: LOCALE,
  }, NoteIcon))
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay', id: 'floating-note', locale: LOCALE, inject: face,
  }, NoteOverlay))
}
