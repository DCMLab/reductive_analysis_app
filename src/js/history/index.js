/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/

/**
 * History Module - Command-based Undo/Redo System
 *
 * This module provides a robust undo/redo system using the Command pattern.
 *
 * Key features:
 * - Commands store only IDs, never live DOM references
 * - MEI is the single source of truth
 * - SVG is derived from MEI state after undo/redo
 * - Each command knows how to fully execute and reverse itself
 *
 * Usage:
 *
 *   import { getHistoryManager, USE_NEW_HISTORY } from './history'
 *   import { CreateRelationCommand } from './history/commands'
 *
 *   if (USE_NEW_HISTORY) {
 *     const command = new CreateRelationCommand(primaryIds, secondaryIds, type)
 *     getHistoryManager().execute(command, context)
 *   }
 */

// Feature flag - set to true to enable the new history system
// Set to false to use the legacy undo_actions/redo_actions system
export const USE_NEW_HISTORY = true

// Export the history manager
export { HistoryManager, getHistoryManager, resetHistoryManager } from './HistoryManager'

// Export base command class
export { Command } from './Command'

// Export all commands
export {
  ChangeRelationTypeCommand,
  CreateRelationCommand,
  CreateMetarelationCommand,
  DeleteRelationCommand,
  AddNoteCommand
} from './commands'

// Export utilities
export * from './meiUtils'
export * from './renderUtils'

/**
 * Create the application context object for passing to commands.
 * This gathers all the necessary state that commands need.
 *
 * NOTE: This function imports from bootstrap lazily to avoid circular dependencies.
 * The imports are cached after first use.
 *
 * @param {Object} options - Optional overrides
 * @returns {Object} Context object
 */
export function createContext(options = {}) {
  // If meiGraph and drawContexts are provided in options, use those
  // Otherwise, we need to get them from the global state
  // The caller (bootstrap.js, delete.js, etc.) should pass these in options
  // to avoid circular dependency issues

  // Get mei from window (always available)
  const mei = options.mei || window.mei

  // For meiGraph and drawContexts, they should be passed via options
  // from the calling code which has access to them
  if (!options.meiGraph || !options.drawContexts) {
    console.warn('createContext called without meiGraph or drawContexts - these should be passed in options')
  }

  return {
    mei,
    meiGraph: options.meiGraph,
    drawContexts: options.drawContexts,
    getEditableDrawContext: () => options.drawContexts?.find(dc => dc.canEdit),
    ...options
  }
}

/**
 * Wrapper functions for common operations that automatically use the
 * appropriate system (new or legacy) based on the feature flag.
 */

import { getHistoryManager } from './HistoryManager'
import {
  ChangeRelationTypeCommand,
  CreateRelationCommand,
  CreateMetarelationCommand,
  DeleteRelationCommand,
  AddNoteCommand
} from './commands'

/**
 * Execute an undo operation.
 * NOTE: This is a convenience function. The main entry point is do_undo() in action/undo_redo.js
 * which handles both legacy and new systems.
 * @param {Object} context - Application context (required)
 * @returns {boolean} True if undo succeeded
 */
export function doUndo(context) {
  if (!USE_NEW_HISTORY) {
    console.warn('doUndo called with USE_NEW_HISTORY=false - use do_undo from action/undo_redo instead')
    return false
  }

  return getHistoryManager().undo(context)
}

/**
 * Execute a redo operation.
 * NOTE: This is a convenience function. The main entry point is do_redo() in action/undo_redo.js
 * which handles both legacy and new systems.
 * @param {Object} context - Application context (required)
 * @returns {boolean} True if redo succeeded
 */
export function doRedo(context) {
  if (!USE_NEW_HISTORY) {
    console.warn('doRedo called with USE_NEW_HISTORY=false - use do_redo from action/undo_redo instead')
    return false
  }

  return getHistoryManager().redo(context)
}

/**
 * Create a relation using the new command system.
 * @param {string[]} primaryNoteIds - Primary note SVG element IDs
 * @param {string[]} secondaryNoteIds - Secondary note SVG element IDs
 * @param {string} type - Relation type
 * @param {string} [relationId] - Optional relation ID (for redo)
 * @returns {boolean} True if succeeded
 */
export function createRelation(primaryNoteIds, secondaryNoteIds, type, relationId = null) {
  if (!USE_NEW_HISTORY) {
    return false // Let legacy system handle it
  }

  const context = createContext()
  const command = new CreateRelationCommand(primaryNoteIds, secondaryNoteIds, type, relationId)
  return getHistoryManager().execute(command, context)
}

/**
 * Create a metarelation using the new command system.
 * @param {string[]} primaryIds - Primary relation/metarelation xml:ids
 * @param {string[]} secondaryIds - Secondary relation/metarelation xml:ids
 * @param {string} type - Metarelation type
 * @param {string} [metarelationId] - Optional metarelation ID (for redo)
 * @returns {boolean} True if succeeded
 */
export function createMetarelation(primaryIds, secondaryIds, type, metarelationId = null) {
  if (!USE_NEW_HISTORY) {
    return false // Let legacy system handle it
  }

  const context = createContext()
  const command = new CreateMetarelationCommand(primaryIds, secondaryIds, type, metarelationId)
  return getHistoryManager().execute(command, context)
}

/**
 * Delete relations using the new command system.
 * @param {string[]} relationIds - Array of relation xml:ids to delete
 * @returns {boolean} True if succeeded
 */
export function deleteRelations(relationIds) {
  if (!USE_NEW_HISTORY) {
    return false // Let legacy system handle it
  }

  const context = createContext()
  const command = new DeleteRelationCommand(relationIds)
  return getHistoryManager().execute(command, context)
}

/**
 * Change relation type using the new command system.
 * @param {string[]} relationIds - Array of relation xml:ids
 * @param {string} newType - New relation type
 * @returns {boolean} True if succeeded
 */
export function changeRelationType(relationIds, newType) {
  if (!USE_NEW_HISTORY) {
    return false // Let legacy system handle it
  }

  const context = createContext()
  const command = new ChangeRelationTypeCommand(relationIds, newType)
  return getHistoryManager().execute(command, context)
}

/**
 * Add a note using the new command system.
 * @param {string} pname - Pitch name
 * @param {number} oct - Octave
 * @param {string} referenceNoteId - Reference note ID
 * @param {string} [noteId] - Optional note ID
 * @param {Element} [targetStaff] - Target staff element
 * @param {Element} [targetMeasure] - Target measure element
 * @returns {boolean} True if succeeded
 */
export function addNote(pname, oct, referenceNoteId, noteId = null, targetStaff = null, targetMeasure = null) {
  if (!USE_NEW_HISTORY) {
    return false // Let legacy system handle it
  }

  const context = createContext()
  const command = new AddNoteCommand(pname, oct, referenceNoteId, noteId, targetStaff, targetMeasure)
  return getHistoryManager().execute(command, context)
}
