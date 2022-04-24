/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Mehra, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
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
