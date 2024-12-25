import fs from 'fs-extra'
import { join, resolve } from 'path'
import Handlebars from 'handlebars'
import { PARTIALS_DIR } from './index'

/**
 *
 * @returns {import('vite').Plugin}
 * @description Precompile Handlebars partials and make them available as virtual modules
 */
export default function virtualPartialsPlugin() {
  const virtualPartialPrefix = `${PARTIALS_DIR}/`
  const partialsDirPath = resolve(__dirname, '..', PARTIALS_DIR)

  return {
    name: 'virtual-partials-plugin',
    resolveId(id) {
      if (id.startsWith(virtualPartialPrefix)) {
        return id // Mark this ID as handled by this plugin
      }
    },
    async load(id) {
      if (id.startsWith(virtualPartialPrefix)) {
        // Resolve the relative path of the file within PARTIALS_DIR
        const relativePath = id.replace(virtualPartialPrefix, '')
        const filePath = join(partialsDirPath, `${relativePath}.html`) // Use PARTIALS_DIR to construct the file path

        if (!(await fs.pathExists(filePath))) {
          throw new Error(`Partial not found: ${filePath}`)
        }

        // Read and precompile the Handlebars template
        const content = await fs.readFile(filePath, 'utf-8')
        const precompiled = Handlebars.precompile(content)

        // Wrap with an import statement for the Handlebars runtime
        const jsContent = `
          import Handlebars from '@/js/utils/handlebars.client.js';
          export default Handlebars.template(${precompiled});
        `
        return jsContent
      }
    },
    configureServer(server) {
      // Watch the entire partials directory for changes
      server.watcher.add(partialsDirPath)

      // Invalidate modules when files in the partials directory change
      server.watcher.on('change', (file) => {
        if (file.startsWith(partialsDirPath)) {
          const relativePath = file.replace(partialsDirPath + '/', '')
          const virtualId = `${virtualPartialPrefix}${relativePath}`.replace(
            /\.html$/,
            ''
          )

          // Invalidate the virtual module in the module graph
          const module = server.moduleGraph.getModuleById(virtualId)
          if (module) {
            server.moduleGraph.invalidateModule(module)
          } else {
            console.warn(`Module not found: ${virtualId}`)
          }
        }
      })
    },
  }
}
