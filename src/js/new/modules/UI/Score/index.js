import { toggle_equalize, toggle_orphan_notes } from '../../../../ui'
import { doc } from '../../../utils/document'

const AUTO_CLOSE_TIMEOUT = 10000 // in milliseconds

class ScoreSettings {
  constructor() {
    this.ctn = document.getElementById('player-and-score-appearance')
    this.toggleVisibilityBtn = document.getElementById('score-settings-toggle')

    this.toggleShadesBtn = document.getElementById('settings-shades')
    this.toggleStemsBtn = document.getElementById('settings-stems')
    this.toggleTonesBtn = document.getElementById('settings-non-related-tones')

    this.expanded = false
    this.autoCloseTimer = null

    this.brightShades = true
  }

  get interacting() {
    const isHover = this.hasInteractionWith(this.ctn)
    const hasFocusWithin = this.hasInteractionWith(document.activeElement)
    return isHover || hasFocusWithin
  }

  hasInteractionWith(el) {
    // See .player-and-score-appearance documentation in .scss file.
    return getComputedStyle(el).getPropertyValue('--in-player-and-score-settings').trim() == '1'
  }

  // Compact the settings panel when idle.
  startAutoCloseTimer() {
    clearTimeout(this.autoCloseTimer)
    this.autoCloseTimer = setTimeout(() => {

      // extend timer
      if (this.interacting) {
        return this.startAutoCloseTimer()
      }

      this.toggleVisibility(false)
    }, AUTO_CLOSE_TIMEOUT)
  }

  onTap(e) {
    // Compact when clicked outside.
    if (!e.composedPath().includes(this.ctn)) {
      return this.toggleVisibility(false)
    }

    this.startAutoCloseTimer()

    if (e.target == this.toggleVisibilityBtn) {
      return this.toggleVisibility(true)
    }

    if (e.target == this.toggleShadesBtn) {
      return this.toggleShades()
    }

    if (e.target == this.toggleStemsBtn) {
      return this.toggleStems()
    }

    if (e.target == this.toggleTonesBtn) {
      return toggle_orphan_notes()
    }
  }

  toggleVisibility(state = !this.expanded) {
    this.expanded = state
    doc.classList.toggle('ui-score-settings-visible', state)
  }

  toggleShades(state = !this.brightShades) {
    this.brightShades = state
    doc.classList.toggle('shades-alternate', !state)
  }

  toggleStems() {
    toggle_equalize()
  }
}

const scoreSettings = new ScoreSettings()

export default scoreSettings
