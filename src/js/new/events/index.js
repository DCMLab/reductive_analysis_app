import { isFieldFocused } from '../utils/forms'
import { isKey, isModifier, shortcutMeta } from './keyCodes'
import { captureEvent } from './options'
import debounceResize from './resize'

class EventsManager {
  constructor(app) {
    this.app = app

    this.init()
  }

  init() {
    window.addEventListener('resize', this.onResize.bind(this))

    // input
    document.addEventListener('click', this.onTap.bind(this), captureEvent)
    document.addEventListener('keydown', this.onKeyDown.bind(this))

    // add :hover support in iOS ¯\_(ツ)_/¯
    document.addEventListener('touchstart', () => {})

    // fields
    document.addEventListener('change', this.onChange.bind(this), captureEvent)

    // core app events
    document.addEventListener('undoredo', this.onUndoRedo.bind(this))
    document.addEventListener('scoreload', this.onScoreLoad.bind(this))
  }

  onResize() {
    debounceResize(() => {
      this.app.ui?.onResize()
    })
  }

  onTap(e) {
    this.app.player?.onTap(e)
    this.app.ui?.onTap(e)
    this.app.history?.onTap(e)
  }

  onChange(e) {
    this.app.player?.onChange(e)
    this.app.ui?.filters?.onChange(e)
  }

  onUndoRedo(e) {
    this.app.history?.onUndoRedo(e)
  }

  onScoreLoad(e) {
    this.app.ui?.onScoreLoad(e)
  }

  onKeyDown(e) {

    // Ignore keyboard shortcuts if a field is focused.
    if (isFieldFocused()) { return }

    /**
     * Undo (Cmd/Ctrl + Z)
     * Redo (Cmd/Ctrl + Shift + Z)
     */

    if (isKey(e, 'z')) {
      if (isModifier(e, shortcutMeta)) {
        return this.app.history.undo()
      }

      if (isModifier(e, [shortcutMeta, 'shift'])) {
        return this.app.history.redo()
      }
    }

    /**
     * Select all visible relations (Cmd/Ctrl + A)
     */

    if (isKey(e, 'a')) {
      if (isModifier(e, shortcutMeta)) {
        return this.app.ui.selection.selectAll()
      }
    }
  }
}

export default app => new EventsManager(app)
