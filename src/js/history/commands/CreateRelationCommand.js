/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/

import { Command } from '../Command'
import { getById, findArcsForNode, serializeElement, deserializeElement } from '../meiUtils'
import {
  removeSvgRelation,
  renderRelation,
  updateRelationTree,
  deselectAll,
  restoreSelection,
  captureSelectionState
} from '../renderUtils'
import { toggle_selected } from '../../modules/UI/utils/misc'
import { add_relation } from '../../action/graph'
import { add_mei_node_for, get_id, get_raw_id, get_by_id as miscGetById } from '../../utils/misc'

/**
 * Command to create a new relation between notes.
 *
 * On execute: creates relation node, note nodes (if needed), and arcs in MEI, then renders SVG
 * On undo: removes all created elements from MEI and SVG
 */
export class CreateRelationCommand extends Command {
  /**
   * @param {string[]} primaryNoteIds - Array of primary note element IDs (from SVG)
   * @param {string[]} secondaryNoteIds - Array of secondary note element IDs (from SVG)
   * @param {string} type - The relation type
   * @param {string} [relationId] - Optional pre-generated relation ID (for redo)
   */
  constructor(primaryNoteIds, secondaryNoteIds, type, relationId = undefined) {
    super('create_relation', `Create ${type} relation`)
    this.primaryNoteIds = primaryNoteIds
    this.secondaryNoteIds = secondaryNoteIds
    this.type = type
    this.relationId = relationId // Will be set on first execute if undefined
    this.createdNoteNodeIds = [] // Track note nodes we created in the graph
    this.selectionState = null
  }

  canExecute(context) {
    // Need at least some notes selected
    return this.primaryNoteIds.length > 0 || this.secondaryNoteIds.length > 0
  }

  /**
   * Check if a note node already exists in the graph.
   * @private
   */
  _noteNodeExists(mei, meiGraph, svgNoteId) {
    // The note node ID is 'gn-' + the MEI note ID
    const svgElem = document.getElementById(svgNoteId)
    if (!svgElem) return false
    const rawId = get_raw_id(svgElem)
    const meiId = get_id(miscGetById(mei, rawId))
    return miscGetById(meiGraph.getRootNode(), 'gn-' + meiId) !== null
  }

  execute(context) {
    const { mei, meiGraph, drawContexts } = context
    const drawContext = drawContexts.find(dc => dc.canEdit)

    console.debug('CreateRelationCommand.execute:', {
      primaryNoteIds: this.primaryNoteIds,
      secondaryNoteIds: this.secondaryNoteIds,
      type: this.type,
      existingRelationId: this.relationId
    })

    // Capture current selection for undo
    this.selectionState = captureSelectionState()

    // Clear any previous created note node tracking (for re-execute/redo)
    this.createdNoteNodeIds = []

    // Add MEI nodes for all notes (if they don't already exist in the graph)
    const primaryNodes = []
    for (const noteId of this.primaryNoteIds) {
      const svgElem = document.getElementById(noteId)
      console.debug('  Looking up primary note:', noteId, '-> found:', !!svgElem)
      if (svgElem) {
        // Check if node exists BEFORE calling add_mei_node_for
        const existedBefore = this._noteNodeExists(mei, meiGraph, noteId)

        const noteNode = add_mei_node_for(meiGraph, svgElem)
        if (noteNode) {
          primaryNodes.push(noteNode)
          // Track if this was newly created
          if (!existedBefore) {
            this.createdNoteNodeIds.push(noteNode.getAttribute('xml:id'))
          }
        }
      }
    }

    const secondaryNodes = []
    for (const noteId of this.secondaryNoteIds) {
      const svgElem = document.getElementById(noteId)
      if (svgElem) {
        // Check if node exists BEFORE calling add_mei_node_for
        const existedBefore = this._noteNodeExists(mei, meiGraph, noteId)

        const noteNode = add_mei_node_for(meiGraph, svgElem)
        if (noteNode) {
          secondaryNodes.push(noteNode)
          // Track if this was newly created
          if (!existedBefore) {
            this.createdNoteNodeIds.push(noteNode.getAttribute('xml:id'))
          }
        }
      }
    }

    // Check we have nodes to work with
    if (primaryNodes.length === 0 && secondaryNodes.length === 0) {
      console.error('CreateRelationCommand: No note nodes found for IDs:', this.primaryNoteIds, this.secondaryNoteIds)
      return
    }

    // Create the relation
    const [relationId, meiElems] = add_relation(
      meiGraph,
      primaryNodes,
      secondaryNodes,
      this.type,
      this.relationId // Use existing ID if this is a redo
    )

    // Store the relation ID for undo/redo
    this.relationId = relationId

    if (!relationId) {
      console.error('CreateRelationCommand: add_relation did not return a valid ID')
      return
    }

    // Render the relation
    renderRelation(drawContext, meiGraph, relationId)

    // Deselect after operation
    deselectAll(toggle_selected)

    updateRelationTree()
  }

  undo(context) {
    const { mei, meiGraph, drawContexts } = context

    // Deselect current selection
    deselectAll(toggle_selected)

    if (this.relationId) {
      // Remove SVG elements
      removeSvgRelation(drawContexts, this.relationId)

      // Find arcs from this relation to note nodes BEFORE removing them
      const arcs = findArcsForNode(meiGraph, this.relationId)
      const noteNodeIds = arcs
        .filter(arc => arc.getAttribute('from') === '#' + this.relationId)
        .map(arc => arc.getAttribute('to')?.slice(1))
        .filter(Boolean)

      // Remove arcs from MEI
      arcs.forEach(arc => arc.remove())

      // Remove the relation node from MEI
      const relationNode = getById(mei, this.relationId)
      if (relationNode) {
        relationNode.remove()
      }

      // Remove note nodes that are now orphaned (no arcs reference them anymore)
      for (const noteNodeId of noteNodeIds) {
        const remainingArcs = findArcsForNode(meiGraph, noteNodeId)
        if (remainingArcs.length === 0) {
          const noteNode = getById(meiGraph.getRootNode(), noteNodeId)
          if (noteNode) {
            console.debug('CreateRelationCommand.undo: removing orphaned note node', noteNodeId)
            noteNode.remove()
          }
        }
      }
    }

    // Restore previous selection
    restoreSelection(this.selectionState, toggle_selected)

    updateRelationTree()
  }

  redo(context) {
    // For redo, we re-execute with the same relationId
    this.execute(context)
  }
}
