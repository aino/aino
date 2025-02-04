import { decompress } from './compress'

/**
 * Selects all elements matching a query selector.
 * @param {string} query - The CSS selector to query.
 * @param {ParentNode} [parent=document] - The parent element to search within. Defaults to `document`.
 * @returns {HTMLElement[]} Array of matching elements.
 */
export function q(query, parent) {
  return Array.from((parent || document).querySelectorAll(query))
}

export function id(id) {
  return document.getElementById(id)
}

export function create(tag, attributes, parent) {
  const element = document.createElement(tag)
  if (attributes) {
    for (const key in attributes) {
      if (key in element) {
        // If it's a property of the element, set it directly
        element[key] = attributes[key]
      } else {
        // Otherwise, set it as an attribute
        element.setAttribute(key, attributes[key])
      }
    }
  }
  if (parent) {
    parent.appendChild(element)
  }
  return element
}

export function createFromString(html, parent) {
  const template = document.createElement('template')
  template.innerHTML = html
  const element = template.content.children[0]
  if (parent) {
    parent.appendChild(element)
  }
  return element
}

export function getStyle(element, property) {
  return getComputedStyle(element).getPropertyValue(property)
}

export function style(element, styles) {
  for (const key in styles) {
    element.style[key] = styles[key].toString()
  }
}

export function getCssVariable(variable) {
  return parseFloat(getStyle(document.documentElement, `--${variable}`))
}

export function resize(onResize) {
  const resizeEvent = 'ontouchstart' in window ? 'orientationchange' : 'resize'
  addEventListener(resizeEvent, onResize)
  onResize()
  return () => {
    removeEventListener(resizeEvent, onResize)
  }
}

export const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !entry.target.classList.contains('io-show')) {
        entry.target.classList.add('io-show')
      }
      entry.target.classList.toggle('io-inview', entry.isIntersecting)
    })
  },
  {
    rootMargin: '0px',
    threshold: 1,
  }
)

export function getRenderData(node) {
  if (node?.dataset?.render) {
    return decompress(node.dataset.render)
  }
  return null
}

export function update(node, source) {
  if (!node || !source) return
  let newNode
  if (typeof source === 'string') {
    const dom = new DOMParser().parseFromString(source, 'text/html')
    newNode = dom.body.firstElementChild
  } else if (source instanceof Element) {
    newNode = source
  } else {
    throw new Error('Invalid source')
  }
  const fromNodes = Array.from(node.childNodes)
  const toNodes = Array.from(newNode.childNodes)
  for (let i = 0; i < toNodes.length; i++) {
    const toNode = toNodes[i]
    const fromNode = fromNodes[i]
    if (!fromNode) {
      node.appendChild(toNode.cloneNode(true))
    } else {
      syncNodes(fromNode, toNode)
    }
  }

  while (node.childNodes.length > toNodes.length) {
    node.removeChild(node.lastChild)
  }
}

function syncNodes(fromNode, toNode) {
  if (
    fromNode.nodeType !== toNode.nodeType ||
    fromNode.nodeName !== toNode.nodeName
  ) {
    fromNode.parentNode.replaceChild(toNode.cloneNode(true), fromNode)
  } else if (fromNode.nodeType === Node.TEXT_NODE) {
    if (fromNode.textContent !== toNode.textContent)
      fromNode.textContent = toNode.textContent
  } else {
    syncAttributes(fromNode, toNode)
    const fromChildren = Array.from(fromNode.childNodes)
    const toChildren = Array.from(toNode.childNodes)
    for (let i = 0; i < toChildren.length; i++) {
      if (fromChildren[i]) {
        syncNodes(fromChildren[i], toChildren[i])
      } else {
        fromNode.appendChild(toChildren[i].cloneNode(true))
      }
    }
    while (fromNode.childNodes.length > toChildren.length) {
      fromNode.removeChild(fromNode.lastChild)
    }
  }
}

function syncAttributes(fromNode, toNode) {
  const fromAttrs = fromNode.attributes
  const toAttrs = toNode.attributes

  for (const attr of fromAttrs) {
    if (!toNode.hasAttribute(attr.name)) fromNode.removeAttribute(attr.name)
  }

  for (const attr of toAttrs) {
    if (fromNode.getAttribute(attr.name) !== attr.value) {
      fromNode.setAttribute(attr.name, attr.value)
    }
  }
}
