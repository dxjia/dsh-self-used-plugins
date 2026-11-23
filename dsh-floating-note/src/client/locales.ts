/** Localized labels for the floating note surfaces. */
export const zh = {
  title: '便签',
  description: '在 dsh 窗口上方保留一个可编辑的小便签，输入内容会实时保存。',
  enabled: '显示悬浮便签',
  fontSize: '文字大小',
  fontFamily: '字体',
  textColor: '文字颜色',
  opacity: '窗口透明度',
  fontSystem: '系统无衬线',
  fontInter: 'Inter',
  fontSourceSans: 'Source Sans 3',
  fontPlexMono: 'IBM Plex Mono',
  fontSerif: '衬线字体',
  hide: '隐藏便签',
  drag: '拖动以移动便签',
  placeholder: '记录灵感、备忘或待办事项……',
  pixels: '{value} 像素',
  percent: '{value}%',
} as const

export const en = {
  title: 'Notes',
  description: 'Keep a small editable note above the dsh window. Changes are saved as you type.',
  enabled: 'Show floating note',
  fontSize: 'Text size',
  fontFamily: 'Font',
  textColor: 'Text color',
  opacity: 'Window opacity',
  fontSystem: 'System sans',
  fontInter: 'Inter',
  fontSourceSans: 'Source Sans 3',
  fontPlexMono: 'IBM Plex Mono',
  fontSerif: 'Serif',
  hide: 'Hide note',
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
