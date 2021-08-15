/**
 * Make sure a number stays between boundaries.
 *
 * Examples:
 * - clamp(17, 3, 8)  // 8
 * - clamp(-3, 3, 8)  // 3
 * - clamp(5, 3, 8)   // 5
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const clamp = (val, min, max) => Math.max(min, Math.min(max, val))

/**
 * Round a number to provided precision.
 *
 * Examples:
 * - round(687.3456, 2)   // 687.35
 * - round(687.3456, 0)   // 687
 * - round(687.3456)      // 687
 * - round(687.3456, -1)  // 690
 *
 * @param {number} number
 * @param {integer=} precision
 */
export const round = (number, precision = 0) => {
  precision = 10 ** precision
  return Math.round(number * precision) / precision
}
