/** Browser registration for IM chat appearance settings and Chat decoration. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-model-selection/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import {
  CHAT_APPEARANCE_NAMESPACE,
  type ChatAppearanceSettings,
} from '../settings.ts'
import { ChatAppearancePreference } from './preference.ts'
import { ChatAppearanceDecorator } from './decorator.tsx'
import { ChatAppearanceRow, type ChatAppearanceRowInjected } from './ChatAppearanceRow.tsx'
import { installComponentStyles } from './component-styles.ts'
import { installChatAppearance } from './runtime.ts'
import { de, en, es, fr, ja, pt, ru, zh } from './locales.ts'

/** Services required by settings, the decorator, model names, and styling. */
export const inject = ['slots', 'locale', 'configForms', 'theme', 'modelDirectories']

const LOCALE = 'imChatAppearance'

/**
 * Register the settings row, style runtime, and native-Chat decorator.
 * @param ctx - browser plugin context.
 */
export function apply(ctx: Context): void {
  installComponentStyles(ctx)
  ctx.effect(() => ctx.locale.register(LOCALE, { zh, en, ja, es, fr, de, ru, pt }),
    'im-chat-appearance: copy')
  const form = ctx.configForms.get<ChatAppearanceSettings>(CHAT_APPEARANCE_NAMESPACE)
  const preference = new ChatAppearancePreference(form)
  const theme = {
    getSnapshot: () => ctx.theme.getTheme(),
    subscribe: (listener: () => void) => ctx.on('theme/change', () => { listener() }),
  }

  const settingsFace = (): ChatAppearanceRowInjected => ({
    hooks: { appearance: form, mutation: preference.state },
    setStyle: style => preference.setStyle(style),
    setAccent: accent => preference.setAccent(accent),
    setShowNames: show => preference.setShowNames(show),
    setCollapseLong: collapse => preference.setCollapseLong(collapse),
    setSenderName: name => preference.setSenderName(name),
    setBackgroundPreset: preset => preference.setBackgroundPreset(preset),
    setCustomBackground: id => preference.setCustomBackground(id),
    reset: () => preference.reset(),
  })

  ctx.effect(() => ctx.configForms.whileServed([CHAT_APPEARANCE_NAMESPACE], () =>
    ctx.slots.inject('settings.general.item', () => ctx.slots.register({
      name: 'settings.general.item',
      id: CHAT_APPEARANCE_NAMESPACE,
      order: 13,
      locale: LOCALE,
      inject: settingsFace,
    }, ChatAppearanceRow))), 'im-chat-appearance: settings row')

  ctx.effect(() => ctx.configForms.whileServed([CHAT_APPEARANCE_NAMESPACE], () => {
    const disposeRuntime = installChatAppearance(form, theme)
    const disposeDecorator = ctx.slots.inject('conversation.session.header.actions', () =>
      ctx.slots.register({
        name: 'conversation.session.header.actions',
        id: 'im-chat-appearance-decorator',
        order: 1000,
        locale: LOCALE,
        inject: (sessionId) => {
          const modelDirectory = ctx.modelDirectories.directoryFor(sessionId)
          return { hooks: { appearance: form, modelDirectory: modelDirectory.store } }
        },
      }, ChatAppearanceDecorator))
    return () => {
      disposeDecorator()
      disposeRuntime()
    }
  }), 'im-chat-appearance: chat decoration')
}
