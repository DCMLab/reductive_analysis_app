/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Mehra, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import createEventOptions from './utils/options'

/**
 * A bunch of event lister options objects. Default object:
 *
 * {
 *   capture: false,
 *   passive: true, // passive by default
 *   once: false
 * }
 */

export const passiveEvent = createEventOptions()
export const activeEvent = createEventOptions({ passive: false })
export const captureEvent = createEventOptions({
  capture: true,
  passive: false,
})

export const passiveOnceEvent = createEventOptions({ once: true })
export const captureOnceEvent = createEventOptions({
  capture: true,
  passive: false,
  once: true,
})
