/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import { getDrawContexts } from '../../../bootstrap'
import { applyStageNumbers, clearStageNumbers, resolve_in_context } from './reductions'

/**
 * Manages live generation-number display in edit mode.
 *
 * Listens for 'relation-modified' events (dispatched by updateRelationTree()
 * after every command execute/undo/redo) and, when the toggle is ON, debounces
 * a POST to /api/stages and overlays the returned stage numbers on the score.
 * Cycle detection mirrors the behaviour of reduction mode.
 */
export default class GenerationNumbers {
  constructor() {
    this.enabled = false
    this.debounceTimer = null
    this.abortController = null
    this.currentCycle = []

    document.addEventListener('relation-modified', () => this.onRelationModified())
  }

  onChange({ target }) {
    if (target.name !== 'gen-numbers') return
    if (target.value === 'on') {
      this.enabled = true
      this.refresh()
    } else {
      this.enabled = false
      const draw_context = getDrawContexts().find(e => e.canEdit)
      if (draw_context) {
        clearStageNumbers(draw_context)
        this._clearCycle(draw_context)
      }
    }
  }

  onRelationModified() {
    if (!this.enabled) return
    clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => this.refresh(), 300)
  }

  async refresh() {
    if (!window.mei) return
    if (this.abortController) this.abortController.abort()
    this.abortController = new AbortController()
    try {
      const response = await fetch('http://localhost:5100/api/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: new XMLSerializer().serializeToString(window.mei),
        signal: this.abortController.signal
      })
      const verdict = await response.json()

      // Bail out if the toggle was turned off or locked while the fetch was in flight
      const genOn = document.getElementById('gen-numbers-on')
      if (!this.enabled || genOn?.disabled) return

      const draw_context = getDrawContexts().find(e => e.canEdit)
      if (!draw_context) return

      // Clear previous state before applying new results
      clearStageNumbers(draw_context)
      this._clearCycle(draw_context)

      // Case 1: Valid reductive analysis
      if (
        Array.isArray(verdict) &&
        verdict.length === 2 &&
        Array.isArray(verdict[0]) &&
        Array.isArray(verdict[1])
      ) {
        const note_diffs = verdict[0].reverse()
        if (note_diffs.flat(1).length > 0) {
          applyStageNumbers(draw_context, note_diffs)
        }
      }

      // Case 2: Graph cycle — mirrors reduction mode behaviour
      if (
        Array.isArray(verdict) &&
        verdict.length === 2 &&
        typeof verdict[0] === 'string' &&
        verdict[0] === 'GraphCycleError' &&
        Array.isArray(verdict[1]) &&
        verdict[1].length > 0
      ) {
        const cycle = verdict[1]
        this.currentCycle = cycle
        document.getElementById('reduction-counter').innerText = '∞ Cycle found'
        document.getElementById('reduction-counter').classList.add('cycle')
        cycle.forEach(id => {
          const el = resolve_in_context(draw_context, id)
          const notehead = el?.querySelector('.notehead')
          if (notehead) {
            notehead.style.fill = 'red'
            notehead.classList.add('cycle')
          }
        })
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        this.showWarning()
      }
    }
  }

  _clearCycle(draw_context) {
    this.currentCycle.forEach(id => {
      const el = resolve_in_context(draw_context, id)
      const notehead = el?.querySelector('.notehead')
      if (notehead) {
        notehead.style.fill = ''
        notehead.classList.remove('cycle')
      }
    })
    if (this.currentCycle.length > 0) {
      const counter = document.getElementById('reduction-counter')
      counter.classList.remove('cycle')
      counter.innerText = ''
    }
    this.currentCycle = []
  }

  toggle() {
    this.enabled ? document.getElementById('gen-numbers-off').click() : document.getElementById('gen-numbers-on').click()
  }

  showWarning() {
    const counter = document.getElementById('reduction-counter')
    if (!counter) return
    const prev = counter.innerText
    counter.innerText = 'Generation numbers: server unavailable'
    setTimeout(() => { counter.innerText = prev }, 3000)
  }
}
