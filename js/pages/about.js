import admin from '../admin/admin'

export const path = /^\/about$/

export default async function about(app) {
  const destroyers = []
  destroyers.push(await admin(app, 'pages'))
  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
