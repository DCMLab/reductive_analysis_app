import { arrayIncludesAll } from '../utils/array'

const keys = Object.freeze({
  control: 17,
  escape: 27,
  left: 37,
  right: 39,
  a: 65,
  x: 88,
  z: 90,
})

/**
 * Check if the specified key is pressed.
 */
export const isKey = ({ keyCode }, keyName) => keyCode === keys[keyName]

/**
 * Check if wanted modifier(s) are pressed.
 *
 * @param {string | string[]=} modifiers
 */
export function isModifier(keyboardEvent, modifiers = null) {
  const keys = pressedModifiers(keyboardEvent)

  // Not requesting a specific modifier.
  if (!modifiers) {
    return keys !== null // `true` if any modifier is pressed.
  }

  // Look for all specified modifiers.
  return arrayIncludesAll(keys, [modifiers].flat())
}

/**
 * Return pressed modifier keys, or null if none are pressed.
 *
 * @param {KeyboardEvent}
 */
export function pressedModifiers({
  metaKey: meta,
  shiftKey: shift,
  ctrlKey: ctrl,
  altKey: alt,
}) {
  const modifiers = { meta, shift, ctrl, alt }

  const keys = Object.keys(modifiers).filter(key => modifiers[key])

  return keys.length ? keys : null
}

// The key for usual platform shortcuts (Cmd on macOS, Ctrl anywhere else).
export const shortcutMeta = /Macintosh/.test(navigator.userAgent) ? 'meta' : 'ctrl'
