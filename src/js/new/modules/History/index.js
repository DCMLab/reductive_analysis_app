import { do_redo, do_undo } from '../../../undo_redo'

class History {
  constructor() {
    this.undoBtn = document.getElementById('undo')
    this.redoBtn = document.getElementById('redo')

    this.updateBtns(0, 0)
  }

  undo() {
    do_undo()
  }

  redo() {
    do_redo()
  }

  updateBtns(undoAbleCount = 0, redoAbleCount = 0) {
    this.undoBtn.toggleAttribute('disabled', undoAbleCount == 0)
    this.redoBtn.toggleAttribute('disabled', redoAbleCount == 0)
  }

  onTap({ target }) {

    // Undo

    if (target == this.undoBtn) {
      this.undo()
      return
    }

    // Redo

    if (target == this.redoBtn) {
      this.redo()
      return
    }
  }

  onUndoRedo({ detail }) {
    this.updateBtns(detail.undoAbleCount, detail.redoAbleCount)
  }
}

const history = new History()

export default history
