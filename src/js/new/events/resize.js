import { doc } from '../utils/document'

const DEFAULT_DEBOUNCE_DELAY = 100

let resizeTimer = null

export default function debounceResize(callback, delay = DEFAULT_DEBOUNCE_DELAY) {
  clearTimeout(resizeTimer)
  doc.classList.add('resizing')

  resizeTimer = setTimeout(() => {
    doc.classList.remove('resizing')
    callback()
  }, delay)
}
