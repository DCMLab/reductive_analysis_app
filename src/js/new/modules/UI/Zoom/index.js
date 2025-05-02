import { getCurrentDrawContext } from '../../../../ui'
import { adjustSvgDimensions } from '../../../../ui'
import { prevent } from '../../../events/prevent'

const ZOOM_DEFAULT = 1
const ZOOM_STEP = 1.1
const ZOOM_STEP_REVERSED = 1 / ZOOM_STEP

class Zoom {
  constructor() {
    this.zoomInBtn = document.getElementById('zoom-in')
    this.zoomOutBtn = document.getElementById('zoom-out')
    this.resetBtn = document.getElementById('zoom-reset')
    this.levelEl = document.getElementById('zoom-level')

    // For Chrome, Edge, Firefox — trackpad pinch detection
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

    // For Safari — gesturechange event (non-standard)
    // TODO: Check for correctness as soon as the app works on Safari again.
    window.addEventListener('gesturechange', (event) => {
      this.by(Math.abs(Math.floor(event.deltaY / ZOOM_STEP)))
    })
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
    context.svg_elem.style.transform = `scale(${context.zoom})`
    this.levelEl.innerHTML = this.format(context.zoom)
  }

  format(zoom) {
    return `${Math.round(zoom * 100)}%`
  }
}

const zoom = new Zoom()

export default zoom
