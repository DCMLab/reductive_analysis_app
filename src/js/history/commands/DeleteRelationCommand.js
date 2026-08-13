/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/

import { Command } from '../Command'
import {
  getById,
  createRelationSnapshot,
  restoreRelationFromSnapshot,
  removeRelationFromMei
} from '../meiUtils'
import {
  removeSvgRelation,
  renderRelation,
  renderMetarelation,
  clearRelationHover,
  updateRelationTree,
  deselectAll,
  restoreSelection,
  captureSelectionState
} from '../renderUtils'
import { toggle_selected, adjustAllLayersSvgDimensions } from '../../modules/UI/utils/misc'

/**
 * Command to delete one or more relations (and their dependent metarelations).
 *
 * This is the most complex command because deleting a relation can cascade:
 * - Parent metarelations that reference this relation must also be deleted
 * - Note nodes that become orphaned (no longer referenced) should be removed
 * - Connection circles for metarelations need to be updated
 *
 * On execute: creates snapshots, then removes elements from MEI and SVG
 * On undo: restores from snapshots
 */
export class DeleteRelationCommand extends Command {
  /**
   * @param {string[]} relationIds - Array of relation xml:id values to delete
   */
  constructor(relationIds) {
    super('delete_relation', `Delete ${relationIds.length} relation(s)`)
    this.relationIds = relationIds
    this.snapshots = [] // Will store snapshots for each relation
    this.selectionState = null
    this.connectionCircleData = [] // Store connection circle state for metarelations
  }

  canExecute(context) {
    // Verify all relations exist
    for (const id of this.relationIds) {
      const node = getById(context.mei, id)
      if (!node) {
        console.warn(`DeleteRelationCommand: relation ${id} not found`)
        return false
      }
    }
    return this.relationIds.length > 0
  }

  execute(context) {
    const { mei, meiGraph, drawContexts } = context
    const drawContext = drawContexts.find(dc => dc.canEdit)

    // Capture current selection for undo
    this.selectionState = captureSelectionState()

    // Clear snapshots (in case of re-execute)
    this.snapshots = []
    this.connectionCircleData = []

    // First, create snapshots of all relations before deleting anything
    // This captures the full state needed for undo
    for (const relationId of this.relationIds) {
      const snapshot = createRelationSnapshot(meiGraph, relationId)
      if (snapshot) {
        this.snapshots.push(snapshot)
      }
    }

    // Collect all metarelation IDs that will be deleted (for connection circle handling)
    const allMetarelationIds = new Set()
    for (const snapshot of this.snapshots) {
      if (snapshot.type === 'metarelation') {
        allMetarelationIds.add(snapshot.id)
      }
      for (const meta of snapshot.metarelations) {
        allMetarelationIds.add(meta.id)
      }
    }

    // Capture connection circle state before deletion
    this._captureConnectionCircles(meiGraph, allMetarelationIds)

    // Clear hover highlights from all relations and their children before deletion
    // This prevents orphaned highlight classes when deleting while hovering
    for (const relationId of this.relationIds) {
      clearRelationHover(drawContext, meiGraph, relationId)
    }
    for (const metaId of allMetarelationIds) {
      clearRelationHover(drawContext, meiGraph, metaId)
    }

    // Now delete the relations
    for (const relationId of this.relationIds) {
      const node = getById(mei, relationId)
      if (!node) continue

      // Remove from SVG
      removeSvgRelation(drawContexts, relationId)

      // Remove from MEI (this also removes parent metarelations and orphaned notes)
      removeRelationFromMei(meiGraph, relationId, true)
    }

    // Remove SVG graphics for all parent metarelations that were deleted
    for (const metaId of allMetarelationIds) {
      removeSvgRelation(drawContexts, metaId)
    }

    // Remove connection circles for deleted metarelations
    this._removeConnectionCircles()

    // Deselect after operation
    deselectAll(toggle_selected)

    adjustAllLayersSvgDimensions()
    updateRelationTree()
  }

  undo(context) {
    const { mei, meiGraph, drawContexts } = context
    const drawContext = drawContexts.find(dc => dc.canEdit)

    // Deselect current selection
    deselectAll(toggle_selected)

    // Restore from snapshots in reverse order
    // (so that parent metarelations are restored before their children)
    const reversedSnapshots = [...this.snapshots].reverse()

    for (const snapshot of reversedSnapshots) {
      // Restore MEI elements from snapshot
      restoreRelationFromSnapshot(mei, meiGraph, snapshot)

      // Re-render the relation in SVG
      if (snapshot.type === 'relation') {
        renderRelation(drawContext, meiGraph, snapshot.id)
      } else if (snapshot.type === 'metarelation') {
        renderMetarelation(drawContext, meiGraph, snapshot.id)
      }

      // Re-render parent metarelations
      for (const metaSnapshot of snapshot.metarelations) {
        renderMetarelation(drawContext, meiGraph, metaSnapshot.id)
      }
    }

    // Restore connection circles
    this._restoreConnectionCircles()

    // Restore previous selection
    restoreSelection(this.selectionState, toggle_selected)

    adjustAllLayersSvgDimensions()
    updateRelationTree()
  }

  redo(context) {
    this.execute(context)
  }

  /**
   * Capture the state of connection circles before deletion.
   * @private
   */
  _captureConnectionCircles(meiGraph, metarelationIds) {
    this.connectionCircleData = []

    // For each metarelation being deleted, find the children that have connection circles
    for (const metaId of metarelationIds) {
      // Find arcs from this metarelation
      const arcs = Array.from(meiGraph.getElementsByTagName('arc')).filter(
        arc => arc.getAttribute('from') === '#' + metaId
      )

      for (const arc of arcs) {
        const childId = arc.getAttribute('to')?.slice(1)
        if (!childId) continue

        // Check if this child still has other parent metarelations after this deletion
        const otherParentArcs = Array.from(meiGraph.getElementsByTagName('arc')).filter(a => {
          const fromId = a.getAttribute('from')?.slice(1)
          if (a.getAttribute('to') !== '#' + childId) return false
          if (metarelationIds.has(fromId)) return false // This one is being deleted
          const fromNode = getById(meiGraph.getRootNode(), fromId)
          return fromNode && fromNode.getAttribute('type') === 'metarelation'
        })

        // If no other parents, we need to track the connection circle
        if (otherParentArcs.length === 0) {
          const childElem = document.getElementById(childId)
          if (!childElem) continue

          const connectionCircle = childElem.querySelector('.connection-circle')
          if (connectionCircle) {
            const circleData = {
              childId,
              circleId: connectionCircle.getAttribute('id'),
              circleSVG: connectionCircle.cloneNode(true),
              connectedLines: []
            }

            // Find connected lines
            const circleId = connectionCircle.getAttribute('id')
            if (circleId) {
              const connectedLines = document.querySelectorAll(`line[circle\\:id="${circleId}"]`)
              connectedLines.forEach(line => {
                if (line.parentElement) {
                  circleData.connectedLines.push({
                    lineSVG: line.cloneNode(true),
                    parentId: line.parentElement.id
                  })
                }
              })
            }

            this.connectionCircleData.push(circleData)
          }
        }
      }
    }
  }

  /**
   * Remove connection circles that should be removed.
   * @private
   */
  _removeConnectionCircles() {
    for (const circleData of this.connectionCircleData) {
      // Remove connected lines first
      for (const lineData of circleData.connectedLines) {
        const circleId = circleData.circleId
        if (circleId) {
          const lines = document.querySelectorAll(`line[circle\\:id="${circleId}"]`)
          lines.forEach(line => line.remove())
        }
      }

      // Remove the connection circle
      const childElem = document.getElementById(circleData.childId)
      if (childElem) {
        const circle = childElem.querySelector('.connection-circle')
        if (circle) {
          circle.remove()
        }
      }
    }
  }

  /**
   * Restore connection circles from captured state.
   * @private
   */
  _restoreConnectionCircles() {
    for (const circleData of this.connectionCircleData) {
      const childElem = document.getElementById(circleData.childId)
      if (!childElem) continue

      // Check if circle already exists
      if (childElem.querySelector('.connection-circle')) continue

      // Restore the circle
      childElem.appendChild(circleData.circleSVG.cloneNode(true))

      // Restore connected lines
      for (const lineData of circleData.connectedLines) {
        const parentElem = document.getElementById(lineData.parentId)
        if (parentElem) {
          parentElem.appendChild(lineData.lineSVG.cloneNode(true))
        }
      }
    }
  }
}
