import { getCurrentDrawContext } from '../utils/misc'
import { getDOMRect } from '../../../utils/dom'

const ZOOM_DEFAULT = 1
const ZOOM_STEP = 1.1
const ZOOM_STEP_REVERSED = 1 / ZOOM_STEP

class Zoom {
  constructor() {
    this.zoomInBtn = document.getElementById('zoom-in')
    this.zoomOutBtn = document.getElementById('zoom-out')
    this.resetBtn = document.getElementById('zoom-reset')
    this.levelEl = document.getElementById('zoom-level')
    this.zoomSlider = document.getElementById('zoom-slider')

    this.zoomSlider.oninput = () => this.slide()

    window.addEventListener('wheel', (event) => {
      if (event.ctrlKey) {
        if (event.deltaY < 0) {
          event.preventDefault()
          this.in()
        } else if (event.deltaY > 0) {
          event.preventDefault()
          this.out()
        }
      }
    }, { passive: false })
  }

  onTap({ target }) {
    if (target == this.zoomInBtn) {
      return this.in()
    }
    if (target == this.zoomOutBtn) {
      return this.out()
    }
    if (target == this.resetBtn) {
      return this.reset()
    }
  }

  updateZoom() {
    const context = getCurrentDrawContext()
    const rootSvg = context.svg_elem

    // Get centre of SVG
    let centreX = getDOMRect(rootSvg, ['width']).width / 2
    let centreY = getDOMRect(rootSvg, ['height']).height / 2

    // Get final translation coordinate
    let x = centreX - context.zoom * centreX
    let y = centreY - context.zoom * centreY

    // Translate to centre, zoom and translate back to origin
    // That way, the view stays stable during zoom
    rootSvg.style.transform =
      `matrix(${context.zoom}, 0, 0, ${context.zoom}, ${x}, ${y})`
    this.levelEl.innerHTML = this.format(context.zoom)
  }

  slide() {
    const context = getCurrentDrawContext()

    if (!context) return

    context.zoom = this.zoomSlider.value / 100
    this.updateZoom()
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
    if (!context) {
      return
    }

    context.zoom = cx == ZOOM_DEFAULT ? ZOOM_DEFAULT : context.zoom * cx
    this.updateZoom()
  }

  format(zoom) {
    return `${Math.round(zoom * 100)}%`
  }
}

const zoom = new Zoom()

export default zoom
