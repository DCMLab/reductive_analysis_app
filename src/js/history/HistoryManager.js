/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/

import { checkForOrphans } from './meiUtils'

/**
 * HistoryManager - Manages undo/redo stacks using the Command pattern.
 *
 * Key design principles:
 * - Commands store only IDs, never live DOM references
 * - MEI is the single source of truth
 * - SVG is always derived from MEI state after undo/redo
 * - Each command knows how to fully execute and reverse itself
 */
export class HistoryManager {
  constructor() {
    this.undoStack = []
    this.redoStack = []
    this.maxSize = 100
    this.listeners = new Set()
  }

  /**
   * Execute a command and add it to the undo stack.
   * @param {Command} command - The command to execute
   * @param {Object} context - Application context (mei, meiGraph, drawContexts, etc.)
   * @returns {boolean} True if execution succeeded
   */
  execute(command, context) {
    try {
      // Validate preconditions if the command provides a canExecute method
      if (command.canExecute && !command.canExecute(context)) {
        console.warn(`Command ${command.type} cannot execute: preconditions not met`)
        return false
      }

      // Execute the command
      command.execute(context)

      // Add to undo stack
      this.undoStack.push(command)

      // Clear redo stack on new action (standard behavior)
      this.redoStack = []

      // Trim undo stack if it exceeds max size
      if (this.undoStack.length > this.maxSize) {
        this.undoStack.shift()
      }

      this._emitChange()
      return true
    } catch (error) {
      console.error(`Error executing command ${command.type}:`, error)
      return false
    }
  }

  /**
   * Undo the last action.
   * @param {Object} context - Application context
   * @returns {boolean} True if undo succeeded
   */
  undo(context) {
    if (this.undoStack.length === 0) {
      console.log('Nothing to undo')
      return false
    }

    try {
      const command = this.undoStack.pop()
      command.undo(context)
      this.redoStack.push(command)
      this._emitChange()

      // Check for orphaned elements after undo
      if (context.meiGraph) {
        checkForOrphans(context.meiGraph)
      }

      return true
    } catch (error) {
      console.error('Error during undo:', error)
      return false
    }
  }

  /**
   * Redo the last undone action.
   * @param {Object} context - Application context
   * @returns {boolean} True if redo succeeded
   */
  redo(context) {
    if (this.redoStack.length === 0) {
      console.log('Nothing to redo')
      return false
    }

    try {
      const command = this.redoStack.pop()
      command.redo(context)
      this.undoStack.push(command)
      this._emitChange()

      // Check for orphaned elements after redo
      if (context.meiGraph) {
        checkForOrphans(context.meiGraph)
      }

      return true
    } catch (error) {
      console.error('Error during redo:', error)
      return false
    }
  }

  /**
   * Check if undo is available.
   * @returns {boolean}
   */
  canUndo() {
    return this.undoStack.length > 0
  }

  /**
   * Check if redo is available.
   * @returns {boolean}
   */
  canRedo() {
    return this.redoStack.length > 0
  }

  /**
   * Get the count of undoable actions.
   * @returns {number}
   */
  get undoCount() {
    return this.undoStack.length
  }

  /**
   * Get the count of redoable actions.
   * @returns {number}
   */
  get redoCount() {
    return this.redoStack.length
  }

  /**
   * Clear all history.
   */
  clear() {
    this.undoStack = []
    this.redoStack = []
    this._emitChange()
  }

  /**
   * Subscribe to history changes.
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Emit change event to all listeners.
   * @private
   */
  _emitChange() {
    const state = {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }

    // Emit custom DOM event for existing UI components
    document.dispatchEvent(new CustomEvent('undoredo', {
      detail: {
        redoAbleCount: state.redoCount,
        undoAbleCount: state.undoCount,
      }
    }))

    // Notify direct subscribers
    this.listeners.forEach(listener => {
      try {
        listener(state)
      } catch (error) {
        console.error('Error in history listener:', error)
      }
    })
  }

  /**
   * Get a description of the last undoable action.
   * @returns {string|null}
   */
  getUndoDescription() {
    if (this.undoStack.length === 0) return null
    const command = this.undoStack[this.undoStack.length - 1]
    return command.description || command.type
  }

  /**
   * Get a description of the last redoable action.
   * @returns {string|null}
   */
  getRedoDescription() {
    if (this.redoStack.length === 0) return null
    const command = this.redoStack[this.redoStack.length - 1]
    return command.description || command.type
  }
}

// Singleton instance
let historyManagerInstance = null

/**
 * Get the singleton HistoryManager instance.
 * @returns {HistoryManager}
 */
export function getHistoryManager() {
  if (!historyManagerInstance) {
    historyManagerInstance = new HistoryManager()
  }
  return historyManagerInstance
}

/**
 * Reset the history manager (useful for testing or loading new files).
 */
export function resetHistoryManager() {
  if (historyManagerInstance) {
    historyManagerInstance.clear()
  }
  historyManagerInstance = new HistoryManager()
  return historyManagerInstance
}
