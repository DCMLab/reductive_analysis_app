import { create_new_layer } from '../../../../app'
import { getCurrentDrawContext } from '../../../../ui'

export default class LayerControls {
  constructor(layers) {
    this.layers = layers

    this.$ctn = document.getElementById('layer-menu-new')

    this.$sliced = document.getElementById('layer-sliced')
    this.$tied = document.getElementById('layer-tied')

    this.$createBtn = document.getElementById('layer-new')
  }

  create() {
    create_new_layer(getCurrentDrawContext(), this.$sliced.checked, this.$tied.checked)
  }

  onChange({ target }) {
    console.log(target)
    // if (target.name == 'relations-tree') {
    //   this.visible = target.value == 'on'
    //   this.draw()
    // }

    // if (target == this.drawRoots) {
    //   this.shouldDrawRootsLow = target.checked
    //   this.draw()
    // }
  }

  onTap(e) {
    if (!e.composedPath().includes(this.$ctn)) { return }

    if (e.target == this.$createBtn) {
      this.create()
      console.log(this.layers)
    }
  }
}
