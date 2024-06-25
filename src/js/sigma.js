import $ from 'jquery'
import { polygonHull } from 'd3-polygon'
import Sigma from 'sigma'
// import fuzzysearch from 'fuzzysearch'

import { getDrawContexts, getMeiGraph, getVerovioToolkit } from './app'
import { strip_xml_tags } from './conf'
import { getCurrentDrawContext, toggle_selected } from './ui'
// import important things from utils.js

function createGraphFromCoordinates(noteheadCoordinates) {
    const graph = initializeGraph()
  
    // Add nodes to the graph based on the coordinates
    noteheadCoordinates.forEach((coord, index) => {
      graph.graph.addNode({
        id: `n${index}`,
        label: `Node ${index}`,
        x: coord.x,
        y: coord.y,
        size: 1,
        color: '#ff0000' // Red color for the nodes
      })
    })
  
    // Render the graph
    graph.refresh()
  }
