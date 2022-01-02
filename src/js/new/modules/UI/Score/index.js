import { toggle_equalize, toggle_orphan_notes } from '../../../../ui'
import { doc } from '../../../utils/document'

class ScoreSettings {
  constructor() {
    this.toggleShadesBtn = document.getElementById('settings-shades')
    this.toggleStemsBtn = document.getElementById('settings-stems')
    this.toggleTonesBtn = document.getElementById('settings-non-related-tones')

    this.brightShades = true
  }

  onTap({ target }) {
    if (target == this.toggleShadesBtn) {
      return this.toggleShades()
    }

    if (target == this.toggleStemsBtn) {
      return this.toggleStems()
    }

    if (target == this.toggleTonesBtn) {
      return toggle_orphan_notes()
    }
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
