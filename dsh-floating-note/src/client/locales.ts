/** Localized labels for the floating note surfaces. */
export const zh = {
  title: '便签',
  description: '在 dsh 窗口上方保留至多 5 个可编辑的小便签，每个便签的内容独立保存。',
  enabled: '显示悬浮便签',
  noteCount: '便签数量',
  create: '新建便签',
  count: '{value} / {max}',
  limit: '最多 {max} 个便签',
  noteTitle: '便签 {index}',
  close: '关闭便签',
  discard: '「{name}」中仍有内容，关闭后无法恢复。确定关闭吗？',
  fontSize: '文字大小',
  fontFamily: '字体',
  textColor: '文字颜色',
  opacity: '窗口透明度',
  fontSystem: '系统无衬线',
  fontInter: 'Inter',
  fontSourceSans: 'Source Sans 3',
  fontPlexMono: 'IBM Plex Mono',
  fontSerif: '衬线字体',
  drag: '拖动以移动便签',
  placeholder: '记录灵感、备忘或待办事项……',
  pixels: '{value} 像素',
  percent: '{value}%',
} as const

export const en = {
  title: 'Notes',
  description: 'Keep up to five small editable notes above the dsh window. Each note is saved on its own as you type.',
  enabled: 'Show floating notes',
  noteCount: 'Open notes',
  create: 'New note',
  count: '{value} / {max}',
  limit: 'Up to {max} notes',
  noteTitle: 'Note {index}',
  close: 'Close note',
  discard: '"{name}" still has text. Closing it discards that text. Close it?',
  fontSize: 'Text size',
  fontFamily: 'Font',
  textColor: 'Text color',
  opacity: 'Window opacity',
  fontSystem: 'System sans',
  fontInter: 'Inter',
  fontSourceSans: 'Source Sans 3',
  fontPlexMono: 'IBM Plex Mono',
  fontSerif: 'Serif',
  drag: 'Drag to move note',
  placeholder: 'Write a thought, reminder, or idea…',
  pixels: '{value} px',
  percent: '{value}%',
} satisfies Record<keyof typeof zh, string>

/** English fallback dictionaries for the remaining supported locales. */
export const ja = en
export const es = en
export const fr = en
export const de = en
export const ru = en
export const pt = en
