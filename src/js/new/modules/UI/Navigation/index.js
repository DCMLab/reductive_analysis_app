import { doc } from '../../../utils/document'
import viewport from '../../Viewport'

class Navigation {
  constructor() {
    // Navigation buttons removed
  }

  onTap(e) {
    // Navigation button tap handlers removed
  }

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
