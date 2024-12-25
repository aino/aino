import state from '@/js/utils/state'

const defaultValue = {
  textMode: false,
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

export const toggleTextMode = () => {
  store.assign({ textMode: !store.value.textMode })
}

export default store
