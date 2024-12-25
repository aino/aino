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
          columns: [
            {
              html: `<h2>${title}</h2><p>${year}</p>`,
            },
            {
              image: '/images/karpov.jpg',
              caption: 'Caption',
            },
            {
              image:
                'https://aino.agency/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fv21.c5cce366.jpg&w=3840&q=75',
            },
          ],
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
