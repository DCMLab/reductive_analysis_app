/**
 * Detect browser support for addEventListener options by adding boolean
 * properties (`passive`, `capture`) to an object.
 *
 * Example object: `{ capture: true, passive: false }`.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
 */
function detectSupport(option) {
  let supported = false
  let options = Object.defineProperty({}, option, {
    get: () => {
      supported = true
    },
  })

  try {
    window.addEventListener('test', options, options)
    window.removeEventListener('test', options, options)
  } catch (err) {
    supported = false
  }

  return supported
}

/**
 * Creates an event listener options object with its 3 properties.
 */
const createEventListenerOptions = function({ capture = false, passive = true, once = false } = {}) {
  return support.capture ? { capture, passive, once } : capture
}

// Detect support.
const support = {
  passive: detectSupport('passive'),
  capture: detectSupport('capture'),
}

export default createEventListenerOptions
