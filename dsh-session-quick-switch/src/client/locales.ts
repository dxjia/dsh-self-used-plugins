/** Copy owned by the recent-session shortcut command. */
import type {} from '@deepseek-ai/dsh-client-ui-slots'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    sessionQuickSwitch: keyof typeof zh
  }
}

export const zh = {
  command: '切换到下一个最近会话',
}

export const en = {
  command: 'Switch to the next recent session',
} satisfies Record<keyof typeof zh, string>

export const ja = {
  command: '次に最近のセッションへ切り替える',
} satisfies Record<keyof typeof zh, string>

export const es = {
  command: 'Cambiar a la siguiente sesión reciente',
} satisfies Record<keyof typeof zh, string>

export const fr = {
  command: 'Passer à la session récente suivante',
} satisfies Record<keyof typeof zh, string>

export const de = {
  command: 'Zur nächsten zuletzt geöffneten Sitzung wechseln',
} satisfies Record<keyof typeof zh, string>

export const ru = {
  command: 'Перейти к следующему недавнему сеансу',
} satisfies Record<keyof typeof zh, string>

export const pt = {
  command: 'Mudar para a próxima sessão recente',
} satisfies Record<keyof typeof zh, string>
