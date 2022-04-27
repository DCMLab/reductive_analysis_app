/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
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
