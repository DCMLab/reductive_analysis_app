import { captureEvent } from './options'
import debounceResize from './resize'

class EventsManager {
  constructor(app) {
    this.app = app

    this.init()
  }

  init() {
    window.addEventListener('resize', this.onResize.bind(this))
    document.addEventListener('click', this.onTap.bind(this), captureEvent)

    // add :hover support in iOS ¯\_(ツ)_/¯
    document.addEventListener('touchstart', () => {})

    // fields
    document.addEventListener('change', this.onChange.bind(this), captureEvent)

    // core app events
    document.addEventListener('undoredo', this.onUndoRedo.bind(this))
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
  }

  onUndoRedo(e) {
    this.app.history?.onUndoRedo(e)
  }
}

export default app => new EventsManager(app)
