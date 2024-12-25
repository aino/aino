# White

## Why

- **Reactive frameworks** are great for reactive UI but often add unnecessary **bloat and boilerplate** for websites that don’t need it.
- Most websites rely on **URLs, navigation, and lightweight HTML**. Pages are not global states of data — only parts like forms, carts, or modals might need reactivity.
- **Native JavaScript and DOM APIs** are standardized, efficient, and often overlooked despite offering **better performance** with less code.
- React’s abstractions (e.g., states, events, and its event system) make it easy to forget how the **DOM really works**.
- By **separating markup from scripts**, developers are encouraged to think more carefully about the HTML, leading to cleaner and more focused client-side JavaScript.
- Coding “the React way” can make you miss the **elegance and simplicity** already built into **native JavaScript** and the DOM.

## Get Started

1. Clone the repository.
2. Run `bun install` to install dependencies.
3. Link your Vercel project using `bun vercel link`.
4. Pull environment variables with `bun vercel env pull`.
5. Start the development server using `bun code` (instead of `dev`, to leverage Vercel features).

## General Concept

- **Vanilla JavaScript**: Keep it simple with plain JS.
- **Dynamic Slugs**: Create flexible URL structures.
- **Bundling**: Bundle modules, styles, and assets for optimized delivery.
- **Vercel Optimizations**: Use Vercel's image optimizations and edge API.
- **Fake SPA**: Achieve a Single Page Application feel with HTML injection.
- **On-Demand Preloading**: Preload pages and assets as needed.

## Structure

### Templates

We use [Handlebars](https://handlebarsjs.com/) for templates and partials. Pages are located in the `pages/` directory.

- Pages are rendered in the same structure as their placement in the directory.
- Dynamic pages are created using `[slug]/index.html` files.
- Always use `index.html` for pages, e.g., `work/index.html` instead of `work.html`.

Predefined pages take precedence over dynamic slugs. For example:

- `pages/work/one/index.html` is prioritized over `pages/work/[slug]/index.html`.

#### Example Directory Structure:

```plaintext
pages/
├── index.html          # Home page
├── about/
│   └── index.html      # About page
└── work/
    ├── index.html      # Work index page
    └── [slug]/
        └── index.html  # Dynamic work page
```

### Partials

Partials are reusable `.html` snippets placed in the `partials/` directory. They can be nested. Use them for components like headers, forms, etc.:

```hbs
<section>
  {{> signup }}
  {{> forms/contact }}
</section>
```

### Layouts

Partials can also serve as layouts. Example of a layout in `partials/layout.html`:

```hbs
<html>
  <body class={{bodyclass}}>
    {{> @partial-block }}
  </body>
</html>
```

Usage in a page (`pages/index.html`):

```hbs
{{#> layout bodyclass="home" }}
  <section>
    <h1>Home</h1>
  </section>
{{/layout}}
```

### HTML Structure

#### Fake SPA

Instead of making the entire site reactive, as in other frameworks, and keeping track of every DOM node (which adds unnecessary listeners and JavaScript execution), we use a "fake SPA" approach. This approach simply replaces the `#app` container during each page transition. All `<a>` links handle this behavior automatically.

When navigating, it fetches or prefetches the HTML content of the next page, extracts the `#app` container, and replaces the current container with an optional transition. It also updates the `meta` and `title` tags in the document's `<head>`.

To trigger a page navigation programmatically, use the native `window.pushState`.

#### Trailing Slashes

The site should be built and configured remotely without trailing slashes. For example, links should point to `/about/page`. However, during development, trailing slashes are added automatically due to limitations in Vite, which currently doesn't handle their removal properly.

#### #app

The `#app` node acts as the main container for each page. Anything outside `#app` (e.g., navigation and footer) remains static across the site.

```html
<html>
  <head></head>
  <body>
    <nav><a href="/">Home</a></nav>
    <div id="app">
      <h1>Hello world</h1>
    </div>
    <footer>(c) Aino</footer>
  </body>
</html>
```

When navigating, only the content inside `#app` is replaced. Titles and meta tags in the `<head>` are also updated. You can add custom transitions or transfer stateful components between pages in `main.js`.

#### The `key` Attribute

The `key` attribute allows elements to retain their state across navigations. This is particularly useful for components such as form fields or interactive widgets. Example:

```hbs
<p key='random'></p>
<button>Generate</button>
```

```javascript
import { q } from '@/js/utils/dom'
import state from '@/js/utils/state'

const randomString = () => Math.random().toString()

export default function () {
  const [node] = q('[key=random]')
  const button = node.nextElementSibling

  const random = state(randomString(), (n) => {
    node.innerText = n
  })

  button.addEventListener('click', () => {
    random.set(randomString())
  })
}
```

### Handlebars Helpers

#### `img`

Use `img` to dynamically generate `src` and `srcset` attributes based on images in the `public` folder:

```hbs
<img {{img 'about/about1.jpg'}} alt='About Aino' />
```

This generates (in production):

```html
<img
  src="/_vercel/image?<PARAMS>"
  width="1240"
  height="1240"
  srcset="/_vercel/image?<PARAMS> 160w, /_vercel/image?<PARAMS> 320w, [...]"
  alt="About Aino"
/>
```

In development we use `sharp` to mimic the same rescaling principle as on Vercel.

#### `json`

Use `json` to output stringified data in a template:

```javascript
// data.config.js
{
  '/home': {
    data: () => ({ message: 'Hello world' }),
  },
}
```

```hbs
<pre>{{json data}}</pre>
```

This generates:

```html
<pre>{ "message": "Hello world" }</pre>
```

---

## `data.config.js`

Pagedata, languages and global data is configured in `data.config.js`. Each page key should match its slug in the file structure, including a starting slash `/`. The global can be used to fetch global data that will be available in all templates.

Example configuration:

```javascript
export const locales = ['en']

export const global = ({ lang }) => {
  name: 'Aino'
}

export const pages = {
  '/': {
    data: async () => ({
      message: 'Hello world',
      title: 'Hello title',
    }),
  },
  '/work': {
    data: async() => ({
      cases: await fetch(`api/cases`)
    })
  }
  '/work/[slug]': {
    slugs: async() => ['nudie-jeans'],
    data: async ({ slug }) => {
      return {
        slug,
        case: await fetch(`api/case/${slug}`),
      }
    },
  },
}
```

Nested pages can use slashes in their keys:

```javascript
{
  '/about': {
    data: () => ({ title: 'About us' }),
  },
  '/about/contact': {
    data: () => ({ title: 'Contact us' }),
  },
}
```

---

## JavaScript

All client-side scripts are in the `js/` directory and can be imported using `import @/js/[...]`.

### main.js

The `js/main.js` file runs once on the initial load. It can export an async `pageTransition` function that can be used to to custom transitions between the `#app` elements.

### Pages

Each page can have its own script, matched by a `path` regex. The regex matches the pathname **without the trailing slash**.

Example page script (`js/pages/home.js`):

```javascript
import { createFromString } from '@/js/utils/dom'
import '@/styles/pages/home.css'

// Matches the home page only
export const path = /^\/$/

export default function home(app) {
  const hello = createFromString('<h1>Our work</h1>', app)

  const onResize = () => {
    hello.textContent = 'Resized'
  }

  addEventListener('resize', onResize)

  return () => {
    removeEventListener('resize', onResize)
  }
}
```

### Global Page Scripts

Global page scripts match all paths and run for every page load. They are ideal for global DOM manipulation:

```javascript
import q from '@/js/utils/q'

// Matches all pages
export const path = /.*/

export default function global(app) {
  q('.image', app).forEach((el) => {
    // Add logic here
  })

  return () => {
    destroyers.forEach((d) => d && d())
  }
}
```

### Partials

Similar to pages, partials are added to the `/js/partials/` directory. They can export a path if it should run only on specific pages. If left out, it will run on every page.

```javascript
import q from '@/js/utils/dom'

export default function random(app) {
  const node = q('[key=random]', app)
  if (node) {
    node.innerText = Math.random().toString()
  }
}
```

## State management

### Local states

Use the simple `state` util to manage simple states. The first argument is the default value and the second is the callback that is run on every change.

```javascript
import state from '@/js/utils/state'
import { q } from '•/js/utils/dom'

const [node] = q('.number')
const button = node.nextElementSibling
const number = state(0, (n) => {
  node.innerText = n
})
button.addEventListener('click', () => {
  number.set((n) => n + 1)
})
```

Besides the callback, you can add more subscribers to state changes and access the state values. You can also use `state.value` property to get the state.

```javascript
const number = state(0)

const unsubscribe = number.subscribe((newValue, oldValue) => {
  console.log('Number changed', newValue, oldValue)
})

button.addEventListener('click', () => {
  // set a new value
  numer.set(10)
  // access the value at any time
  console.log(number.value)
  // unsubscribes the event handler
  unsubscribe()
})
```

If the state is an object, you can use the `state.assign()` to merge with the existing state object:

```javascript
const settings = state(
  {
    mode: 'text',
    color: 'brown',
  },
  (newSettings) => {
    console.log('Settings updated', newSettings)
  }
)

button.addEventListener('click', () => {
  // this will only change the mode, not the color
  settings.assign({ mode: 'image' })
})
```

If the state is an array, you can use the array functions `push`, `splice`, `pop`, `shift` and `unshift`:

```javascript
const list = state([], (newList) => {
  console.log('List updated', list)
})

button.addEventListener('click', () => {
  list.push('a')
  list.splice(0, 1, 'b')
})
```

### Stores

Stores are persistant states that can be re-used across the site and are often created as objects. Here is an example that handles the `textMode` in a `site` store located at `js/stores/site.js`:

```javascript js/stores/site.js
import state from '@/js/utils/state'

const store = state({
  textMode: false,
})

export const toggleTextMode = () => {
  store.assign({ textMode: !store.value.textMode })
}

export default store
```

You can export your own functions to handle more complex state changes and side effects. Subscribing to store changes is the same as for states, because stores are simply imported states, except you need to unsubscribe when leaving the page:

```javascript
import site, { toggleTextMode } from '@/js/stores/site'
import { q } from '@/js/utils/dom'

export default function nav() {
  const [toggler] = q('#nav .toggler')

  const render = ({ textMode }) => {
    toggler.textContent = textMode ? 'Graphics mode' : 'Text mode'
  }

  // hydrates the value to the client
  render(site.value)

  // subscribe to future changes
  const unsubscribe = site.subscribe(render)

  toggler.addEventListener('click', toggleTextMode)

  return () => {
    unsubscribe()
  }
}
```

If you want to server-side render a default store value, import the store in `data.config.js` and pass as data:

```javascript data.config.js
import site from '@/js/stores/site'

export const locales = ['en']

export const global = () => ({ site })

export const pages = {
  '/home': {
    data: async () => {
      return {
        message: 'Hello world',
      }
    },
  },
}
```

And render in the partial:

```hbs
<h1>{{message}}</h1>
<button class='toggler'>{{site.textMode}}</button>
```

#### Persistance

You can add persistance to the store by using `localStorage` and side effects. Remember to check if it exists since this code can run in node as well:

```javascript
import state from '@/js/utils/state'

const supported = typeof localStorage !== 'undefined'

const defaultValue = {
  textMode: false,
  ...(supported ? JSON.parse(localStorage.getItem('site') || '{}') : {}),
}

const store = state(defaultValue)

store.subscribe((value) => {
  if (supported) {
    localStorage.setItem('site', JSON.stringify(value))
  }
})

export const toggleTextMode = () => {
  store.set({ textMode: !store.value.textMode })
}

export default store
```

## Reactive partials

For most use cases, it’s more efficient to manually manipulate the DOM when data changes. But sometimes the rendering can become increasingly complex, so it’s more convenient to re-use the same partial template for client-side rendering.

For these cases, you can import partials as functions using `import partials/<NAME>`. Use them to re-render partials where data has changed in a local state or store. You can use the `update` function to update the DOM with new HTML to update only the affected nodes. Note that this is a much simpler version than the virtual DOM. If you are having a lot of complex UI states, consider adding React instead.

Note that importing partials will also import the handlebars runtime, so it will add around 10kb gzip to the bundle. You can use dynamic imports for force code splitting for smaller bundles:

```javascript
import { q, update } from '@/js/utils/dom'
import state from '@/js/utils/state'

export default async function global(app) {
  const { default: cartTemplate } = await import('partials/cart')
  const [cart] = q('.cart', app)
  const [add] = q('button', app)
  const items = state([], (items) => {
    update(cart, cartTemplate({ items }))
  })
  add.addEventListener('click', (e) => {
    e.preventDefault()
    // add a new item
    items.push({
      title: 'New Item',
      description: 'New Item description',
    })
  })
}
```

### Passing data from the server

If the reactive partial has rendered data on server that you want to hydrate on the client, you can use the `data` handlebars helper:

```hbs
<div class='cart' {{data items}}>
  <ul>
    {{#each items}}
      <li>
        <h3>{{this.title}}</h3>
        <p>{{description}}</p>
      </li>
    {{/each}}
  </ul>
  <button name='add'>Add item</button>
</div>
```

Now the data can be retrieved as default state value using `getRenderedData()`:

```javascript
import cartTemplate from '@partials/cart'
import { q, update, getRenderedData } from '@/js/utils/dom'

const [cart] = q('.cart', app)
const defaultValue = getRenderedData(cart)
const items = state(defaultValue, (items) => {
  update(cart, cartTemplate({ items }))
})
```

### Click handlers inside reactive partials

When you re-render a partial with template markup, any click handlers attached to DOM nodes inside the partial will be lost. So you need to either re-listen to event handlers on each render or simply put the click event on the partial container and catch the bubbling phase, f.ex:

```handlebars
<div id='cart'>
  <button name='remove'>Remove item</button>
  <button name='add'>Add item</button>
  <ul>
    {{#each items}}
      <li>{{name}}</li>
    {{/each}}
  </ul>
</div>
```

```javascript
import { id, update } from '@/js/utils/dom'
import template from 'partials/cart'
import state from '@/js/utils/state'

export default async function cart() {
  const cart = id('cart')
  if (!cart) {
    return
  }
  const items = state([], (items) => update(cart, template({ items })))
  const onClick = async (e) => {
    const button = e.target.closest('button')
    if (!button) {
      return
    }
    if (button.name === 'remove') {
      items.shift()
    } else if (button.name === 'add') {
      items.push({ name: 'John Doe' })
    }
  }
  cart.addEventListener('click', onClick)
  return () => {
    cart.removeEventListener('click', onClick)
  }
}
```

## Query params and hash

When updating query params or hashes, the site is not reloaded or scrolled. Instead you can listen to the changes and do f.ex filtering or manual scrolls using the native `hashchange` event or the custom `searchparamschange` event on the `window` object:

```javascript
export default async function home(app) {
  const onSearchParamsChange = (event) => {
    // event detail contains the new and old params
    console.log('search params changed', event.detail)
  }
  addEventListener('searchparamschange', onSearchParamsChange)
  return () => {
    removeEventListener('searchparamschange', onSearchParamsChange)
  }
}
```

## Internationalization

White supports multiple locales by exporting `locales` from `data.config.js`:

```javascript
export const locales = ['en', 'sv']
```

The first locale in the array will be the default, and no URL prefix will be added for it. For all other locales, pages will be built with the locale added as a path prefix. Additionally, all HTML content will be parsed for `<a href="">` tags, and the correct locale prefix will be automatically applied.

A global `{{lang}}` variable is also exposed to Handlebars, enabling you to set the `lang` attribute on the HTML element:

```hbs
<html lang="{{lang}}">
```

The `lang` variable is also available as a property in the `data()` function within `data.config.js`:

```javascript
export const locales = ['en', 'sv']

export const pages = [
  '/': {
    data: ({ lang }) => {
      const localized = {
        en: 'Hello',
        sv: 'Hej'
      }
      return {
        title: localized[lang]
      }
    }
  }
]
```

## API functions

Because we are hosting on vercel, you can use the same `api` functions as in Next.js and they are located in the `/api/` directory. If you start the dev server using `bun code` it will start a local vercel dev server where you can use the APIs locally.
