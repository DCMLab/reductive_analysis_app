import { round } from './math'

/**
 * Amount of pixels to make 1 rem.
 *
 * It’s 10, assuming the use of the 62.5% base trick:
 * https://www.aleksandrhovhannisyan.com/blog/respecting-font-size-preferences-rems-62-5-percent/#setting-the-base-font-size-to-625percent
 */
const pxIn1Rem = 10

/**
 * Convert pixels to rem length (e.g. `165` become `16.5rem`).
 *
 * @param {number} unitlessPx
 * @param {number=} [precision=0]
 * @returns {string}
 */
export const pxToRem = (unitlessPx, precision = 1) =>
  `${round(unitlessPx / pxIn1Rem, precision)}rem`
