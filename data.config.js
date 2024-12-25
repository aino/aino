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
      const { name: title, year } = work.find((w) => w.slug === slug) || {}
      const sections = [
        {
          columns: [],
        },
      ]
      return {
        title,
        year,
        slug,
        sections,
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
