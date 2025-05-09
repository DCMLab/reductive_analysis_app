import { getCurrentDrawContext } from '../../../../ui'

/**
 * Hide all meta relations in the given layer
 * @param {Object} layer - The layer object containing the SVG element
 */
function hide_meta_relations(layer) {
  const metaRelations = layer.svg_elem.querySelectorAll('.metarelation')
  metaRelations.forEach(elem => elem.classList.add('hidden'))
}

/**
 * Show all meta relations in the given layer
 * @param {Object} layer - The layer object containing the SVG element
 */
function show_meta_relations(layer) {
  const metaRelations = layer.svg_elem.querySelectorAll('.metarelation')
  metaRelations.forEach(elem => elem.classList.remove('hidden'))
}

export default class MetaRelation {
  constructor(layers) {
    this.layers = layers

    this.on = document.getElementById('meta-relation-on')
    this.off = document.getElementById('meta-relation-off')

    this.visible = false

    // Register this instance to make it accessible globally
    if (!window.metaRelationInstance) {
      window.metaRelationInstance = this
    }
  }

  draw() {
    const currentLayerObject = getCurrentDrawContext()

    if (this.visible) {
      show_meta_relations(currentLayerObject)
    } else {
      hide_meta_relations(currentLayerObject)
    }
  }

  onChange({ target }) {
    if (target.name == 'meta-relation') {
      this.visible = target.value == 'on'
      this.draw()
    }
  }

  onScoreLoad() {
    this.updateToggles()
  }

  updateToggles(layer = getCurrentDrawContext()) {
    const hasMetaRelations = layer.svg_elem.querySelectorAll('.metarelation:not(.hidden)').length > 0

    this[hasMetaRelations ? 'on' : 'off'].checked = true
    this.visible = hasMetaRelations
  }

  toggle(layer = getCurrentDrawContext()) {
    this.visible == true ? this.off.click() : this.on.click()
  }
}
