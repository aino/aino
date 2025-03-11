import { create, getCssVariable, q, resize } from '../utils/dom'

export const path = /^\/careers\/apply$/

export default async function apply(app) {
  const destroyers = []
  const params = new URLSearchParams(location.search)
  const [steps] = q('.steps', app)
  steps.dataset.step = parseInt(params.get('step')) || 1
  const next = create(
    'button',
    {
      class: 'next',
      textContent: 'Next',
    },
    steps.parentElement
  )

  next.addEventListener('click', () => {
    history.pushState(
      {},
      '',
      `/careers/apply?step=${parseInt(steps.dataset.step) + 1}`
    )
    console.log('next clicked')
  })

  const onSearchParamsChange = (event) => {
    steps.dataset.step = parseInt(event.detail.params.step) || 1
  }

  addEventListener('searchparamschange', onSearchParamsChange)
  destroyers.push(() => {
    removeEventListener('searchparamschange', onSearchParamsChange)
  })
  return () => {
    for (const destroy of destroyers) {
      destroy()
    }
  }
}
