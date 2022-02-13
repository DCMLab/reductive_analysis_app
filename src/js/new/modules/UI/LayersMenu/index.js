class LayersMenu {
  constructor() {
    this.ctn = document.getElementById('layers-menu')
    this.toggleBtn = document.getElementById('layers-menu-toggle')

    this.visible = false
  }

  onTap({ target }) {
    if (target == this.toggleBtn) {
      return this.toggleVisibility()
    }
  }

  toggleVisibility(state = !this.visible) {
    this.visible = state
    this.ctn.classList.toggle('layers-menu--visible', state)
  }
}

const layersMenu = new LayersMenu()

export default layersMenu
