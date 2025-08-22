import { getDrawContexts } from '../../../bootstrap'
import {
  getCurrentDrawContext,
  adjustAllLayersSvgDimensions
} from '../utils/misc'

const ZOOM_DEFAULT = 1
const ZOOM_STEP = 0.02

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
    this.setScale(this.state.scale + ZOOM_STEP)
  }
  out() {
    // this.by(-ZOOM_STEP)
    this.setScale(this.state.scale - ZOOM_STEP)
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

  _computeDim(svg) {
    const rect =
      svg
        .getElementsByClassName('page-margin')[0]
        .getBoundingClientRect()

    svg.setAttribute('viewBox', `${rect.x} ${rect.y} ${rect.width} ${rect.height}`)

    return rect
  }

  initSvg(svg) {

    let rect = this._computeDim(svg)

    svg.dataset.baseW = rect.width
    svg.dataset.baseH = rect.height

    this.updateContainerSize(svg, 1)

    rect = this._computeDim(svg)

    svg.dataset.baseW = rect.width
    svg.dataset.baseH = rect.height

    this.state.scale =
      svg
        .parentElement
        .parentElement
        .style
        .width
        .slice(0, -2) /
      svg.dataset.baseW

  }

  updateContainerSize(svg, scale) {
    const bw = +svg.dataset.baseW
    const bh = +svg.dataset.baseH

    const container = svg.parentElement.parentElement

    container.style.width = bw * scale + 'px'
    container.style.height = bh * scale + 'px'
  }

  setScale(s) {
    this.state.scale = Math.max(0.02, s)
    document
      .querySelectorAll('.svg_container > svg > .definition-scale')
      .forEach((svg) => this.updateContainerSize(svg, this.state.scale))

    this.format(this.state.scale)
  }
}

const zoom = new Zoom()

export default zoom
