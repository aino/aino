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

/**
 * Gets an element by its ID.
 * @param {string} id - The ID of the element to retrieve.
 * @returns {HTMLElement|null} The matching element, or `null` if not found.
 */
export function id(id) {
  return document.getElementById(id)
}

/**
 * Creates a new DOM element with optional attributes and appends it to a parent.
 * @param {string} tag - The tag name of the element to create.
 * @param {Object} [attributes] - Attributes to set on the element.
 * @param {HTMLElement} [parent] - The parent element to append the created element to.
 * @returns {HTMLElement} The created element.
 */
export function create(tag, attributes, parent) {
  const element = document.createElement(tag)
  if (attributes) {
    for (const key in attributes) {
      element.setAttribute(key, attributes[key])
    }
  }
  if (parent) {
    parent.appendChild(element)
  }
  return element
}

/**
 * Creates a DOM element from an HTML string and appends it to a parent.
 * @param {string} html - The HTML string to create the element from.
 * @param {HTMLElement} [parent] - The parent element to append the created element to.
 * @returns {ChildNode} The created element.
 */
export function createFromString(html, parent) {
  const template = document.createElement('template')
  template.innerHTML = html
  const element = template.content.firstChild
  if (parent) {
    parent.appendChild(element)
  }
  return element
}

/**
 * Gets the computed style property of an element.
 * @param {HTMLElement} element - The element to retrieve the style from.
 * @param {string} property - The CSS property to retrieve.
 * @returns {string} The value of the property.
 */
export function getStyle(element, property) {
  return getComputedStyle(element).getPropertyValue(property)
}

/**
 * Applies a set of inline styles to an element.
 * @param {HTMLElement} element - The element to style.
 * @param {Object} styles - An object containing CSS properties and values.
 */
export function style(element, styles) {
  for (const key in styles) {
    element.style[key] = styles[key].toString()
  }
}

/**
 * Gets the value of a CSS variable.
 * @param {string} variable - The name of the CSS variable (without the `--` prefix).
 * @returns {number} The numeric value of the CSS variable.
 */
export function getCssVariable(variable) {
  return parseFloat(getStyle(document.documentElement, `--${variable}`))
}

/**
 * Attaches a resize or orientation change listener to the window.
 * @param {Function} onResize - The callback function to run on resize.
 * @returns {Function} A function to remove the event listener.
 */
export function resize(onResize) {
  const resizeEvent = 'ontouchstart' in window ? 'orientationchange' : 'resize'
  addEventListener(resizeEvent, onResize)
  onResize()
  return () => {
    removeEventListener(resizeEvent, onResize)
  }
}

/**
 * IntersectionObserver instance to handle visibility and in-view state of elements.
 * Adds 'io-show' class when the element becomes visible and toggles 'io-inview' class.
 */
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
