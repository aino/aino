import { config } from 'dotenv'
config()
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export const locales = ['en']

export const prefetch = async () => {
  const work = await sql`SELECT * FROM work`
  return {
    work,
  }
}

let work = null

export const globalData = async (prefetched) => {
  return {
    work: prefetched.work.map(({ slug, data }) => ({ ...data, slug })),
  }
}

const positions = readJsonFilesSync('data/positions')

const workSlugs = []

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
    slugs: (prefetched) => {
      return prefetched.work.map((w) => w.slug)
    },
    data: async ({ lang, slug, prefetched }) => {
      const index = prefetched.work.findIndex((w) => w.slug === slug)
      const results = await sql`SELECT * FROM work WHERE slug = ${slug}`
      const { data } = results[0]
      const year = data?.year
      const name = data?.name
      return {
        data,
        slug,
        index,
        title: name,
        name,
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
