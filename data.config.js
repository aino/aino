import { readFileSync } from 'fs'
import work from './data/work.js'

export const locales = ['en', 'sv']

export const globalData = async () => {
  return {
    work,
  }
}

export const routes = {
  '/': {
    data: async ({ lang }) => {
      return {
        title: `Hello White!`,
      }
    },
  },
  '/work/[slug]': {
    slugs: () => work.map((w) => w.slug).filter(Boolean),
    data: async ({ lang, slug }) => {
      let data = null
      try {
        data = JSON.parse(readFileSync(`data/work/${slug}.json`, 'utf-8'))
      } catch (error) {
        console.error(`Failed to load file: work/${slug}.json`)
      }
      return {
        data,
        slug,
      }
    },
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
