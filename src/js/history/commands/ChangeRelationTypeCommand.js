/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/

import { Command } from '../Command'
import { getById, getRelationType, setRelationType } from '../meiUtils'
import {
  updateRelationType,
  updateRelationTree,
  deselectAll,
  restoreSelection,
  captureSelectionState
} from '../renderUtils'
import { toggle_selected } from '../../modules/UI/utils/misc'

/**
 * Command to change the type of one or more relations.
 *
 * This is the simplest command as it doesn't create or delete elements,
 * only modifies attributes.
 */
export class ChangeRelationTypeCommand extends Command {
  /**
   * @param {string[]} relationIds - Array of relation xml:id values
   * @param {string} newType - The new type to set
   */
  constructor(relationIds, newType) {
    super('change_relation_type', `Change relation type to ${newType}`)
    this.relationIds = relationIds
    this.newType = newType
    this.oldTypes = {} // Will store {id: oldType} mapping
    this.selectionState = null
  }

  canExecute(context) {
    // Verify all relations exist
    for (const id of this.relationIds) {
      const node = getById(context.mei, id)
      if (!node) {
        console.warn(`ChangeRelationTypeCommand: relation ${id} not found`)
        return false
      }
    }
    return this.relationIds.length > 0
  }

  execute(context) {
    const { mei, drawContexts } = context

    // Capture current selection for undo
    this.selectionState = captureSelectionState()

    // Store old types and update to new type
    for (const id of this.relationIds) {
      const node = getById(mei, id)
      if (node) {
        // Store the old type
        this.oldTypes[id] = getRelationType(node)

        // Update MEI
        setRelationType(node, this.newType)

        // Update SVG
        updateRelationType(drawContexts, id, this.newType)
      }
    }

    // Deselect after operation
    deselectAll(toggle_selected)

    updateRelationTree()
  }

  undo(context) {
    const { mei, drawContexts } = context

    // Deselect current selection
    deselectAll(toggle_selected)

    // Restore old types
    for (const id of this.relationIds) {
      const oldType = this.oldTypes[id]
      if (oldType !== undefined) {
        const node = getById(mei, id)
        if (node) {
          // Update MEI
          setRelationType(node, oldType)

          // Update SVG
          updateRelationType(drawContexts, id, oldType)
        }
      }
    }

    // Restore previous selection
    restoreSelection(this.selectionState, toggle_selected)

    updateRelationTree()
  }

  redo(context) {
    // Deselect and restore selection before re-executing
    deselectAll(toggle_selected)
    restoreSelection(this.selectionState, toggle_selected)

    this.execute(context)
  }
}
