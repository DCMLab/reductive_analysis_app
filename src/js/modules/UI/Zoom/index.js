import { getDrawContexts } from '../../../bootstrap'
import {
  getCurrentDrawContext,
  adjustAllLayersSvgDimensions
} from '../utils/misc'

const ZOOM_DEFAULT = 1
const ZOOM_STEP = 0.1

class Zoom {
  constructor() {
    this.zoomInBtn = document.getElementById('zoom-in')
    this.zoomOutBtn = document.getElementById('zoom-out')
    this.resetBtn = document.getElementById('zoom-reset')
    this.levelEl = document.getElementById('zoom-level')

    this.state = { scale: ZOOM_DEFAULT }

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

      const newCentreY = centreY * c.zoom

      // TODO: Scale with screen centre origin
      // Right now, it's top left
      rootSvg.setAttribute('transform-origin', `0 0`)
      rootSvg.style.transform =
        `scale(${c.zoom}) translateY(${(centreY - newCentreY) / c.zoom}px)`
    }

    this.levelEl.innerHTML = this.format(context.zoom)
  }

  in() {
    // this.by(ZOOM_STEP)
    this.setScale(ZOOM_STEP)
  }
  out() {
    // this.by(-ZOOM_STEP)
    this.setScale(-ZOOM_STEP)
  }
  reset() {
    this.by(ZOOM_DEFAULT)
    // Update UI in case no drawContext yet
    this.levelEl.innerHTML = this.format(ZOOM_DEFAULT)
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

  /* ******** New approach ******** */

  initSvg(svg) {
    const [_x, _y, w, h] =
      svg
        .getElementsByClassName('definition-scale')[0]
        .getAttribute('viewBox')
        .split(' ')

    svg.setAttribute('width', `${w}px`)
    svg.setAttribute('height', `${h}px`)

    this.baseW = w
    this.baseH = h

    this.updateContainerSize(svg, 1)
  }

  updateContainerSize(svg, scale) {
    const container = svg.parentElement.parentElement.parentElement

    container.style.width = this.baseW * scale + 'px'
    container.style.height = this.baseH * scale + 'px'

    svg.setAttribute('width', this.baseW * scale + 'px')
    svg.setAttribute('height', this.baseH * scale + 'px')

    svg
      .getElementsByClassName('definition-scale')[0]
      .setAttribute(
        'viewBox',
        `0 0 ${this.baseW / scale} ${this.baseH / scale}`
      )
  }

  setScale(s) {
    this.state.scale = Math.max(0.05, this.state.scale + s)
    document
      .querySelectorAll('.svg_container > svg')
      .forEach((svg) => this.updateContainerSize(svg, this.state.scale))

    this.format(this.state.scale)
  }
}

const zoom = new Zoom()

export default zoom
