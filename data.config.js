import { readFileSync } from 'fs'
import work from './data/work.js'

export const locales = ['en']

export const globalData = async () => {
  return {
    work,
  }
}

const workSlugs = work.map((w) => w.slug)

export const routes = {
  '/': {
    data: async ({ lang }) => {
      return {
        title: `Aino`,
      }
    },
  },
  '/work/[slug]': {
    slugs: () => workSlugs.filter(Boolean),
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
  '/about/[slug]': {
    slugs: () => ['contact', 'team'],
    data: async ({ slug }) => {
      return {
        title: `About ${slug}`,
      }
    },
  },
}
