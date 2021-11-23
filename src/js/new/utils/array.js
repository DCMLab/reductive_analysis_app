/**
 * Check if all values of an array (needles) are in another one (haystack).
 * Returns false if one of the parameters is not an array.
 *
 * @param {*} haystack The array with a greater or equal number of elements.
 * @param {*} needles The array with a smaller or equal number of elements.
 * @returns {boolean}
 */
export const arrayIncludesAll = (haystack, needles) => needles?.every(needle => haystack?.includes(needle)) ?? false

/**
 * Compare two arrays by looking at their length and primitives.
 * Returns false if one of the parameters is not an array.
 *
 * @param {*} a1 The array with a greater or equal number of elements.
 * @param {*} a2 The array with a smaller or equal number of elements.
 * @returns {boolean}
 */
export const sameArray = (a1, a2) => a1.length == a2.length && arrayIncludesAll(a1, a2)
