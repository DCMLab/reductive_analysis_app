import { getDrawContexts } from '../../../bootstrap'
import {
  getCurrentDrawContext,
  adjustAllLayersSvgDimensions
} from '../utils/misc'

const ZOOM_DEFAULT = 1
const ZOOM_STEP = 0.02
const PRECIS = 7

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
  }

  in() {
    this.setScale(this.state.scale + ZOOM_STEP)
  }
  out() {
    this.setScale(this.state.scale - ZOOM_STEP)
  }

  format(zoom) {
    return `${Math.round(zoom * 100)}%`
  }

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

    for (let i = 0; i < PRECIS; ++i) {
      rect = this._computeDim(svg)
    }

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
    this.state.scale = Math.max(0.01, s)
    document
      .querySelectorAll('.svg_container > svg > .definition-scale')
      .forEach((svg) => this.updateContainerSize(svg, this.state.scale))

    this.levelEl.innerHTML = this.format(this.state.scale)
  }
}

const zoom = new Zoom()

export default zoom
