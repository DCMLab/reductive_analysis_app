import { getCurrentDrawContext } from '../../../../ui'

const ZOOM_DEFAULT = 1
const ZOOM_STEP = 1.1
const ZOOM_STEP_REVERSED = 1 / ZOOM_STEP

class Zoom {
  constructor() {
    this.zoomInBtn = document.getElementById('zoom-in')
    this.zoomOutBtn = document.getElementById('zoom-out')
    this.zoomResetBtn = document.getElementById('zoom-reset')
    this.levelEl = document.getElementById('zoom-level')
  }

  in() {
    this.by(ZOOM_STEP)
  }

  out() {
    this.by(ZOOM_STEP_REVERSED)
  }

  reset() {
    this.by(ZOOM_DEFAULT)
  }

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

  onTap({ target }) {

    // Zoom In

    if (target == this.zoomInBtn) {
      this.in()
      return
    }

    // Zoom out

    if (target == this.zoomOutBtn) {
      this.out()
      return
    }

    // Reset zoom

    if (target == this.zoomResetBtn) {
      this.reset()
    }
  }
}

const zoom = new Zoom()

export default zoom
