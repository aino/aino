import handlebarsPlugin from 'vite-plugin-handlebars'
import { resolve } from 'path'
import fullReload from 'vite-plugin-full-reload'
import { ViteMinifyPlugin } from 'vite-plugin-minify'
import eslint from 'vite-plugin-eslint'
import dynamicFilesPlugin from './dynamicFilesPlugin.js'
import virtualHtmlPlugin from './virtualHtmlPlugin.js'
import dynamicImageResizePlugin from './dynamicImagesPlugin.js'
import virtualPartialsPlugin from './virtualPartialsPlugin.js'
import virtualScriptsPlugin from './virtualScriptsPlugin.js'
import localizedHrefPlugin from './localizedHrefPlugin.js'
import { getPageContext } from './getPageContext.js'
import Handlebars from 'handlebars'
import handlebarsHelpers from './handlebarsHelpers.js'
import fs from 'fs'
import getDynamicRoutes from './getDynamicRoutes.js'
import vercelConfig from './vercelConfig.js'
import { prefetch } from '../data.config.js'
import { globSync } from 'glob'

export const PAGES_DIR = 'pages'
export const PARTIALS_DIR = 'partials'

export const getPath = (name) =>
  name === 'home' ? `index.html` : `${name}/index.html`

export default (async () => {
  await vercelConfig()
  const prefetched = prefetch ? await prefetch() : null
  const { input, dynamicPaths } = await getDynamicRoutes(prefetched)
  handlebarsHelpers(Handlebars)

  return {
    plugins: [
      /*
      viteCompression({
        algorithm: 'brotliCompress',
      }),
      */
      eslint({
        cache: false,
      }),
      handlebarsPlugin({
        debug: true,
        reloadOnPartialChange: true,
        partialDirectory: resolve(__dirname, '..', PARTIALS_DIR),
        async context(url) {
          const pageContext = await getPageContext(url, prefetched)
          return pageContext?.data || {}
        },
      }),
      virtualScriptsPlugin(),
      virtualPartialsPlugin(),
      fullReload([
        `${PAGES_DIR}/**/*index.html`,
        `${PARTIALS_DIR}/**/*.html`,
        `data/**/*.json`,
      ]),
      virtualHtmlPlugin(prefetched),
      dynamicImageResizePlugin(),
      dynamicFilesPlugin(dynamicPaths),
      localizedHrefPlugin(),
      ViteMinifyPlugin({}),
      {
        name: 'copy-404',
        enforce: 'post',
        writeBundle() {
          const source = resolve(__dirname, '..', 'dist/404/index.html')
          const destination = resolve(__dirname, '..', 'dist/404.html')

          if (fs.existsSync(source)) {
            fs.copyFileSync(source, destination)
            console.log('Copied 404/index.html to 404.html')
          } else {
            console.error('404/index.html not found.')
          }
        },
      },
    ],
    root: 'pages',
    resolve: {
      alias: {
        '@': resolve(__dirname, '..'),
      },
    },
    css: {
      transformer: 'lightningcss',
    },
    server: {
      proxy: {
        // '/api': 'http://localhost:3001', // Redirect API calls to your Express server
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    publicDir: '../public',
    build: {
      target: 'es2018',
      outDir: '../dist',
      emptyOutDir: true,
      minify: 'terser', // Use terser for smaller bundles
      terserOptions: {
        compress: {
          drop_console: true, // Remove console statements
          drop_debugger: true, // Remove debugger statements
        },
      },
      rollupOptions: {
        input,
        output: {
          chunkFileNames: 'assets/[hash].js',
          entryFileNames: 'assets/[hash].js',
          assetFileNames: 'assets/[hash][extname]',
        },
      },
    },
  }
})()
