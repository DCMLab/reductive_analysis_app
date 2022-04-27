import { getCurrentDrawContext } from '../../../../ui'

const ZOOM_DEFAULT = 1
const ZOOM_STEP = 1.1
const ZOOM_STEP_REVERSED = 1 / ZOOM_STEP

class Zoom {
  constructor() {
    this.zoomInBtn = document.getElementById('zoom-in')
    this.zoomOutBtn = document.getElementById('zoom-out')
    this.resetBtn = document.getElementById('zoom-reset')
    this.levelEl = document.getElementById('zoom-level')
  }

  onTap({ target }) {
    if (target == this.zoomInBtn) { return this.in() }
    if (target == this.zoomOutBtn) { return this.out() }
    if (target == this.resetBtn) { return this.reset() }
  }

  in() { this.by(ZOOM_STEP) }
  out() { this.by(ZOOM_STEP_REVERSED) }
  reset() { this.by(ZOOM_DEFAULT) }

  by(cx = 1) {
    const context = getCurrentDrawContext()
    if (!context) { return }

    context.zoom = cx == ZOOM_DEFAULT ? ZOOM_DEFAULT : context.zoom * cx
    context.svg_elem.style.transform = `scale(${context.zoom})`
    this.levelEl.innerHTML = this.format(context.zoom)
  }

  format(zoom) {
    return `${Math.round(zoom * 100)}%`
  }
}

const zoom = new Zoom()

export default zoom
