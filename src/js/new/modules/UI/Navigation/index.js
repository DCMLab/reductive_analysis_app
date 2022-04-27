import { doc } from '../../../utils/document'
import viewport from '../../Viewport'

class Navigation {
  constructor() {
    this.toLeftBtn = document.getElementById('to-left')
    this.toRightBtn = document.getElementById('to-right')
  }

  onTap(e) {
    if (e.target == this.toLeftBtn) { return this.toLeft() }
    if (e.target == this.toRightBtn) { return this.toRight() }
  }

  toLeft() { this.goTo(-(viewport.w - 200)) }
  toRight() { this.goTo(viewport.w - 200) }

  /**
   * Safari ignores CSS smooth scroll, which makes this a temporary solution.
   * https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior
   *
   * (Maybe think about using a LERP function with rAF.)
   *
   * Ideally, `scrollIntoView` should be used, but as Safari ignores
   * the `scroll-padding`, the scroll would stop at a bad offset.
   */
  goTo(x) { doc.scrollBy(x, 0) }
}

const navigation = new Navigation()

export default navigation
