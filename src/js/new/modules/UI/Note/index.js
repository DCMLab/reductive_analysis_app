/**
 * @todo:
 * - update button styles when new note feat. is “active” (awaiting for design)
 * - hide the button when on the initial view (only works starting 2nd view)
 */

import {
  start_placing_note,
  stop_placing_note,
  toggle_placing_note,
} from '../../../../coordinates'

class NewNote {
  constructor() {
    this.btn = document.getElementById('new-note')
    this.isActive = false
  }

  /**
   * `toggle`, `enable` and `disable` should evolve when the related
   * x_placing_note functions are (at least partly) moved to this
   * file.
   */

  toggle() {
    this.isActive = toggle_placing_note() ?? false

    /**
     * @todo: update active styles of this button on press + kb shortcut
     */
    this.btn.classList.toggle('btn--something-active-for-new-note', this.isActive)
  }

  enable() {
    start_placing_note()
    this.btn.classList.add('btn--something-active-for-new-note')
    this.isActive = true
  }

  disable() {
    stop_placing_note()
    this.btn.classList.remove('btn--something-active-for-new-note')
    this.isActive = false
  }

  onTap({ target }) {
    if (target == this.btn) {
      this.toggle()
    }
  }
}

const newNote = new NewNote()

export default newNote
