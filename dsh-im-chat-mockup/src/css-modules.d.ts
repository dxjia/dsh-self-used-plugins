declare module '*.module.css' {
  const classes: Readonly<Record<string, string | undefined>>
  export default classes
}

declare module '*.module.css?inline' {
  const css: string
  export default css
}
