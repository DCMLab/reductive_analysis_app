import { getDrawContexts } from "../../../../app"
import Reductions from "./reductions"

class LayersMenu {
  constructor() {
    this.ctn = document.getElementById('layers-menu')
    this.toggleBtn = document.getElementById('layers-menu-toggle')
    this.reduceBtn = document.getElementById('layers-menu-reduce')
    this.unreduceBtn = document.getElementById('layers-menu-unreduce')
    this.playReductionBtn = document.getElementById('layers-menu-play-reduction')

    this.visible = false
  }

  onTap({ target }) {
    if (target == this.toggleBtn) {
      return this.toggleVisibility()
    }

    const drawContext = getDrawContexts()[0]

    if (target == this.reduceBtn) {
      return Reductions.reduce(drawContext)
    }

    if (target == this.unreduceBtn) {
      return Reductions.unreduce(drawContext)
    }

    if (target == this.playReductionBtn) {
      return Reductions.play(drawContext)
    }
  }

  toggleVisibility(state = !this.visible) {
    this.visible = state
    this.ctn.classList.toggle('layers-menu--visible', state)
  }
}

const layersMenu = new LayersMenu()

export default layersMenu
