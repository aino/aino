import { promises as fs } from 'fs'
import path from 'path'

export default function VirtualScriptsPlugin() {
  const virtualModuleId = 'white/scripts'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  // Define directories to scan
  const dirs = ['js/pages', 'js/partials']

  return {
    name: 'vite-plugin-virtual-scripts',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        let imports = ''
        let exports = []

        // Scan the specified directories
        for (const dir of dirs) {
          const absDir = path.resolve(dir) // Resolve absolute directory path
          const files = await fs.readdir(absDir)

          // Include only .js files
          for (const file of files) {
            if (file.endsWith('.js')) {
              const moduleName = path.basename(file, '.js') // Module name without extension
              const importPath = `${dir}/${file}` // Relative import path

              imports += `import * as ${moduleName} from '@/${importPath}'\n`
              exports.push(moduleName)
            }
          }
        }

        // Generate virtual module content
        const moduleContent = `
${imports}
export default [${exports.join(', ')}]
`
        return moduleContent
      }
    },
  }
}
