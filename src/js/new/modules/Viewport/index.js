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
    // this.scrollbarW = this.w - doc.clientWidth
  }
}

const viewport = new Viewport()

export default viewport
