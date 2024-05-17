/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
import { random_id } from './utils'

// Add a "relation" to the MEI graph element. We model this
// with a new node.
export function add_relation(mei_graph, primaries, secondaries, type, he_id_param) {
  var added = []
  // Add a new node for the relation
  // find nodes in the graphology graph and create an edge between them

  var he_elem = mei_graph.getRootNode().createElement('node')
  he_elem.setAttribute('type', 'relation')
  var he_label = mei_graph.getRootNode().createElement('label')
  if (typeof type != 'undefined')
    he_label.setAttribute('type', type)
  he_elem.appendChild(he_label)

  var he_id
  // If we're given a parameter ID, use that, otherwise generate a new one
  if (typeof he_id_param == 'undefined')
    he_id = 'he-' + random_id(5)
  else
    he_id = he_id_param
  he_elem.setAttribute('xml:id', he_id)
  mei_graph.appendChild(he_elem)
  added.push(he_elem)
  // for (var i = 0; i < added.length; i++) {
  //   console.log('graph:', mei_graph)
  // }
  // Set up the connections to the given primaries and secondaries
  for (var i = 0; i < primaries.length; i++) {
    var elem = mei.createElement('arc')
    elem.setAttribute('from', '#' + he_id)
    elem.setAttribute('to', '#' + primaries[i].getAttribute('xml:id'))
    elem.setAttribute('type', 'primary')
    mei_graph.appendChild(elem)
    added.push(elem)
  }
  for (var i = 0; i < secondaries.length; i++) {
    var elem = mei.createElement('arc')
    elem.setAttribute('from', '#' + he_id)
    elem.setAttribute('to', '#' + secondaries[i].getAttribute('xml:id'))
    elem.setAttribute('type', 'secondary')
    mei_graph.appendChild(elem)
    added.push(elem)
  }
  return [he_id, added.reverse()]
}

export function add_metarelation(mei_graph, primaries, secondaries, type, he_id_param) {
  var added = []
  // Add a new node for the relation
  var he_elem = mei_graph.getRootNode().createElement('node')
  he_elem.setAttribute('type', 'metarelation')
  var he_label = mei_graph.getRootNode().createElement('label')
  if (typeof type != 'undefined')
    he_label.setAttribute('type', type)
  he_elem.appendChild(he_label)
  // Use the given ID parameter if given
  var he_id
  if (typeof he_id_param == 'undefined')
    he_id = 'he-' + Math.floor(Math.random() * (1 << 20)).toString(16)
  else
    he_id = he_id_param
  he_elem.setAttribute('xml:id', he_id)
  mei_graph.appendChild(he_elem)
  added.push(he_elem)

  // Set up the connections to the given primaries and secondaries
  for (var i = 0; i < primaries.length; i++) {
    var elem = mei_graph.getRootNode().createElement('arc')
    elem.setAttribute('from', '#' + he_id)
    elem.setAttribute('to', '#' + primaries[i].getAttribute('xml:id'))
    elem.setAttribute('type', 'primary')
    mei_graph.appendChild(elem)
    added.push(elem)
  }
  for (var i = 0; i < secondaries.length; i++) {
    var elem = mei_graph.getRootNode().createElement('arc')
    elem.setAttribute('from', '#' + he_id)
    elem.setAttribute('to', '#' + secondaries[i].getAttribute('xml:id'))
    elem.setAttribute('type', 'secondary')
    mei_graph.appendChild(elem)
    added.push(elem)
  }
  return [he_id, added.reverse()]
}
