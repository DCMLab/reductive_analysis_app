/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Mehra, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
/**
 * Prevent an event and optionally run a callback.
 *
 * @param {Event} e Event.
 * @param {Function=} callback Function callback.
 * @returns {void}
 */
export function prevent(event, callback = null) {
  event.preventDefault()

  if (callback) {
    callback.call()
  }
}
