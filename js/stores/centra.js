import state from '@/js/utils/state'

const supported = typeof localStorage !== 'undefined'

const defaultValue = {
  selection: supported
    ? JSON.parse(localStorage.getItem('selection') || '{}')
    : {},
}

const centra = state(defaultValue)

centra.subscribe(({ selection }) => {
  if (supported) {
    localStorage.setItem('selection', JSON.stringify(selection))
  }
})

const baseURL = 'https://aino.centraqa.com/api/checkout-api'
const getToken = () => centra.value.selection?.token
const headers = () => ({
  headers: {
    'Api-Token': getToken(),
  },
})

export const refresh = async () => {
  const response = await fetch(`${baseURL}/selection`, headers())
  centra.assign({ selection: await response.json() })
}

export const addItem = async (item, quantity) => {
  const response = await fetch(`${baseURL}/items/${item}`, {
    method: 'POST',
    ...headers(),
    body: JSON.stringify({ quantity }),
  })
  centra.assign({ selection: await response.json() })
}

export const getItem = (item) => {
  return item
    ? centra.value.selection?.selection.items.find((i) => i.item === item)
    : undefined
}

export const updateItemQuantity = async ({ line, quantity }) => {
  const response = await fetch(
    `${baseURL}/lines/${line}/quantity/${quantity}`,
    {
      method: 'PUT',
      ...headers(),
    }
  )
  centra.assign({ selection: await response.json() })
}

refresh()

export default centra
