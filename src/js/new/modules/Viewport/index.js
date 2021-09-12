// import { doc } from '../../utils/document'

class Viewport {
  constructor() {
    this.update()
  }

  onResize() {
    this.update()
  }

  update() {
    this.w = window.innerWidth
    this.h = window.innerHeight
    /** @todo: use 👇 and update CSS prop with it to get real scrollbar width */
    // this.scrollbarW = this.w - doc.clientWidth
  }
}

const viewport = new Viewport()

export default viewport
