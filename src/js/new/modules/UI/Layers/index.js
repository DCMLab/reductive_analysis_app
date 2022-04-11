import { clamp } from '../../../utils/math'
import { getDrawContexts } from '../../../../app'
import JsonTree       from './jsonTree'
import LayerControls  from './new'
import Reductions     from './reductions'
import RelationsTree  from './relationsTree'
import { navigation_conf } from '../../../../conf'
import { getCurrentDrawContext, setCurrentDrawContext } from '../../../../ui'
import { doc } from '../../../utils/document'

class LayersMenu {
  #visible = false

  constructor() {
    this.ctn = document.getElementById('layers-menu')
    this.toggleBtn = document.getElementById('layers-menu-toggle')

    this.layersEls = document.getElementsByClassName('layer-new-ui')

    this.visibleLayer = 1 // most visible layer on screen
    this.activeLayer = 1

    this.$visibleLayer = document.getElementById('visible-layer')
    this.$currentLayer = document.getElementById('current-layer')

    this.new = new LayerControls(this)
    this.reductions = new Reductions(this)
    this.tree = new RelationsTree(this)
    this.jsonTree = new JsonTree(this)

    this.previousLayerBtn = document.getElementById('layers-nav-previous')
    this.nextLayerBtn = document.getElementById('layers-nav-next')

    this.$saveSettingsCtn = document.getElementById('layer-menu-settings')
    this.$shouldSave = document.getElementById('should-save-layer')
    this.$lockBtn = document.getElementById('layer-lock')

    this.initObserver()
  }

  get contexts() {
    return this.getAll()
  }

  getAll = () => getDrawContexts()

  onTap(e) {
    if (!e.composedPath().includes(this.ctn)) { return }

    if (e.target == this.toggleBtn) { return this.toggleVisibility() }

    if (e.target == this.nextLayerBtn) { return this.moveBy(1) }
    if (e.target == this.previousLayerBtn) { return this.moveBy(-1) }

    if (e.target == this.$lockBtn) { return this.toggleLock() }
    if (e.target == this.$shouldSave) { return this.toggleSave() }

    this.new.onTap(e)

    // Update `data-position` attribute based on DOM order.
    Array.from(this.layersEls).forEach((layer, index) => {
      layer.dataset.position = index + 1
    })

    this.addMouseListeners()
    this.observe()
    this.updateNavigation()
    this.updateLayersCount()

    this.reductions.onTap(e)
    this.jsonTree.onTap(e)
  }

  onChange(e) {
    if (!e.composedPath().includes(this.ctn)) { return }

    this.tree.onChange(e)
    this.new.onChange(e)
  }

  onScoreLoad() {
    this.addMouseListeners()
    this.updateLayersCount()
    this.tree.onScoreLoad()
  }

  toggleVisibility(state = !this.#visible) {
    this.#visible = state
    this.ctn.classList.toggle('layers-menu--visible', state)
  }

  setCurrentLayer(layerPosition = 1) {
    console.log(layerPosition)
    const layer = this.contexts.find(layer => layer.layer.layer_number + 1 == layerPosition)
    if (layer) {
      setCurrentDrawContext(layer)
      this.$currentLayer.innerHTML = layerPosition
      this.activeLayer = layerPosition
      this.updateLayersCount()
      this.checkLockState(layer.canEdit)
      this.checkSaveState(layer.canSave)
      this.tree.updateToggles(layer)
    }
  }

  updateLayersCount() {
    const hasOneLayer = this.contexts.length == 1
    doc.classList.toggle('has-1-layer', hasOneLayer)
    doc.classList.toggle('has-many-layers', !hasOneLayer)
    this.$saveSettingsCtn.classList.toggle('layers-menu__saveSettings--hidden', hasOneLayer || this.activeLayer == 1)
  }

  updateNavigation() {
    this.$visibleLayer.innerHTML = this.visibleLayer

    this.previousLayerBtn.toggleAttribute('disabled', this.visibleLayer == 1)
    this.nextLayerBtn.toggleAttribute('disabled', this.visibleLayer == this.contexts.length)
  }

  // Observe intersection of layers with viewport to know the current one.

  observe() {

    // Remove IntersectionObserver if there’s only 1 layer.
    if (this.contexts.length < 2) {
      this.contexts[0].observing = false

      // https://w3c.github.io/IntersectionObserver/#lifetime
      return this.observer.disconnect()
    }

    this.contexts
      .filter(layer => !layer.observing)
      .forEach(layer => {

        /**
         * Add element that will always intersect respecting ratios.
         * See `/src/sass/score/score.scss`
         */
        if (layer.layer.layer_elem.childElementCount == 1) {
          layer.layer.layer_elem.insertAdjacentHTML('beforeend',
            `<div class="layer-intersection-landmark" data-position="${layer.layer.layer_number + 1}"></div>`
          )
        }
        this.observer.observe(layer.layer.layer_elem.querySelector('.layer-intersection-landmark'))
        layer.observing = true
      })
  }

  initObserver() {
    this.observer = new IntersectionObserver(entries => {

      // Store the height of the layer visible in the viewport.
      entries.forEach(entry => {
        const layer = this.contexts.find(layer => entry.target.dataset.position == layer.layer.layer_number + 1)
        if (layer) {
          layer.visibleHeight = entry.intersectionRect.height ?? 0
        }
      })

      // The most visible layer is marked as current.
      const highestVisibility = Math.max(...this.contexts.map(layer => layer.visibleHeight))
      const mostVisibleLayer = this.contexts.find(layer => layer.visibleHeight == highestVisibility)
      this.visibleLayer = parseInt(mostVisibleLayer.layer.layer_elem.dataset.position)
      this.updateNavigation()
    }, {
      threshold: [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1],
    })
  }

  moveBy(distance = 0) {
    const destinationLayer = this.visibleLayer + distance

    if (clamp(destinationLayer, 1, this.contexts.length) == destinationLayer) {
      const layerEl = this.contexts.reverse()[destinationLayer - 1].layer.layer_elem
      this.contexts.reverse() // re-reverse array (reverse modifies the original…)
      layerEl.scrollIntoView()
    }
  }

  addMouseListeners() {
    if (!navigation_conf.switch_context_on_hover) { return }

    // Remove listeners if there’s only 1 layer.
    if (this.contexts.length < 2) {
      this.contexts[0].listeningToMouse = false
      return this.contexts[0].layer.layer_elem.removeEventListener('mouseenter', this.markAsCurrent.bind(this))
    }

    this.contexts
      .filter(layer => !layer.listeningToMouse)
      .forEach(layer => {
        layer.layer.layer_elem.addEventListener('mouseenter', this.markAsCurrent.bind(this))
        layer.listeningToMouse = true
      })
  }

  markAsCurrent(e) {
    this.setCurrentLayer(parseInt(e.target.dataset.position))
  }

  toggleSave(state = !getCurrentDrawContext().canSave) {
    getCurrentDrawContext().canSave = state
    this.checkSaveState(state)
  }

  // Only the “visible” one
  checkSaveState(state) {
    this.$shouldSave.checked = state
  }

  toggleLock(state = !getCurrentDrawContext().canEdit) {
    getCurrentDrawContext().canEdit = state
    this.checkLockState(state)
  }

  // Only the “visible” one
  checkLockState(state) {
    this.$lockBtn.classList.toggle('lock-path--unlocked', state)
  }
}

const layersMenu = new LayersMenu()

export default layersMenu
