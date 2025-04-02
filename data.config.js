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
        positions,
        position,
        title: position?.title,
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
      const index = workSlugs.indexOf(slug)
      const entry = work.find((w) => w.slug === slug)
      const intro = entry?.intro
      const year = entry?.year
      try {
        data = JSON.parse(readFileSync(`data/work/${slug}.json`, 'utf-8'))
      } catch (error) {
        console.error(`Failed to load file: work/${slug}.json`)
      }
      return {
        data,
        slug,
        index,
        intro,
        title: data?.name,
        year,
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
