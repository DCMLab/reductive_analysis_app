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
 * @property {number} x - Element X coordinate
 * @property {number} y - Element Y coordinate
 * @property {number} width - Element width
 * @property {number} height - Element height
 * @property {number} top - Element width
 * @property {number} right - Element height
 * @property {number} bottom - Element width
 * @property {number} left - Element height
 */

// https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
export class NodeType {
  static isElement = node => node.nodeType == 1
}
