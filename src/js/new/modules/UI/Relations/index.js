import { clamp }      from '../../../utils/math'
import { getDOMRect } from '../../../utils/dom'
import { pxToRem }    from '../../../utils/units'
import viewport from '../../Viewport'

const SNAP_DELTA = 10

class RelationsFlyOut {
  #dragging = false

  constructor() {
    this.ctn = { el: document.getElementById('relations-menu') }
    this.dragHandle = { el: this.ctn.el.querySelector('.fly-out__drag') }

    this.visible = false
    this.x = 0
    this.y = 0

    this.computeValues()
  }

  onTap(e) {
    // @todo
  }

  onMouseDown({ target }) {
    if (target == this.dragHandle.el) {
      this.toggleDragging(true)
    }
  }

  onMouseMove(x, y) {
    if (this.#dragging) {
      this.updatePosition(x, y)
    }
  }

  onMouseUp() {
    this.toggleDragging(false)
    this.computeValues()
    this.bringbackInViewport()
  }

  onResize() {
    this.computeValues()
    this.bringbackInViewport()
  }

  updatePosition(x = this.x, y = this.y) {
    this.x = x - this.ctn.handleDeltaX
    this.y = y - this.ctn.handleDeltaY
    this.ctn.el.style.setProperty('--relations-menu-x', pxToRem(this.x))
    this.ctn.el.style.setProperty('--relations-menu-y', pxToRem(this.y))
  }

  bringbackInViewport() {
    const x = clamp(this.x, SNAP_DELTA, viewport.w - this.ctn.width - SNAP_DELTA)
    const y = clamp(this.y, SNAP_DELTA, viewport.h - this.ctn.height - SNAP_DELTA)
    this.updatePosition(x + this.ctn.handleDeltaX, y + this.ctn.handleDeltaY)
  }

  toggleDragging(state = !this.#dragging) {
    this.#dragging = state
    this.ctn.el.classList.toggle('grabbing', state)
  }

  computeValues() {
    const ctnDOMRect = getDOMRect(this.ctn.el, ['x', 'y', 'width', 'height'])
    Object.assign(this.ctn, ctnDOMRect)

    const dragHandleDOMRect = getDOMRect(this.dragHandle.el, ['width', 'height'])
    Object.assign(this.dragHandle,
      dragHandleDOMRect,
      {
        offsetLeft: this.dragHandle.el.offsetLeft,
        offsetTop: this.dragHandle.el.offsetTop,
      },
    )

    this.ctn.handleDeltaX = this.dragHandle.offsetLeft + (this.dragHandle.width / 2)
    this.ctn.handleDeltaY = this.dragHandle.offsetTop + (this.dragHandle.height / 2)
  }
}

const relationsMenu = new RelationsFlyOut()

export default relationsMenu
