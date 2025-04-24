import admin from '../admin/admin'

export const path = /^\/careers\/?$/

export default async function careers(app) {
  const destroyers = []
  destroyers.push(await admin(app, 'pages'))
  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
