/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import { doc } from '../utils/document'

const DEFAULT_DEBOUNCE_DELAY = 100

let resizeTimer = null

export default function debounceResize(callback, delay = DEFAULT_DEBOUNCE_DELAY) {
  clearTimeout(resizeTimer)
  doc.classList.add('resizing')

  resizeTimer = setTimeout(() => {
    doc.classList.remove('resizing')
    callback()
  }, delay)
}
