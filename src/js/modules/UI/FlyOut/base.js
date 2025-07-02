export default class FlyOut {
  constructor(ctnId) {
    this.ctn = { el: document.getElementById(ctnId) }
    this.closeBtn = this.ctn.el.querySelector('.fly-out__closeBtn')

    this.visible = false
  }

  onTap(e) {
    if (!e.composedPath().includes(this.ctn.el)) { return }

    if (e.target == this.closeBtn) {
      return this.toggleVisibility(false)
    }
  }

  toggleVisibility(state = !this.visible) {
    this.ctn.el.classList.toggle('fly-out--visible', state)
    this.visible = state
  }

  hide = () => this.toggleVisibility(false)
}
