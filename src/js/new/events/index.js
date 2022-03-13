import { isFieldFocused } from '../utils/forms'
import { isKey, isModifier, pressedModifiers, shortcutMeta } from './keyCodes'
import { captureEvent } from './options'
import MouseMoveTick from './mousemove'
import debounceResize from './resize'

class EventsManager {
  constructor(app) {
    this.app = app

    this.init()
  }

  init() {
    window.addEventListener('resize', this.onResize.bind(this))

    // mouse
    document.addEventListener('click', this.onTap.bind(this), captureEvent)
    document.addEventListener('mousedown', this.onTapStart.bind(this), captureEvent)
    document.addEventListener('mousemove', this.onMouseMove.bind(this), captureEvent)
    document.addEventListener('mouseup', this.onTapEnd.bind(this), captureEvent)

    // touch (`touchstart` also adds :hover support in iOS ¯\_(ツ)_/¯)
    document.addEventListener('touchstart', this.onTapStart.bind(this), captureEvent)
    document.addEventListener('touchmove', this.onTouchMove.bind(this), captureEvent)
    document.addEventListener('touchend', this.onTapEnd.bind(this), captureEvent)

    // keyboard
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))

    // fields
    document.addEventListener('change', this.onChange.bind(this), captureEvent)
    document.addEventListener('input', this.onInput.bind(this), captureEvent)
    document.addEventListener('submit', this.onSubmit.bind(this), captureEvent)

    // core app events
    document.addEventListener('undoredo', this.onUndoRedo.bind(this))
    document.addEventListener('scoreload', this.onScoreLoad.bind(this))
    document.addEventListener('scoreselection', this.onScoreSelection.bind(this))
  }

  // Browser events

  onResize() {
    debounceResize(() => {
      this.app.viewport?.onResize()
      this.app.ui?.onResize()
    })
  }

  /**
   * Mouse and touch events.
   *
   * For orders of events and how to prevent the sequence on touch, see:
   * https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Supporting_both_TouchEvent_and_MouseEvent#event_order
   */

  // Click event. It can happen with mouse and touch, so better name it tap!

  onTap(e) {
    this.app.score?.onTap(e)
    this.app.player?.onTap(e)
    this.app.ui?.onTap(e)
    this.app.history?.onTap(e)
  }

  /**
   * Common handlers for touch and mouse events.
   *
   * When the time will come to drop Safari 12.x support, consider using
   * pointer events:
   * - https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
   * - https://twitter.com/Mamboleoo/status/1432385635298521089
   */

  // touchstart, mousedown
  onTapStart(e) {
    this.app.ui?.onTapStart(e)
  }

  // touchend, mouseup
  onTapEnd() {
    this.app.ui?.onTapEnd()
  }

  // Mouse-only events

  onMouseMove(e) {
    MouseMoveTick.tick(e, ({ x, y }) => {
      this.app.ui?.onTapMove(x, y)
    })
  }

  // Touch-only events

  onTouchMove(e) {
    const touchCoordinates = {
      x: Math.round(e.touches[0].clientX),
      y: Math.round(e.touches[0].clientY),
    }

    MouseMoveTick.tick(touchCoordinates, ({ x, y }) => {
      this.app.ui?.onTapMove(x, y)
    })
  }

  // Forms events

  onChange(e) {
    this.app.player?.onChange(e)
    this.app.ui?.filters?.onChange(e)
    this.app.ui?.mainMenu?.onChange(e)
    this.app.ui?.startScreen?.onChange(e)
    this.app.ui?.selection?.mode?.onChange(e)
    this.app.ui?.layersMenu?.onChange(e)
  }

  onInput(e) {
    this.app.ui?.relationWidth?.onInput(e)
  }

  onSubmit(e) {
    this.app.ui?.relations?.onSubmit(e)
    this.app.ui?.layersMenu?.jsonTree?.onSubmit(e)
  }

  // App custom events

  onUndoRedo(e) {
    this.app.history?.onUndoRedo(e)
  }

  onScoreLoad(e) {
    this.app.score?.onScoreLoad(e)
    this.app.ui?.onScoreLoad(e)
    this.app.player?.reset()

    if (this.app.ui.startScreen) {
      this.app.ui.startScreen.destroy()
      delete this.app.ui.startScreen
    }
  }

  onScoreSelection(e) {
    this.app.score?.onScoreSelection(e)
    this.app.ui?.onScoreSelection(e)
  }

  // Keyboard events

  onKeyDown(e) {

    // Ignore keyboard shortcuts if a field is focused.
    if (isFieldFocused()) { return }

    /**
     * Redo (Cmd/Ctrl + Shift + Z)
     * Undo (Cmd/Ctrl + Z)
     */
    if (isKey(e, 'z')) {
      if (isModifier(e, [shortcutMeta, 'shift'])) {
        return this.app.history.redo()
      }

      if (isModifier(e, shortcutMeta)) {
        return this.app.history.undo()
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

    /**
     * Enable “New Note” cursor (Control)
     */
    if (isKey(e, 'control') && pressedModifiers(e).length === 1) {
      return this.app.ui.newNote.enable()
    }

    /**
     * Use primary selection (Shift)
     */
    if (isKey(e, 'shift') && pressedModifiers(e).length === 1) {
      return this.app.ui.selection.mode.set('primary')
    }

    // All shortcuts starting here don’t need modifiers.

    if (isModifier(e)) { return }

    /**
     * Toggle shades (H)
     */
    if (isKey(e, 'h')) {
      return this.app.ui.scoreSettings.toggleShades()
    }

    /**
     * Toggle stems (S)
     */
    if (isKey(e, 's')) {
      return this.app.ui.scoreSettings.toggleStems()
    }

    /**
     * Toggle “New Note” cursor (X)
     */
    if (isKey(e, 'x')) {
      return this.app.ui.newNote.toggle()
    }
  }

  onKeyUp(e) {
    /**
     * Enable “New Note” cursor (Control)
     */
    if (isKey(e, 'control')) {
      return this.app.ui.newNote.disable()
    }

    /**
     * Leave primary selection mode (Shift)
     */
    if (isKey(e, 'shift')) {
      return this.app.ui.selection.mode.set('secondary')
    }

    // All shortcuts starting here don’t need modifiers.

    if (isModifier(e)) { return }

    // Blur focused field (Escape)
    if (isKey(e, 'escape') && isFieldFocused()) {
      document.activeElement.blur()
    }
  }
}

export default app => new EventsManager(app)
