/** Build the Host ESM entry and the self-contained DSH browser module factory. */
import { readFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { transform } from 'lightningcss'
import { defineConfig, type UserConfig } from 'tsdown'

const PACKAGE_ID = 'dsh-terminal-appearance'
const CLIENT_EXTERNALS = new Set([
  'react',
  'react/jsx-runtime',
  'react-dom',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-slots',
])
const CSS_VIRTUAL_PREFIX = '\0terminal-appearance-css:'
const CSS_TEXT_VIRTUAL_PREFIX = '\0terminal-appearance-css-text:'
const CSS_VIRTUAL_SUFFIX = '.mjs'
const CSS_INLINE_QUERY = '?inline'

/** A browser bundle whose `meta()` carries the compiled CSS Modules text. */
function clientConfig(): UserConfig {
  const styles = new Map<string, string>()
  return {
    name: PACKAGE_ID,
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    target: 'es2024',
    dts: false,
    sourcemap: true,
    clean: false,
    minify: false,
    deps: {
      neverBundle: (specifier: string) => CLIENT_EXTERNALS.has(specifier),
      alwaysBundle: (specifier: string) => !CLIENT_EXTERNALS.has(specifier),
    },
    plugins: [{
      name: 'terminal-appearance-css-modules',
      enforce: 'pre',
      resolveId(source: string, importer: string | undefined) {
        const inline = source.endsWith(`.module.css${CSS_INLINE_QUERY}`)
        if (!inline && !source.endsWith('.module.css')) return null
        const clean = inline ? source.slice(0, -CSS_INLINE_QUERY.length) : source
        const file = importer === undefined
          ? resolve(import.meta.dirname, clean)
          : resolve(dirname(importer), clean)
        return (inline ? CSS_TEXT_VIRTUAL_PREFIX : CSS_VIRTUAL_PREFIX) + file + CSS_VIRTUAL_SUFFIX
      },
      async load(id: string) {
        const inline = id.startsWith(CSS_TEXT_VIRTUAL_PREFIX)
        if (!inline && !id.startsWith(CSS_VIRTUAL_PREFIX)) return null
        const prefix = inline ? CSS_TEXT_VIRTUAL_PREFIX : CSS_VIRTUAL_PREFIX
        const file = id.slice(prefix.length, -CSS_VIRTUAL_SUFFIX.length)
        this.addWatchFile(file)
        const source = await readFile(file)
        const output = transform({
          filename: file,
          code: source,
          cssModules: { pattern: '[hash]_[local]' },
          minify: true,
        })
        if (inline) return `export default ${JSON.stringify(output.code.toString())};`
        const classMap = Object.fromEntries(
          Object.entries(output.exports ?? {}).map(([local, value]) => [local, value.name]),
        )
        const path = relative(import.meta.dirname, file).split('\\').join('/')
        styles.set(path, output.code.toString())
        return {
          code: `export default ${JSON.stringify(classMap)};`,
          moduleSideEffects: 'no-treeshake',
        }
      },
    }],
    outputOptions: {
      entryFileNames: 'client.js',
      chunkFileNames: 'client.[name].js',
      sourcemapExcludeSources: false,
      intro: 'var module = { exports: {} }; var exports = module.exports;',
      banner: () => `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_ID)}, factory: (require) => {`,
      footer: () => {
        const resources = [...styles.entries()].map(([path, css]) =>
          `${JSON.stringify(path)}: { text: () => ${JSON.stringify(css)} }`).join(',')
        return `return module.exports; }, meta: () => ({ stylesheets: {${resources}} }) });`
      },
    },
  }
}

export default defineConfig([
  {
    name: `${PACKAGE_ID}/host`,
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    format: 'esm',
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    sourcemap: true,
    clean: false,
    deps: {
      neverBundle: ['@deepseek-ai/cordis'],
      alwaysBundle: (specifier: string) => specifier !== '@deepseek-ai/cordis',
    },
  },
  clientConfig(),
])
