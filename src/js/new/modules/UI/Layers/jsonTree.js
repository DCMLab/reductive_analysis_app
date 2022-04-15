import { align_tree, draw_tree, load_tree, save_tree } from '../../../../trees'
import { getCurrentDrawContext } from '../../../../ui'

export default class JsonTree {
  constructor(layers) {
    this.layers = layers

    this.jsonInput = document.getElementById('json-tree')

    this.saveBtn = document.getElementById('json-tree-save')
    this.loadBtn = document.getElementById('json-tree-load')
    this.alignBtn = document.getElementById('json-tree-align')
  }

  get jsonTree() {
    try {
      return JSON.parse(this.jsonInput.value.trim())
    } catch {
      return null
    }
  }

  onTap({ target }) {
    const currentLayerObject = getCurrentDrawContext()

    if (target == this.saveBtn) { return save_tree(currentLayerObject) }
    if (target == this.loadBtn) { return load_tree(currentLayerObject) }
    if (target == this.alignBtn) { return align_tree(currentLayerObject) }
  }

  onSubmit(e) {
    if (e.target.id != 'json-tree-form') { return }

    e.preventDefault()

    if (this.jsonTree) {
      // ⚠️ each layer should have its JSON tree input preserved, so the value here when changing the layer should be saved to something
      const currentLayerObject = getCurrentDrawContext()
      draw_tree(currentLayerObject)
    }
  }
}
