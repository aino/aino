export const path = /^\/careers\/apply$/

export default async function apply(app) {
  const destroyers = []
  return () => {
    for (const destroy of destroyers) {
      destroy()
    }
  }
}
