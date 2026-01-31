/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/

import { Command } from '../Command'
import { getById, findArcsForNode } from '../meiUtils'
import {
  removeSvgRelation,
  renderMetarelation,
  updateRelationTree,
  deselectAll,
  restoreSelection,
  captureSelectionState
} from '../renderUtils'
import { toggle_selected, adjustAllLayersSvgDimensions } from '../../modules/UI/utils/misc'
import { add_metarelation } from '../../action/graph'
import { id_or_oldid } from '../../utils/misc'

/**
 * Command to create a new metarelation between relations.
 *
 * Metarelations connect existing relations (or other metarelations) together.
 *
 * On execute: creates metarelation node and arcs in MEI, then renders SVG
 * On undo: removes the metarelation elements from MEI and SVG
 */
export class CreateMetarelationCommand extends Command {
  /**
   * @param {string[]} primaryIds - Array of primary relation/metarelation xml:ids
   * @param {string[]} secondaryIds - Array of secondary relation/metarelation xml:ids
   * @param {string} type - The metarelation type
   * @param {string} [metarelationId] - Optional pre-generated metarelation ID (for redo)
   */
  constructor(primaryIds, secondaryIds, type, metarelationId = undefined) {
    super('create_metarelation', `Create ${type} metarelation`)
    this.primaryIds = primaryIds
    this.secondaryIds = secondaryIds
    this.type = type
    this.metarelationId = metarelationId // Will be set on first execute if undefined
    this.selectionState = null
  }

  canExecute(context) {
    const { meiGraph } = context

    // Need at least some relations selected
    if (this.primaryIds.length === 0 && this.secondaryIds.length === 0) {
      return false
    }

    // Verify all referenced relations exist
    for (const id of [...this.primaryIds, ...this.secondaryIds]) {
      const node = getById(meiGraph.getRootNode(), id)
      if (!node) {
        console.warn(`CreateMetarelationCommand: relation ${id} not found`)
        return false
      }
      const type = node.getAttribute('type')
      if (type !== 'relation' && type !== 'metarelation') {
        console.warn(`CreateMetarelationCommand: ${id} is not a relation or metarelation`)
        return false
      }
    }

    return true
  }

  execute(context) {
    const { mei, meiGraph, drawContexts } = context
    const drawContext = drawContexts.find(dc => dc.canEdit)

    // Capture current selection for undo
    this.selectionState = captureSelectionState()

    // Get the MEI nodes for the primaries and secondaries
    const primaryNodes = this.primaryIds.map(id => getById(meiGraph.getRootNode(), id)).filter(Boolean)
    const secondaryNodes = this.secondaryIds.map(id => getById(meiGraph.getRootNode(), id)).filter(Boolean)

    // Create the metarelation
    const [metarelationId, meiElems] = add_metarelation(
      meiGraph,
      primaryNodes,
      secondaryNodes,
      this.type,
      this.metarelationId // Use existing ID if this is a redo
    )

    // Store the metarelation ID for undo/redo
    this.metarelationId = metarelationId

    // Render the metarelation
    renderMetarelation(drawContext, meiGraph, metarelationId)

    // Deselect after operation
    deselectAll(toggle_selected)

    adjustAllLayersSvgDimensions()
    updateRelationTree()
  }

  undo(context) {
    const { mei, meiGraph, drawContexts } = context

    // Deselect current selection
    deselectAll(toggle_selected)

    if (this.metarelationId) {
      // Find the child IDs before removing arcs
      const arcs = findArcsForNode(meiGraph, this.metarelationId)
      const childIds = arcs
        .filter(arc => arc.getAttribute('from') === '#' + this.metarelationId)
        .map(arc => arc.getAttribute('to')?.slice(1))
        .filter(Boolean)

      // Remove SVG elements
      removeSvgRelation(drawContexts, this.metarelationId)

      // Remove arcs from MEI
      arcs.forEach(arc => arc.remove())

      // Remove the metarelation node from MEI
      const metaNode = getById(mei, this.metarelationId)
      if (metaNode) {
        metaNode.remove()
      }

      // Remove connection circles from children that no longer have parent metarelations
      for (const childId of childIds) {
        // Check if this child has any remaining parent metarelations
        const remainingParentArcs = Array.from(meiGraph.getElementsByTagName('arc')).filter(arc => {
          if (arc.getAttribute('to') !== '#' + childId) return false
          const fromId = arc.getAttribute('from')?.slice(1)
          const fromNode = getById(meiGraph, fromId)
          return fromNode && fromNode.getAttribute('type') === 'metarelation'
        })

        // If no remaining parents, remove the connection circle
        if (remainingParentArcs.length === 0) {
          const childElem = document.getElementById(childId)
          if (childElem) {
            const connectionCircle = childElem.querySelector('.connection-circle')
            if (connectionCircle) {
              // Also remove any connected lines
              const circleId = connectionCircle.getAttribute('id')
              if (circleId) {
                const connectedLines = document.querySelectorAll(`line[circle\\:id="${circleId}"]`)
                connectedLines.forEach(line => line.remove())
              }
              connectionCircle.remove()
            }
          }
        }
      }
    }

    // Restore previous selection
    restoreSelection(this.selectionState, toggle_selected)

    adjustAllLayersSvgDimensions()
    updateRelationTree()
  }

  redo(context) {
    // For redo, we re-execute with the same metarelationId
    this.execute(context)
  }
}
