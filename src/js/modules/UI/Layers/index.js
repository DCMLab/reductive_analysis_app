import { getDrawContexts } from '../../../bootstrap'
import JsonTree       from './jsonTree'
import LayerControls  from './new'
import Reductions     from './reductions'
import RelationsTree  from './relationsTree'
import MetaRelation   from './metaRelation'
import { initLayerResize } from './layer_resize'
import { navigation_conf } from '../../../conf'
import {
  getCurrentDrawContext,
  setCurrentDrawContext,
  scrollDoc } from '../utils/misc'
import { doc } from '../../../utils/document'
import bookmarks from '../Bookmarks'

class LayersMenu {
  #visible = false

  constructor() {
    this.ctn = document.getElementById('layers-menu')
    this.toggleBtn = document.getElementById('layers-menu-toggle')

    this.layersEls = document.getElementsByClassName('layer-new-ui')

    this.activeLayer = 0

    this.$currentLayer = document.getElementById('current-layer')

    this.new = new LayerControls(this)
    this.reductions = new Reductions(this)
    this.tree = new RelationsTree(this)
    this.jsonTree = new JsonTree(this)
    this.metaRelation = new MetaRelation(this)

    this.previousLayerBtn = document.getElementById('layers-nav-previous')
    this.nextLayerBtn = document.getElementById('layers-nav-next')

    this.$saveSettingsCtn = document.getElementById('layer-menu-settings')
    this.$shouldSave = document.getElementById('should-save-layer')
    this.$lockBtn = document.getElementById('layer-lock')

    // Initialize layer resize functionality
    this.resizeHandler = initLayerResize(this)
  }

  get contexts() {
    return this.getAll()
  }

  getAll = () => getDrawContexts()

  onTap(e) {
    if (!e.composedPath().includes(this.ctn)) { return }

    if (e.target == this.toggleBtn) { return this.toggleVisibility() }

    if (e.target == this.nextLayerBtn) { return scrollDoc() }
    if (e.target == this.previousLayerBtn) { return scrollDoc(false) }

    if (e.target == this.$lockBtn) { return this.toggleLock() }
    if (e.target == this.$shouldSave) { return this.toggleSave() }

    this.new.onTap(e)

    this.setDataPosition()
    this.addMouseListeners()
    this.updateLayersCount()

    this.reductions.onTap(e)
    this.jsonTree.onTap(e)
  }

  onChange(e) {
    if (!e.composedPath().includes(this.ctn)) { return }

    this.tree.onChange(e)
    this.new.onChange(e)
    this.metaRelation.onChange(e)
  }

  onScoreLoad() {
    this.addMouseListeners()
    this.setDataPosition()
    this.updateLayersCount()
    this.tree.onScoreLoad()
    this.metaRelation.onScoreLoad()

    // Update resize handlers for newly loaded layers
    if (this.resizeHandler) {
      this.resizeHandler.updateResizeHandlers()
    }
  }

  toggleVisibility(state = !this.#visible) {
    this.#visible = state
    this.ctn.classList.toggle('layers-menu--visible', state)
  }

  // Update `data-position` attribute based on DOM order.
  setDataPosition() {
    Array.from(this.layersEls).forEach((layer, index) => {
      layer.dataset.position = index
    })
  }

  setCurrentLayer(layerPosition = 0) {
    const layer = this.contexts.find(layer => layer.layer.layer_number == layerPosition)

    if (!layer) { return }

    this.$currentLayer.innerHTML = layerPosition + 1
    this.activeLayer = layerPosition
    this.updateLayersCount()
    this.checkLockState(layer.canEdit)
    this.checkSaveState(layer.canSave)
    this.tree.updateToggles(layer)
    this.metaRelation.updateToggles(layer)
    bookmarks.setCount()
  }

  updateLayersCount() {
    const hasOneLayer = this.contexts.length == 1
    doc.classList.toggle('has-1-layer', hasOneLayer)
    doc.classList.toggle('has-many-layers', !hasOneLayer)

    const layerOneIsActive = this.activeLayer == 0
    doc.classList.toggle('in-layer-1', layerOneIsActive)
    doc.classList.toggle('not-in-layer-1', !layerOneIsActive)
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
    doc.classList.toggle('can-edit-layer', state)
  }
}

const layersMenu = new LayersMenu()

export default layersMenu
