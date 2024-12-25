import scripts from 'white/scripts'
import { id, q } from '@/js/utils/dom'
import main, { pageTransition } from '@/js/main'

import '@/styles/main.css'
import { addTrailingSlash, removeTrailingSlash } from './utils/string'

export const cachedPages = new Map()

export const config = {
  fakeSPA: true,
}

const isDev = import.meta.env.DEV || location.hostname === 'localhost'

const fetchHtml = async (pathname) => {
  const response = await fetch(isDev ? addTrailingSlash(pathname) : pathname, {
    headers: {
      Accept: 'text/html',
    },
  })
  if (response.ok) {
    return await response.text()
  } else {
    throw new Error(response)
  }
}

const runScripts = (() => {
  const runners = scripts.map((m) => ({
    path: m.path || /.*/,
    fn: m.default,
  }))

  const destroyers = []

  return async (pathname, app) => {
    for (const destroy of destroyers) {
      typeof destroy === 'function' && destroy()
    }
    destroyers.length = 0
    for (const { fn } of runners.filter((p) =>
      p.path.test(removeTrailingSlash(pathname) || '/')
    )) {
      destroyers.push(await fn(app))
    }
  }
})()

const prefetchLink = (link) => {
  if (!cachedPages.has(link.pathname) && location.pathname !== link.pathname) {
    fetchHtml(link.pathname)
      .then((html) => {
        cachedPages.set(link.pathname, html)
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const images = doc.querySelectorAll('img')

        images.forEach((img) => {
          const tempImg = new Image()
          for (const attr of ['src', 'srcset', 'sizes']) {
            tempImg[attr] = img.getAttribute(attr) || ''
          }
        })
      })
      .catch(() => {
        console.warn(`Could not prefetch ${link.pathname}`)
      })
  }
}

const onLinkClick = (e) => {
  const { pathname, hostname, search, hash } = new URL(e.currentTarget.href)
  if (!history.pushState || hostname !== location.hostname) {
    return
  }
  const nextHref = `${
    isDev ? addTrailingSlash(pathname) : pathname
  }${search}${hash}`
  e.preventDefault()
  history.pushState(null, '', nextHref)
}

const onLinkHover = (e) => {
  prefetchLink(e.currentTarget)
}

const parseLinks = () => {
  for (const link of q('a')) {
    if (link.getAttribute('rel') === 'prefetch') {
      prefetchLink(link)
    }
    if (link.href) {
      link.removeEventListener('click', onLinkClick)
      link.removeEventListener('mouseover', onLinkHover)
      link.addEventListener('click', onLinkClick)
      link.addEventListener('mouseover', onLinkHover)
    }
  }
}

let prevHref = location.href

const fakeState = async (href, trigger) => {
  if (!config.fakeSPA || href === prevHref) {
    return
  }
  const { pathname, search, hash } = new URL(href)
  let prevPathname = '',
    prevSearch = '',
    prevHash = ''

  if (prevHref) {
    try {
      ;({
        pathname: prevPathname,
        search: prevSearch,
        hash: prevHash,
      } = new URL(prevHref))
    } catch (e) {
      console.warn(e)
    }
  }
  prevHref = href
  const baseApp = id('app')

  if (removeTrailingSlash(pathname) === removeTrailingSlash(prevPathname)) {
    if (search !== prevSearch) {
      const getParams = (p) =>
        Object.fromEntries(new URLSearchParams(p || '')) || {}

      const onSearchParamsChange = new CustomEvent('searchparamschange', {
        detail: {
          params: getParams(search),
          prevParams: getParams(prevSearch),
        },
      })
      dispatchEvent(onSearchParamsChange)
    }
    if (hash !== prevHash && trigger) {
      dispatchEvent(
        new HashChangeEvent('hashchange', {
          newURL: href,
          oldURL: prevHref,
        })
      )
    }
    return
  } else {
    let html = cachedPages.get(pathname)
    if (!html) {
      try {
        html = await fetchHtml(pathname)
        cachedPages.set(pathname, html)
      } catch (response) {
        console.log('404', response)
        location.href = pathname
        return
      }
    }
    const parser = new DOMParser()
    const fragment = parser.parseFromString(html, 'text/html')
    const app = fragment.querySelector('#app')

    // transfer key nodes
    for (const keyNode of baseApp.querySelectorAll('*[key]')) {
      const key = keyNode.getAttribute('key')
      const node = app.querySelector(`*[key="${key}"]`)
      if (node) {
        node.replaceWith(keyNode)
      }
    }
    const head = document.head
    const selector = 'head > meta, head > title'
    const bodyClass = fragment.querySelector('body').className
    document.body.className = bodyClass
    for (const node of q(selector)) {
      node.remove()
    }
    for (const transfer of fragment.querySelectorAll(selector)) {
      head.appendChild(transfer)
    }
    if (pageTransition) {
      await pageTransition(baseApp, app)
    } else {
      baseApp.replaceWith(app)
    }
    requestAnimationFrame(() => {
      parseLinks()
      runScripts(pathname, app)
    })
  }
}

if (config.fakeSPA) {
  addEventListener('popstate', () => fakeState(location.href))
  history.pushState = new Proxy(window.history.pushState, {
    apply: (target, thisArg, argArray) => {
      const nextUrl = new URL(argArray[2], location.origin).toString()
      fakeState(nextUrl, true)
      return target.apply(thisArg, argArray)
    },
  })
}

const white = () => {
  if (isDev && !location.pathname.endsWith('/')) {
    location.pathname += '/'
    return
  }
  cachedPages.set(location.pathname, document.documentElement.outerHTML)
  const app = id('app')

  runScripts(location.pathname, app)
  if (config.fakeSPA) {
    parseLinks()
  }

  main()
}

addEventListener('DOMContentLoaded', white)
