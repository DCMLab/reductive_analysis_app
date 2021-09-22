/**
 * Capitalize the first letter of a string
 *
 * Examples:
 * - capitalize('jean-roger')  // 'Jean-roger'
 * - capitalize('0 books')  // '0 books'
 *
 * @param {string} str
 * @returns {string}
*/
export const capitalize = str => str[0].toUpperCase() + str.slice(1)
