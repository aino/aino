import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import work from './data/work.js'

export const locales = ['en']

export const globalData = async () => {
  return {
    work,
  }
}

const positions = readJsonFilesSync('data/positions')

const workSlugs = work.map((w) => w.slug)

function readJsonFilesSync(directory) {
  return readdirSync(directory) // Get all file names in the directory
    .filter((file) => file.endsWith('.json')) // Keep only .json files
    .map((file) => {
      const filePath = join(directory, file)
      const fileContents = readFileSync(filePath, 'utf-8') // Read file
      return JSON.parse(fileContents)
    })
}

export const routes = {
  '/': {
    data: async ({ lang }) => {
      return {
        title: `Aino`,
      }
    },
  },
  '/careers': {
    data: async ({ lang }) => {
      return {
        positions,
      }
    },
  },
  '/careers/[slug]': {
    slugs: () => positions.map((p) => p.slug),
    data: async ({ slug }) => {
      const position = positions.find((p) => p.slug === slug)
      return {
        position,
      }
    },
  },
  '/work': {
    data: async ({ lang }) => {
      return {
        title: 'Work',
      }
    },
  },
  '/work/[slug]': {
    slugs: () => {
      return workSlugs.filter(Boolean)
    },
    data: async ({ lang, slug }) => {
      let data = null
      const position = workSlugs.indexOf(slug) + 1
      const intro = work.find((w) => w.slug === slug)?.intro
      try {
        data = JSON.parse(readFileSync(`data/work/${slug}.json`, 'utf-8'))
      } catch (error) {
        console.error(`Failed to load file: work/${slug}.json`)
      }
      return {
        data,
        slug,
        position,
        intro,
        title: data?.name,
      }
    },
  },
  '/contact': {
    title: 'Contact',
  },
  '/about': {
    data: async ({ lang }) => {
      return {
        title: {
          en: 'About',
          sv: 'Om oss',
        }[lang],
      }
    },
  },
}
