import {
  create_new_layer,
  delete_layer,
  getDrawContexts
} from '../../../bootstrap'
import { getCurrentDrawContext } from '../utils/misc'

export default class LayerControls {
  constructor(layers) {
    this.layers = layers

    this.$ctn = document.getElementById('layer-menu-new')

    this.$sliced = document.getElementById('layer-sliced')
    this.$tied = document.getElementById('layer-tied')

    this.$createBtn = document.getElementById('layer-new')

    this.$deleteBtn = document.getElementById('layer-delete')
  }

  create() {
    create_new_layer(getCurrentDrawContext(), this.$sliced.checked, this.$tied.checked)
  }

  delete() {
    let curr = getCurrentDrawContext()
    if (getDrawContexts().filter(d =>
      d
        .mei_mdiv
        .getAttribute('xml:id')
        .includes(curr.mei_mdiv.getAttribute('xml:id'))).length == 1
    )
      delete_layer(curr)
    else
      alert('This layer is a dependency')
  }

  onChange({ target }) {
    // console.log(target)
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
    } else if (e.target == this.$deleteBtn) {
      this.delete()
    }
  }
}
