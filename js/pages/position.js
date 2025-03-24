export const path = /^\/careers\/[^/]+$/

export default async function position(app) {
  const destroyers = []

  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
