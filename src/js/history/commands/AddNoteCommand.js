/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/

import { Command } from '../Command'
import { getById, serializeElement, deserializeElement } from '../meiUtils'
import {
  updateRelationTree,
  deselectAll,
  captureSelectionState
} from '../renderUtils'
import { toggle_selected, adjustAllLayersSvgDimensions } from '../../modules/UI/utils/misc'
import { random_id } from '../../utils/misc'

/**
 * Command to add a new note to the score.
 *
 * Adding a note is complex because:
 * - A new note may be added standalone
 * - A new note may be added to an existing chord
 * - Adding to an existing note may require converting it to a chord first
 *
 * This command can be used in two ways:
 * 1. Created and executed normally via HistoryManager.execute()
 * 2. Created after do_note() has already executed (for legacy integration)
 *    In this case, _executed is set to true and _addedElements contains the results
 *
 * On execute: creates note in MEI and SVG
 * On undo: removes note (and any chord wrapper that was created)
 */
export class AddNoteCommand extends Command {
  /**
   * @param {string} pname - Pitch name (a, b, c, d, e, f, g)
   * @param {number} oct - Octave number
   * @param {string} referenceNoteId - ID of the reference note (for positioning)
   * @param {string} [noteId] - Optional pre-generated note ID (for redo)
   * @param {Element} [targetStaff] - Target staff element (for cross-staff notes)
   * @param {Element} [targetMeasure] - Target measure element
   */
  constructor(pname, oct, referenceNoteId, noteId = null, targetStaff = null, targetMeasure = null) {
    super('add_note', `Add note ${pname}${oct}`)
    this.pname = pname
    this.oct = oct
    this.referenceNoteId = referenceNoteId
    this.noteId = noteId || 'added-' + random_id(8)
    this.targetStaffId = targetStaff ? targetStaff.id : null
    this.targetMeasureId = targetMeasure ? targetMeasure.id : null

    // State captured during execution for undo
    this.createdChordId = null // If we created a chord wrapper
    this.svgElementIds = [] // IDs of created SVG elements
    this.selectionState = null

    // Stored coordinates for redo (to place note at same position)
    this.storedX = null
    this.storedY = null

    // For integration with do_note() which executes before creating the command
    this._executed = false
    this._addedElements = null
  }

  canExecute(context) {
    // Verify we have valid pitch info and reference note
    if (!this.pname || this.oct === undefined || this.oct === null) {
      return false
    }
    return true
  }

  execute(context) {
    // If already executed (via do_note integration), just capture state
    // This is the normal case - do_note in coordinates.js executes the action
    // and then creates this command to track it for undo
    if (this._executed && this._addedElements) {
      this.selectionState = captureSelectionState()
      this.svgElementIds = [this.noteId]

      // Capture coordinates from the created SVG element for redo
      const svgElem = document.getElementById(this.noteId)
      if (svgElem && svgElem.dataset) {
        this.storedX = svgElem.dataset.noteX ? parseFloat(svgElem.dataset.noteX) : null
        this.storedY = svgElem.dataset.noteY ? parseFloat(svgElem.dataset.noteY) : null
        console.debug('AddNoteCommand: captured coordinates', { storedX: this.storedX, storedY: this.storedY, noteId: this.noteId })
      } else {
        console.debug('AddNoteCommand: could not capture coordinates', { svgElem, noteId: this.noteId })
      }

      // Check if a chord was created
      const { mei } = context
      const meiNote = getById(mei, this.noteId)
      if (meiNote && meiNote.parentElement && meiNote.parentElement.tagName === 'chord') {
        this.createdChordId = meiNote.parentElement.getAttribute('xml:id')
      }
      return
    }

    // For redo, we need to re-execute the note creation
    // We use dynamic import to avoid circular dependency issues
    const { mei, meiGraph, drawContexts } = context
    const drawContext = drawContexts.find(dc => dc.canEdit)

    // Capture current selection for undo
    this.selectionState = captureSelectionState()

    // Get target staff and measure elements if IDs were provided
    const targetStaff = this.targetStaffId ? document.getElementById(this.targetStaffId) : null
    const targetMeasure = this.targetMeasureId ? document.getElementById(this.targetMeasureId) : null

    // Get the reference note element
    const referenceNote = document.getElementById(this.referenceNoteId)
    if (!referenceNote) {
      console.warn('AddNoteCommand: reference note not found')
      return
    }

    // For redo, we need to call do_note
    // Since this creates a circular dependency, we access it via a callback stored on the command
    console.debug('AddNoteCommand redo: using stored coordinates', { storedX: this.storedX, storedY: this.storedY })
    if (this._doNoteCallback) {
      this._doNoteCallback(
        this.pname,
        this.oct,
        referenceNote,
        true, // offset (simultaneous)
        this.noteId,
        true, // redoing = true to skip adding to old undo system
        targetStaff,
        targetMeasure,
        this.storedX, // Use stored coordinates for correct positioning
        this.storedY
      )
    } else {
      console.error('AddNoteCommand: _doNoteCallback not set, cannot redo')
      return
    }

    // Track the created SVG element
    const svgNote = document.getElementById(this.noteId)
    if (svgNote) {
      this.svgElementIds = [this.noteId]
    }

    // Check if a chord was created (by looking at the MEI)
    const meiNote = getById(mei, this.noteId)
    if (meiNote && meiNote.parentElement && meiNote.parentElement.tagName === 'chord') {
      const chord = meiNote.parentElement
      const chordId = chord.getAttribute('xml:id')
      if (chordId) {
        this.createdChordId = chordId
      }
    }

    adjustAllLayersSvgDimensions()
    updateRelationTree()
  }

  undo(context) {
    const { mei, meiGraph, drawContexts } = context

    // Deselect current selection
    deselectAll(toggle_selected)

    // Remove SVG elements - use stored element references if available
    // _addedElements structure from do_note:
    //   _addedElements[0] = result of draw_note() = array with SVG group element
    //   _addedElements[1] = result of add_note() = array with MEI elements
    if (this._addedElements && Array.isArray(this._addedElements)) {
      // First remove SVG elements (index 0)
      const svgElements = this._addedElements[0]
      if (Array.isArray(svgElements)) {
        for (const elem of svgElements) {
          if (elem && elem.parentElement) {
            elem.parentElement.removeChild(elem)
          }
        }
      }
    } else {
      // Fallback: try to find by ID
      const svgElem = document.getElementById(this.noteId)
      if (svgElem && svgElem.parentElement) {
        svgElem.parentElement.removeChild(svgElem)
      }
    }

    // Remove MEI note element
    const meiNote = getById(mei, this.noteId)
    if (meiNote) {
      const parent = meiNote.parentElement

      // If the note is in a chord
      if (parent && parent.tagName === 'chord') {
        // Remove the note from the chord
        meiNote.remove()

        // If this leaves only one note in the chord, unwrap it
        const remainingNotes = parent.querySelectorAll('note')
        if (remainingNotes.length === 1) {
          const lastNote = remainingNotes[0]
          const grandparent = parent.parentElement
          if (grandparent) {
            grandparent.insertBefore(lastNote, parent)
            parent.remove()
          }
        } else if (remainingNotes.length === 0) {
          // Empty chord - remove it
          parent.remove()
        }
      } else {
        // Standalone note - just remove it
        meiNote.remove()
      }
    }

    adjustAllLayersSvgDimensions()
    updateRelationTree()
  }

  redo(context) {
    // Reset executed flag so execute() actually runs
    this._executed = false
    this._addedElements = null
    this.execute(context)
  }
}
