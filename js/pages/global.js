import pixelate from '@/js/pixelate'
import { q } from '@/js/utils/dom'

export const path = /.*/

export default function global(app) {
  for (const img of q('.image img')) {
    console.log('Pixelating', img)
    const draw = pixelate(img)
    draw()
  }
  console.log('Global')
}
