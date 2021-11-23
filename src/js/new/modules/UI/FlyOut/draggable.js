import { prevent }    from '../../../events/prevent'
import { clamp }      from '../../../utils/math'
import { doc }        from '../../../utils/document'
import { getDOMRect } from '../../../utils/dom'
import { pxToRem }    from '../../../utils/units'
import viewport       from '../../Viewport'
import { FlyOut }     from './'

// The minimal distance between the fly-out menu and the viewport.
const SNAP_DELTA = 10

export default class DraggableFlyOut extends FlyOut {
  #dragging = false

  constructor(ctnId) {
    super(ctnId)

    this.dragHandle = { el: this.ctn.el.querySelector('.fly-out__drag') }

    this.visible = false
    this.x = 0
    this.y = 0

    this.computeValues()
  }

  // Common handlers for touch and mouse events.

  onTapStart(e) {
    if (e.target == this.dragHandle.el) {
      prevent(e, () => this.toggleDragging(true))
    }
  }

  onTapMove(x, y) {
    if (this.visible && this.#dragging) {
      this.updatePosition(x, y)
    }
  }

  onTapEnd() {
    if (this.visible && this.#dragging) {
      this.toggleDragging(false)
      this.computeValues()
    }
  }

  onResize() {
    if (!this.visible) { return }
    this.computeValues()
  }

  updatePosition(x = this.x, y = this.y) {
    this.x = x - this.ctn.handleDeltaX
    this.y = y - this.ctn.handleDeltaY
    this.ctn.el.style.setProperty('--fly-out-x', pxToRem(this.x))
    this.ctn.el.style.setProperty('--fly-out-y', pxToRem(this.y))
  }

  toggleDragging(state = !this.#dragging) {
    this.#dragging = state
    this.ctn.el.classList.toggle('fly-out--grabbing', state)
    doc.classList.toggle('dragging-fly-out', state)
  }

  /**
   * Bring the fly-out menu back when dragged outside viewport boundaries.
   */

  snapInViewport() {
    const x = clamp(this.x, SNAP_DELTA, viewport.w - this.ctn.width - SNAP_DELTA)
    const y = clamp(this.y, SNAP_DELTA, viewport.h - this.ctn.height - SNAP_DELTA)

    if (x != this.x || y != this.y) {

      // enable transition
      this.ctn.el.classList.add('fly-out--snapping')
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
      this.ctn.el.classList.remove('fly-out--snapping')
      this.ctn.el.removeEventListener('transitionend', this.onSnapTransitionEnd.bind(this))
    }
  }

  // Compute the size and position of the container and the dragging handle.

  computeValues() {

    // Compute container values
    const ctnDOMRect = getDOMRect(this.ctn.el, ['x', 'y', 'width', 'height'])
    Object.assign(this.ctn, ctnDOMRect)

    // Compute dragging handle values
    const dragHandleDOMRect = getDOMRect(this.dragHandle.el, ['width', 'height'])
    Object.assign(this.dragHandle,
      dragHandleDOMRect,
      {
        // Distance from the top left of the container.
        offsetLeft: this.dragHandle.el.offsetLeft,
        offsetTop: this.dragHandle.el.offsetTop,
      },
    )

    /**
     * Distance between the top-left of the menu and the center of the handle.
     * This way it’s taken into account when the menu gets the `transform`.
     */
    this.ctn.handleDeltaX = this.dragHandle.offsetLeft + (this.dragHandle.width / 2)
    this.ctn.handleDeltaY = this.dragHandle.offsetTop + (this.dragHandle.height / 2)

    // Computation is done, we can finally snap if needed.

    this.snapInViewport()
  }
}
