/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/

/**
 * Utility functions for MEI serialization and manipulation.
 * These functions help commands store and restore MEI state without
 * holding live DOM references.
 */

/**
 * Serialize an MEI element to an XML string.
 * @param {Element} element - The MEI element to serialize
 * @returns {string} XML string representation
 */
export function serializeElement(element) {
  if (!element) return null
  return new XMLSerializer().serializeToString(element)
}

/**
 * Parse an XML string back into an MEI element.
 * @param {Document} mei - The MEI document (needed for namespace context)
 * @param {string} xmlString - The XML string to parse
 * @returns {Element} The parsed element
 */
export function deserializeElement(mei, xmlString) {
  if (!xmlString) return null
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')
  // Import the node into the MEI document to maintain namespace
  return mei.importNode(doc.documentElement, true)
}

/**
 * Get an element by its xml:id attribute.
 * @param {Document|Element} doc - The document or element to search in
 * @param {string} id - The xml:id value
 * @returns {Element|null}
 */
export function getById(doc, id) {
  if (!doc || !id) return null
  // Handle both with and without # prefix
  const cleanId = id.startsWith('#') ? id.slice(1) : id

  // Try multiple selector patterns for xml:id
  // The [*|id="..."] pattern should work but sometimes doesn't in all browsers
  let result = doc.querySelector(`[*|id="${cleanId}"]`)
  if (!result) {
    // Fallback: try explicit xml:id attribute
    result = doc.querySelector(`[xml\\:id="${cleanId}"]`)
  }
  if (!result) {
    // Fallback: search through all nodes manually
    const nodes = doc.getElementsByTagName('node')
    for (const node of nodes) {
      if (node.getAttribute('xml:id') === cleanId) {
        return node
      }
    }
    // Also check arcs
    const arcs = doc.getElementsByTagName('arc')
    for (const arc of arcs) {
      if (arc.getAttribute('xml:id') === cleanId) {
        return arc
      }
    }
  }
  return result
}

/**
 * Find all arcs connected to a given node (by ID).
 * @param {Element} meiGraph - The MEI graph element
 * @param {string} nodeId - The node's xml:id
 * @returns {Element[]} Array of arc elements
 */
export function findArcsForNode(meiGraph, nodeId) {
  if (!meiGraph || !nodeId) return []
  const cleanId = nodeId.startsWith('#') ? nodeId : '#' + nodeId
  const arcs = Array.from(meiGraph.getElementsByTagName('arc'))
  return arcs.filter(arc =>
    arc.getAttribute('from') === cleanId ||
    arc.getAttribute('to') === cleanId
  )
}

/**
 * Find all metarelations that reference a given relation.
 * @param {Element} meiGraph - The MEI graph element
 * @param {string} relationId - The relation's xml:id
 * @returns {Element[]} Array of metarelation node elements
 */
export function findParentMetarelations(meiGraph, relationId) {
  if (!meiGraph || !relationId) return []
  const cleanId = relationId.startsWith('#') ? relationId : '#' + relationId

  const metarelations = []
  const visited = new Set()

  function findParents(targetId) {
    const arcs = Array.from(meiGraph.getElementsByTagName('arc'))
    for (const arc of arcs) {
      if (arc.getAttribute('to') === targetId) {
        const fromId = arc.getAttribute('from')?.slice(1)
        if (fromId && !visited.has(fromId)) {
          const fromNode = getById(meiGraph.getRootNode(), fromId)
          if (fromNode && fromNode.getAttribute('type') === 'metarelation') {
            visited.add(fromId)
            metarelations.push(fromNode)
            // Recursively find parents of this metarelation
            findParents('#' + fromId)
          }
        }
      }
    }
  }

  findParents(cleanId)
  return metarelations
}

/**
 * Find note nodes that would become orphaned if a relation is deleted.
 * A note is orphaned if it has no other arcs pointing to it.
 * @param {Element} meiGraph - The MEI graph element
 * @param {string} relationId - The relation's xml:id
 * @returns {Element[]} Array of note node elements that would be orphaned
 */
export function findOrphanedNotes(meiGraph, relationId) {
  if (!meiGraph || !relationId) return []
  const cleanId = relationId.startsWith('#') ? relationId : '#' + relationId

  // Find arcs from this relation
  const relationArcs = Array.from(meiGraph.getElementsByTagName('arc')).filter(
    arc => arc.getAttribute('from') === cleanId
  )

  // Get the note IDs these arcs point to
  const noteIds = relationArcs
    .map(arc => arc.getAttribute('to')?.slice(1))
    .filter(Boolean)

  // Check each note to see if it has other arcs pointing to it
  const orphaned = []
  for (const noteId of noteIds) {
    const otherArcs = Array.from(meiGraph.getElementsByTagName('arc')).filter(
      arc => arc.getAttribute('to') === '#' + noteId && arc.getAttribute('from') !== cleanId
    )
    if (otherArcs.length === 0) {
      const noteNode = getById(meiGraph.getRootNode(), noteId)
      if (noteNode && !['relation', 'metarelation'].includes(noteNode.getAttribute('type'))) {
        orphaned.push(noteNode)
      }
    }
  }

  return orphaned
}

/**
 * Find all note nodes connected to a relation.
 * @param {Element} meiGraph - The MEI graph element
 * @param {string} relationId - The relation's xml:id
 * @returns {Element[]} Array of note node elements
 */
export function findConnectedNotes(meiGraph, relationId) {
  if (!meiGraph || !relationId) return []
  const cleanId = relationId.startsWith('#') ? relationId : '#' + relationId

  // Find arcs from this relation to note nodes
  const relationArcs = Array.from(meiGraph.getElementsByTagName('arc')).filter(
    arc => arc.getAttribute('from') === cleanId
  )

  // Get the note nodes these arcs point to
  const notes = []
  for (const arc of relationArcs) {
    const noteId = arc.getAttribute('to')?.slice(1)
    if (noteId) {
      const noteNode = getById(meiGraph.getRootNode(), noteId)
      // Only include note nodes (not relations/metarelations)
      if (noteNode && !['relation', 'metarelation'].includes(noteNode.getAttribute('type'))) {
        notes.push(noteNode)
      }
    }
  }

  return notes
}

/**
 * Create a snapshot of a relation and all its related elements.
 * This captures everything needed to restore the relation after deletion.
 * @param {Element} meiGraph - The MEI graph element
 * @param {string} relationId - The relation's xml:id
 * @returns {Object} Snapshot object with serialized XML
 */
export function createRelationSnapshot(meiGraph, relationId) {
  const node = getById(meiGraph.getRootNode(), relationId)
  if (!node) return null

  const arcs = findArcsForNode(meiGraph, relationId)
  // Capture ALL connected notes (not just orphaned ones) to handle multi-relation deletes
  const connectedNotes = findConnectedNotes(meiGraph, relationId)
  const parentMetarelations = findParentMetarelations(meiGraph, relationId)

  // Create snapshots for parent metarelations recursively
  const metaSnapshots = parentMetarelations.map(meta => {
    const metaId = meta.getAttribute('xml:id')
    return {
      id: metaId,
      nodeXml: serializeElement(meta),
      arcsXml: findArcsForNode(meiGraph, metaId).map(serializeElement)
    }
  })

  return {
    id: relationId,
    type: node.getAttribute('type'),
    nodeXml: serializeElement(node),
    arcsXml: arcs.map(serializeElement),
    connectedNotesXml: connectedNotes.map(serializeElement),
    // Keep orphanedNotesXml for backwards compatibility
    orphanedNotesXml: connectedNotes.map(serializeElement),
    metarelations: metaSnapshots
  }
}

/**
 * Restore a relation from a snapshot.
 * @param {Document} mei - The MEI document
 * @param {Element} meiGraph - The MEI graph element
 * @param {Object} snapshot - The snapshot created by createRelationSnapshot
 */
export function restoreRelationFromSnapshot(mei, meiGraph, snapshot) {
  if (!snapshot) return

  // First restore any parent metarelations (in reverse order - parents before children)
  const sortedMetas = [...snapshot.metarelations].reverse()
  for (const metaSnapshot of sortedMetas) {
    // Check if metarelation node already exists
    if (!getById(mei, metaSnapshot.id)) {
      const metaNode = deserializeElement(mei, metaSnapshot.nodeXml)
      meiGraph.appendChild(metaNode)
    }
    // Always check and restore missing arcs (even if node existed)
    for (const arcXml of metaSnapshot.arcsXml) {
      const arc = deserializeElement(mei, arcXml)
      const from = arc.getAttribute('from')
      const to = arc.getAttribute('to')
      const type = arc.getAttribute('type')
      // Check for duplicate arcs
      const existing = Array.from(meiGraph.getElementsByTagName('arc')).find(
        a => a.getAttribute('from') === from &&
             a.getAttribute('to') === to &&
             a.getAttribute('type') === type
      )
      if (!existing) {
        meiGraph.appendChild(arc)
      }
    }
  }

  // Restore connected note nodes (may have been deleted if they became orphaned)
  // Use connectedNotesXml if available, fall back to orphanedNotesXml for backwards compatibility
  const notesToRestore = snapshot.connectedNotesXml || snapshot.orphanedNotesXml || []
  for (const noteXml of notesToRestore) {
    const noteNode = deserializeElement(mei, noteXml)
    const noteId = noteNode.getAttribute('xml:id')
    const existingNote = getById(mei, noteId)
    if (!existingNote) {
      console.debug('restoreRelationFromSnapshot: restoring note node', noteId)
      meiGraph.appendChild(noteNode)
    }
  }

  // Restore the relation node
  const relationNode = deserializeElement(mei, snapshot.nodeXml)
  const existingRelation = getById(mei, snapshot.id)
  if (!existingRelation) {
    meiGraph.appendChild(relationNode)
  }

  // Restore arcs
  for (const arcXml of snapshot.arcsXml) {
    const arc = deserializeElement(mei, arcXml)
    // Check for duplicate arcs
    const from = arc.getAttribute('from')
    const to = arc.getAttribute('to')
    const type = arc.getAttribute('type')
    const existing = Array.from(meiGraph.getElementsByTagName('arc')).find(
      a => a.getAttribute('from') === from &&
           a.getAttribute('to') === to &&
           a.getAttribute('type') === type
    )
    if (!existing) {
      meiGraph.appendChild(arc)
    }
  }
}

/**
 * Remove a relation and all its related elements from the MEI graph.
 * @param {Element} meiGraph - The MEI graph element
 * @param {string} relationId - The relation's xml:id
 * @param {boolean} removeMetarelations - Whether to also remove parent metarelations
 */
export function removeRelationFromMei(meiGraph, relationId, removeMetarelations = true) {
  const cleanId = relationId.startsWith('#') ? relationId.slice(1) : relationId

  // Find and remove parent metarelations first (if requested)
  if (removeMetarelations) {
    const metarelations = findParentMetarelations(meiGraph, cleanId)
    for (const meta of metarelations) {
      const metaId = meta.getAttribute('xml:id')
      // Remove arcs for this metarelation
      const metaArcs = findArcsForNode(meiGraph, metaId)
      metaArcs.forEach(arc => arc.remove())
      // Remove the metarelation node
      meta.remove()
    }
  }

  // Find orphaned notes before removing arcs
  const orphanedNotes = findOrphanedNotes(meiGraph, cleanId)

  // Remove arcs connected to this relation
  const arcs = findArcsForNode(meiGraph, cleanId)
  arcs.forEach(arc => arc.remove())

  // Remove orphaned note nodes
  orphanedNotes.forEach(note => note.remove())

  // Remove the relation node
  const node = getById(meiGraph.getRootNode(), cleanId)
  if (node) {
    node.remove()
  }
}

/**
 * Get the type of a relation from its label child.
 * @param {Element} relationNode - The relation node element
 * @returns {string|null} The relation type
 */
export function getRelationType(relationNode) {
  if (!relationNode) return null
  const label = relationNode.getElementsByTagName('label')[0]
  return label ? label.getAttribute('type') : null
}

/**
 * Set the type of a relation.
 * @param {Element} relationNode - The relation node element
 * @param {string} type - The new type value
 */
export function setRelationType(relationNode, type) {
  if (!relationNode) return
  const label = relationNode.getElementsByTagName('label')[0]
  if (label) {
    label.setAttribute('type', type)
  }
}

/**
 * Check for orphaned elements in MEI and SVG.
 * Alerts if any issues are found.
 * @param {Element} meiGraph - The MEI graph element
 * @returns {Object} Report of found issues
 */
export function checkForOrphans(meiGraph) {
  if (!meiGraph) return { hasIssues: false }

  const issues = {
    brokenArcs: [],
    orphanedNodes: [],
    duplicateArcs: [],
    svgWithoutMei: [],
    meiWithoutSvg: [],
    hasIssues: false
  }

  const strip = (val) => (val && val.startsWith('#') ? val.slice(1) : val)

  // Collect all existing node IDs
  const nodes = Array.from(meiGraph.getElementsByTagName('node'))
  const existingNodeIds = new Set()
  nodes.forEach(node => {
    const id = node.getAttribute('xml:id')
    if (id) existingNodeIds.add(id)
  })

  // Check for broken arcs (arcs pointing to non-existent nodes)
  const arcs = Array.from(meiGraph.getElementsByTagName('arc'))
  arcs.forEach(arc => {
    const fromId = strip(arc.getAttribute('from'))
    const toId = strip(arc.getAttribute('to'))
    if (!fromId || !toId || !existingNodeIds.has(fromId) || !existingNodeIds.has(toId)) {
      issues.brokenArcs.push({
        arcId: arc.getAttribute('xml:id'),
        from: fromId,
        to: toId,
        missingFrom: fromId && !existingNodeIds.has(fromId),
        missingTo: toId && !existingNodeIds.has(toId)
      })
    }
  })

  // Collect all referenced node IDs from arcs
  const referencedNodeIds = new Set()
  arcs.forEach(arc => {
    const f = strip(arc.getAttribute('from'))
    const t = strip(arc.getAttribute('to'))
    if (f) referencedNodeIds.add(f)
    if (t) referencedNodeIds.add(t)
  })

  // Check for orphaned nodes (nodes not referenced by any arc)
  nodes.forEach(node => {
    const id = node.getAttribute('xml:id')
    if (id && !referencedNodeIds.has(id)) {
      issues.orphanedNodes.push({
        nodeId: id,
        type: node.getAttribute('type')
      })
    }
  })

  // Check for duplicate arcs
  const arcKeys = new Map()
  arcs.forEach(arc => {
    const from = arc.getAttribute('from') || ''
    const to = arc.getAttribute('to') || ''
    const type = arc.getAttribute('type') || ''
    const key = `${from}|${to}|${type}`
    if (arcKeys.has(key)) {
      issues.duplicateArcs.push({
        arcId: arc.getAttribute('xml:id'),
        from: strip(from),
        to: strip(to),
        type
      })
    } else {
      arcKeys.set(key, arc)
    }
  })

  // Check for SVG relation/metarelation elements without MEI counterparts
  const svgRelations = document.querySelectorAll('.relation, .metarelation')
  svgRelations.forEach(svgElem => {
    const id = svgElem.getAttribute('id')
    if (id && !existingNodeIds.has(id)) {
      issues.svgWithoutMei.push({
        svgId: id,
        className: svgElem.className
      })
    }
  })

  // Check for MEI relation/metarelation nodes without SVG counterparts
  nodes.forEach(node => {
    const type = node.getAttribute('type')
    if (type === 'relation' || type === 'metarelation') {
      const id = node.getAttribute('xml:id')
      if (id && !document.getElementById(id)) {
        issues.meiWithoutSvg.push({
          nodeId: id,
          type
        })
      }
    }
  })

  // Determine if there are any issues
  issues.hasIssues =
    issues.brokenArcs.length > 0 ||
    issues.orphanedNodes.length > 0 ||
    issues.duplicateArcs.length > 0 ||
    issues.svgWithoutMei.length > 0 ||
    issues.meiWithoutSvg.length > 0

  // Alert and log if issues found
  if (issues.hasIssues) {
    const summary = []
    if (issues.brokenArcs.length > 0) summary.push(`${issues.brokenArcs.length} broken arc(s)`)
    if (issues.orphanedNodes.length > 0) summary.push(`${issues.orphanedNodes.length} orphaned node(s)`)
    if (issues.duplicateArcs.length > 0) summary.push(`${issues.duplicateArcs.length} duplicate arc(s)`)
    if (issues.svgWithoutMei.length > 0) summary.push(`${issues.svgWithoutMei.length} SVG element(s) without MEI`)
    if (issues.meiWithoutSvg.length > 0) summary.push(`${issues.meiWithoutSvg.length} MEI element(s) without SVG`)

    console.warn('Orphan check found issues:', issues)
    alert(`Orphan check detected issues:\n${summary.join('\n')}\n\nSee console for details.`)
  }

  return issues
}
