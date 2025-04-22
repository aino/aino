import state from '@/js/utils/state'

export const modes = ['image', 'text', 'pixel']
export const themes = {
  fantasy: [
    [29, 43, 83],
    [126, 37, 83],
    [0, 135, 81],
    [171, 82, 54],
    [95, 87, 79],
    [194, 195, 199],
    [255, 241, 232],
    [255, 0, 77],
    [255, 163, 0],
    [255, 236, 39],
    [0, 228, 54],
    [41, 173, 255],
    [131, 118, 156],
    [255, 119, 168],
    [255, 204, 170],
  ],
  c64: [
    [136, 0, 0],
    [170, 255, 238],
    [204, 68, 204],
    [0, 204, 85],
    [0, 0, 170],
    [238, 238, 119],
    [221, 136, 85],
    [102, 68, 0],
    [255, 119, 119],
    [51, 51, 51],
    [119, 119, 119],
    [170, 255, 102],
    [0, 136, 255],
    [187, 187, 187],
  ],
  ansi: [
    [0, 128, 128], // Dark cyan
    [0, 192, 192], // Medium cyan
    [0, 255, 255], // Bright cyan (main text)
    [128, 255, 255], // Light cyan (highlight)
    [192, 255, 255],
  ],
  nes: [
    [124, 124, 124],
    [0, 0, 252],
    [0, 0, 188],
    [68, 40, 188],
    [148, 0, 132],
    [168, 0, 32],
    [168, 16, 0],
    [136, 20, 0],
    [80, 48, 0],
    [0, 120, 0],
    [0, 104, 0],
    [0, 88, 0],
    [0, 64, 88],
    [188, 188, 188],
  ],
  db16: [
    [68, 36, 52],
    [48, 52, 109],
    [78, 74, 78],
    [133, 76, 48],
    [52, 101, 36],
    [208, 70, 72],
    [117, 113, 97],
    [89, 125, 206],
    [210, 125, 44],
    [133, 149, 161],
    [109, 170, 44],
    [210, 170, 153],
    [109, 194, 202],
    [218, 212, 94],
    [222, 238, 214],
  ],
}

const themesKeys = Object.keys(themes)

const defaultValue = {
  session: null,
  mode: 'image',
  appearance: window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light',
  theme: themesKeys[0],
  ...(typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem('site') || '{}')
    : {}),
}

const store = state(defaultValue)

store.subscribe((value) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('site', JSON.stringify(value))
  }
})

fetch('/api/session').then((response) => {
  if (response.ok) {
    response.json().then((session) => {
      store.assign({ session })
    })
  } else {
    store.assign({ session: null })
  }
})

export const toggleMode = () => {
  store.assign({
    mode: modes[(modes.indexOf(store.value.mode) + 1) % modes.length],
  })
}

export default store
