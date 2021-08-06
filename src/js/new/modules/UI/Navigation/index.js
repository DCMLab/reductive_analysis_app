import { doc } from '../../../utils/document'

class Navigation {
  constructor(ui) {
    this.ui = ui
    this.toLeftBtn = document.getElementById('to-left')
    this.toRightBtn = document.getElementById('to-right')
  }

  onTap(e) {
    if (e.target == this.toLeftBtn) { return this.toLeft() }
    if (e.target == this.toRightBtn) { return this.toRight() }
  }

  toLeft() { this.goTo(-(this.ui.wW - 200)) }
  toRight() { this.goTo(this.ui.wW - 200) }

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

export default (ui) => new Navigation(ui)
