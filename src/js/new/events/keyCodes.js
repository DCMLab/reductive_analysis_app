/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import { arrayIncludesAll } from '../utils/array'

const keys = Object.freeze({
  shift: 16,
  control: 17,
  escape: 27,

  // arrows
  left: 37,
  right: 39,

  // characters
  a: 65,
  h: 72,
  s: 83,
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
    return !!keys.length // `true` if any modifier is pressed.
  }

  // Look for all specified modifiers.
  return arrayIncludesAll(keys, [modifiers].flat())
}

/**
 * Return pressed modifier keys.
 *
 * @param {KeyboardEvent}
 * @returns {string[]} modifier keys
 */
export function pressedModifiers({
  metaKey: meta,
  shiftKey: shift,
  ctrlKey: ctrl,
  altKey: alt,
}) {
  const modifiers = { meta, shift, ctrl, alt }

  return Object.keys(modifiers).filter(key => modifiers[key])
}

// The key for usual platform shortcuts (Cmd on macOS, Ctrl anywhere else).
export const shortcutMeta = /Macintosh/.test(navigator.userAgent) ? 'meta' : 'ctrl'
