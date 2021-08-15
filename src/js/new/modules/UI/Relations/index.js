import { passiveOnceEvent } from '../../../events/options'
import { prevent }          from '../../../events/prevent'
import { clamp }            from '../../../utils/math'
import { getDOMRect }       from '../../../utils/dom'
import { pxToRem }          from '../../../utils/units'
import viewport             from '../../Viewport'

// The minimal distance between the relations menu and the viewport.
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

  // Common handlers for touch and mouse events.

  onTap(e) {
    // @todo
  }

  onTapStart(e) {
    if (e.target == this.dragHandle.el) {
      prevent(e, () => this.toggleDragging(true))
    }
  }

  onTapMove(x, y) {
    if (this.#dragging) {
      this.updatePosition(x, y)
    }
  }

  onTapEnd() {
    if (this.#dragging) {
      this.toggleDragging(false)
      this.computeValues()
      this.snapInViewport()
    }
  }

  onResize() {
    this.computeValues()
    this.snapInViewport()
  }

  updatePosition(x = this.x, y = this.y) {
    this.x = x - this.ctn.handleDeltaX
    this.y = y - this.ctn.handleDeltaY
    this.ctn.el.style.setProperty('--relations-menu-x', pxToRem(this.x))
    this.ctn.el.style.setProperty('--relations-menu-y', pxToRem(this.y))
  }


  toggleDragging(state = !this.#dragging) {
    this.#dragging = state
    this.ctn.el.classList.toggle('grabbing', state)
  }

  /**
   * Bring the relations menu back when dragged outside viewport boundaries.
   */

  snapInViewport() {
    const x = clamp(this.x, SNAP_DELTA, viewport.w - this.ctn.width - SNAP_DELTA)
    const y = clamp(this.y, SNAP_DELTA, viewport.h - this.ctn.height - SNAP_DELTA)

    if (x != this.x || y != this.y) {

      // enable transition
      this.ctn.el.classList.add('fly-out--relations--snapping')
      this.ctn.el.addEventListener('transitionend', this.onSnapTransitionEnd.bind(this))

      // update position
      this.updatePosition(
        x + this.ctn.handleDeltaX,
        y + this.ctn.handleDeltaY
      )
    }
  }

  // Disable transition and remove transition listener.

  onSnapTransitionEnd({ propertyName }) {
    if (propertyName == 'transform') {
      this.ctn.el.classList.remove('fly-out--relations--snapping')
      this.ctn.el.removeEventListener('transitionend', this.onSnapTransitionEnd.bind(this))
    }
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
