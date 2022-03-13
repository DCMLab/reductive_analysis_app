import { getCurrentDrawContext, hide_top } from '../../../../ui'
import { draw_hierarchy_graph } from '../../../../visualizations'

export default class RelationsTree {
  constructor(layers) {
    this.layers = layers

    this.on = document.getElementById('relations-tree-on')
    this.off = document.getElementById('relations-tree-off')
    this.drawRoots = document.getElementById('relations-tree-roots-low')

    this.visible = false
    this.shouldDrawRootsLow = false
  }

  /**
   * @todo update the checkbox state on layer change
   */
  draw() {
    const currentLayerObject = getCurrentDrawContext()

    if (this.visible) {
      draw_hierarchy_graph(currentLayerObject, 50, this.shouldDrawRootsLow)
    } else {
      hide_top(currentLayerObject)
    }
  }

  onChange({ target }) {
    if (target.name == 'relations-tree') {
      console.log(getCurrentDrawContext())
      this.visible = target.value == 'on'
      this.draw()
    }

    if (target == this.drawRoots) {
      this.shouldDrawRootsLow = target.checked
      this.draw()
    }
  }

  onScoreLoad() {
    this.updateToggles()
  }

  updateToggles(layer = getCurrentDrawContext()) {
    console.log(layer)
    const hasTree = layer.svg_elem.querySelector('#hier')
    console.log(hasTree)

    this[hasTree ? 'on' : 'off'].checked = true
  }
}
