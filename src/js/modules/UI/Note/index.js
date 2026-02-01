import {
  start_placing_note,
  stop_placing_note,
  toggle_placing_note,
} from '../utils/coordinates'
import { getPlacingNote, getCurrentDrawContext } from '../utils/misc'

class NewNote {
  constructor() {
    this.btn = null
    this.isActive = false
  }

  /**
   * Initialize - must be called after DOM is ready.
   */
  init() {
    this.btn = document.getElementById('new-note')
    if (this.btn) {
      this.btn.addEventListener('click', (e) => {
        e.stopPropagation() // Prevent any other handlers
        this.toggle()
      })
    }
  }

  /**
   * Sync button appearance with actual placing_note state.
   */
  syncButton() {
    if (!this.btn) return
    this.isActive = getPlacingNote() !== ''
    this.btn.classList.toggle('btn--placing-new-note', this.isActive)
  }

  /**
   * Check if editing is allowed.
   */
  canEdit() {
    const ctx = getCurrentDrawContext()
    return ctx && ctx.canEdit
  }

  toggle() {
    const result = toggle_placing_note()
    if (result !== undefined) {
      this.isActive = result
      if (this.btn) {
        this.btn.classList.toggle('btn--placing-new-note', this.isActive)
      }
    }
  }

  enable() {
    if (!this.canEdit()) return
    start_placing_note()
    // Assume success since canEdit passed
    this.isActive = true
    if (this.btn) {
      this.btn.classList.add('btn--placing-new-note')
    }
  }

  disable() {
    stop_placing_note()
    this.syncButton()
  }

  onTap({ target }) {
    // Click is now handled by direct event listener on button
    // This method is kept for compatibility but does nothing for button clicks
  }
}

const newNote = new NewNote()

export default newNote
