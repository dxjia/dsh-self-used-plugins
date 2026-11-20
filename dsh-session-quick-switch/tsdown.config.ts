/** Build the empty Host entry and the browser shortcut module. */
import { defineConfig, type UserConfig } from 'tsdown'

const PACKAGE_ID = 'dsh-session-quick-switch'
const CLIENT_EXTERNALS = new Set([
  'react',
  'react/jsx-runtime',
  'react-dom',
  '@deepseek-ai/cordis',
])

/** Browser module factory loaded by DSH Client Modules. */
function clientConfig(): UserConfig {
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
    outputOptions: {
      entryFileNames: 'client.js',
      chunkFileNames: 'client.[name].js',
      sourcemapExcludeSources: false,
      intro: 'var module = { exports: {} }; var exports = module.exports;',
      banner: () => `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_ID)}, factory: (require) => {`,
      footer: () => `return module.exports; }, meta: () => ({ stylesheets: {} }) });`,
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
