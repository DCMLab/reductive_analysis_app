import createEventOptions from './utils/options'

/**
 * A bunch of event lister options objects. Default object:
 *
 * {
 *   capture: false,
 *   passive: true, // passive by default
 *   once: false
 * }
 */

export const passiveEvent = createEventOptions()
export const activeEvent = createEventOptions({ passive: false })
export const captureEvent = createEventOptions({
  capture: true,
  passive: false,
})

export const passiveOnceEvent = createEventOptions({ once: true })
export const captureOnceEvent = createEventOptions({
  capture: true,
  passive: false,
  once: true,
})
