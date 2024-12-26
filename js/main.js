export async function pageTransition(oldApp, newApp) {
  oldApp.replaceWith(newApp)
  scrollTo(0, 0)
}

export default async function main() {}
