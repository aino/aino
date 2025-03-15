import state from '@/js/utils/state'

export const modes = ['image', 'text', 'pixel']

const defaultValue = {
  mode: 'image',
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

export const toggleMode = () => {
  console.log(store)
  store.assign({
    mode: modes[(modes.indexOf(store.value.mode) + 1) % modes.length],
  })
}

export default store
