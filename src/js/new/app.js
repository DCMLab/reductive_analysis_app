/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Mehra, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
'use strict'

import { doc }    from './utils/document'
import initEvents from './events'
import player     from './modules/Player'
import ui         from './modules/UI'
import score      from './modules/Score'
import history    from './modules/History'
import viewport   from './modules/Viewport'

class App {
  constructor() {
    this.init()
  }

  init() {
    doc.classList.replace('loading', 'ready')

    this.viewport = viewport

    initEvents(this)

    // Modules below should be delayed to…

    // … when the first score is loaded…
    this.ui = ui
    this.score = score
    this.player = player

    // … and when a first action is done.
    this.history = history
  }
}

const app = new App()

export default app
