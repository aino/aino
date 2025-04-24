import admin from '../admin/admin'
import { q } from '@/js/utils/dom'

export const path = /^\/careers\/[^/]+$/

export default async function position(app) {
  const destroyers = []
  const [titleNode] = q('.data-title', app)
  const [subtitleNode] = q('.data-subtitle', app)
  const [sectionsNode] = q('.sections', app)
  const slug = sectionsNode.dataset.slug

  const render = () => {
    const [applyNode] = q('.apply', app)
    if (applyNode) {
      const html = `
        <div>
          <div>
            <br />
            <a class="button outline" href="/careers/apply">Apply for this position</a>
          </div>
          <br />
          <div>
            <h2>Share</h2>
            <br />
            <ul>
              <li>
                <a
                  data-preventclick="true"
                  data-message="→ Link copied"
                  href="/careers/${slug}"
                  class="copy"
                  >→ Copy link</a
                >
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/sharing/share-offsite/?url=https://aino.agency/careers/${slug}"
                  target="_blank"
                  >→ Share on LinkedIn</a
                >
              </li>
            </ul>
          </div></div>`
      applyNode.innerHTML = html
    }
  }

  destroyers.push(
    await admin(app, 'positions', (data) => {
      titleNode.textContent = data.title
      subtitleNode.textContent = data.subtitle
      render()
    })
  )
  render()
  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
