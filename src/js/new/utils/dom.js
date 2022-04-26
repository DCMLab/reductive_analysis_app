/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
/**
 * Get an object matching DOMRect, but with own properties, making it iterable.
 *
 * This exists because the DOMRect object returned by
 * `getBoundingClientRect` isn’t iterable.
 *
 * @param {HTMLElement} element The HTML element that will be examinated.
 * @param {null | getDOMRectOptions} includedProps When not null: the list of returned DOMRect props.
 * @returns {IterableDOMRect}
 */
export const getDOMRect = (el, includedProps = null) => {
  const rect = {}
  const originalRect = el.getBoundingClientRect()

  for (const prop in originalRect) {
    if (!includedProps || includedProps.includes(prop)) {
      rect[prop] = originalRect[prop]
    }
  }

  return rect
}

/**
 * @typedef {['x' | 'y' | 'width' | 'height' | 'top' | 'right' | 'bottom' | 'left' ]} getDOMRectOptions
 */

/**
 * @typedef {Object} IterableDOMRect
 * @property {number} x - Distance from viewport left to element left
 * @property {number} y - Distance from viewport top to element top
 * @property {number} width - Element width
 * @property {number} height - Element height
 * @property {number} top - Distance from viewport top to element top
 * @property {number} right - Distance from viewport left to element right
 * @property {number} bottom - Distance from viewport top to element bottom
 * @property {number} left - Distance from viewport left to element left
 */

// https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
export class NodeType {
  static isElement = node => node.nodeType == 1
}

/**
 * Set element attributes in batch.
 *
 * @param {HTMLElement} el HTML element
 * @param {Object} attrs A pair of attributes
 */
export const setAttributes = (el, attrs) => {
  Object.entries(attrs).forEach(([name, value]) => {
    if (value == null) {
      return el.removeAttribute(name)
    }
    el.setAttribute(name, value)
  })
}
