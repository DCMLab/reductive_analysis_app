/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/

/**
 * Base Command class for undo/redo operations.
 *
 * All commands must:
 * - Store only IDs, never live DOM references
 * - Be able to fully execute and reverse themselves
 * - Validate preconditions before execution
 *
 * Commands receive a context object containing:
 * - mei: The MEI document
 * - meiGraph: The graph element in the MEI
 * - drawContexts: Array of draw contexts for rendering
 * - getEditableDrawContext(): Function to get the editable draw context
 */
export class Command {
  /**
   * @param {string} type - Command type identifier
   * @param {string} [description] - Human-readable description for UI
   */
  constructor(type, description = null) {
    this.type = type
    this.description = description || type
    this.timestamp = Date.now()
  }

  /**
   * Check if the command can be executed.
   * Override in subclasses to add validation.
   * @param {Object} context - Application context
   * @returns {boolean}
   */
  canExecute(context) {
    return true
  }

  /**
   * Execute the command.
   * Must be overridden in subclasses.
   * @param {Object} context - Application context
   */
  execute(context) {
    throw new Error('execute() must be implemented by subclass')
  }

  /**
   * Undo the command.
   * Must be overridden in subclasses.
   * @param {Object} context - Application context
   */
  undo(context) {
    throw new Error('undo() must be implemented by subclass')
  }

  /**
   * Redo the command.
   * Default implementation calls execute(), but subclasses can override
   * for optimized redo behavior.
   * @param {Object} context - Application context
   */
  redo(context) {
    this.execute(context)
  }
}
