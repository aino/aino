import { q, create } from '../utils/dom'
import site from '@/js/stores/site'

export const path = /^\/login$/

export default function login(app) {
  const destroyers = []

  const render = (session) => {
    const [container] = q('.container', app)
    if (!session) {
      const form = create('form')
      form.action = '.'
      form.innerHTML = `<label><input type="password" name="password" placeholder="Password" autofocus /></label>`
      form.addEventListener('submit', async (event) => {
        event.preventDefault()
        const formData = new FormData(form)
        const data = Object.fromEntries(formData.entries())
        const response = await fetch('/api/login', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (response.ok) {
          const { session } = await response.json()
          site.assign({ session })
        } else {
          alert('Login failed')
        }
      })
      container.innerHTML = ''
      container.appendChild(form)
    } else {
      const logout = create('button', {
        innerHTML: 'Logout',
      })
      logout.addEventListener('click', async () => {
        const response = await fetch('/api/logout', {
          method: 'POST',
        })
        if (response.ok) {
          site.assign({ session: null })
        } else {
          alert('Logout failed')
        }
      })

      container.innerHTML = ''
      container.appendChild(logout)
    }
  }

  site.subscribe((newValue, oldValue) => {
    if (oldValue.session !== newValue.session) {
      render(newValue.session)
    }
  })
  render(site.value.session)
  return () => {
    destroyers.forEach((destroy) => destroy())
  }
}
