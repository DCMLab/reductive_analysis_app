import { getDrawContexts } from '../../../bootstrap'
import { getCurrentDrawContext } from '../utils/misc'

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
    const contexts = getDrawContexts()

    for (let c of contexts) {
      const viewEl = c.view_elem
      const rootSvg = c.svg_elem.getElementsByTagName('svg')[0]

      // Find visible centre of the SVG
      const centreX = (viewEl.scrollLeft + viewEl.clientWidth / 2)
      const centreY = (viewEl.scrollTop + viewEl.clientHeight / 2)

      // Scale with screen centre origin
      rootSvg.setAttribute('transform-origin', `${centreX} ${centreY}`)
      rootSvg.style.transform = 'scale(' + c.zoom + ')'
    }

    this.levelEl.innerHTML = this.format(context.zoom)
    this.zoomSlider.value = context.zoom * 100
  }

  slide() {
    const contexts = getDrawContexts()

    if (!contexts || typeof getCurrentDrawContext() == 'undefined') return

    for (let c of contexts)
      c.zoom = this.zoomSlider.value / 100
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
    // Update UI in case no drawContext yet
    this.levelEl.innerHTML = this.format(ZOOM_DEFAULT)
    this.zoomSlider.value = ZOOM_DEFAULT * 100
  }

  by(cx = 1) {
    const contexts = getDrawContexts()

    if (!contexts || typeof getCurrentDrawContext() == 'undefined') return

    for (let c of contexts)
      c.zoom = cx == ZOOM_DEFAULT ? ZOOM_DEFAULT : c.zoom * cx
    this.updateZoom()
  }

  format(zoom) {
    return `${Math.round(zoom * 100)}%`
  }
}

const zoom = new Zoom()

export default zoom
