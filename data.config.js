import { config } from 'dotenv'
config()
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export const locales = ['en']

export const prefetch = async () => {
  const work = await sql`SELECT * FROM work ORDER BY "order" DESC`
  const positions = await sql`SELECT * FROM positions ORDER BY "order" DESC`
  return {
    positions,
    work,
  }
}

export const globalData = async (prefetched) => {
  return {
    work: prefetched.work.map(({ slug, data }) => ({ ...data, slug })),
    positions: prefetched.positions.map(({ slug, data }) => ({
      ...data,
      slug,
    })),
  }
}

export const routes = {
  '/': {
    data: async ({ lang }) => {
      return {
        path: '',
      }
    },
  },
  '/services': {
    data: async ({ lang }) => {
      const slug = 'services'
      const results = await sql`SELECT * FROM pages WHERE slug = ${slug}`
      const { data } = results[0]
      return {
        title: 'Our Services',
        data,
        slug,
        path: `/${slug}`,
      }
    },
  },
  '/about': {
    data: async ({ lang }) => {
      const slug = 'about'
      const results = await sql`SELECT * FROM pages WHERE slug = ${slug}`
      const { data } = results[0]
      return {
        title: 'About',
        data,
        slug,
        path: `/${slug}`,
      }
    },
  },
  '/careers': {
    data: async ({ prefetched }) => {
      const slug = 'careers'
      const results = await sql`SELECT * FROM pages WHERE slug = ${slug}`
      const { data } = results[0]
      return {
        data,
        slug,
        title: 'Careers',
        path: `/${slug}`,
      }
    },
  },
  '/careers/[slug]': {
    slugs: (prefetched) => prefetched.positions.map((p) => p.slug),
    data: async ({ slug, prefetched }) => {
      const results = await sql`SELECT * FROM positions WHERE slug = ${slug}`
      const { data } = results[0]
      return {
        data,
        slug,
        title: data?.title,
        path: `/careers/${slug}`,
      }
    },
  },
  '/work': {
    data: async ({ lang }) => {
      return {
        title: 'Our Work',
        slug: 'work',
        path: `/work`,
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
        path: `/work/${slug}`,
      }
    },
  },
  '/contact': {
    data: async ({ lang }) => {
      const slug = 'contact'
      const results = await sql`SELECT * FROM pages WHERE slug = ${slug}`
      const { data } = results[0]
      return {
        title: 'Contact',
        data,
        slug,
        path: `/${slug}`,
      }
    },
  },
}
