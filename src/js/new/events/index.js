import { captureEvent } from './options'
class EventsManager {
  constructor(app) {
    this.app = app
    this.init()
  }

  init() {
    document.addEventListener('click', this.onTap.bind(this), captureEvent)

    // add :hover support in iOS ¯\_(ツ)_/¯
    document.addEventListener('touchstart', () => {})

  }

  onTap(e) {
    this.app.player?.onTap(e)
  }
}

export default function(app) {
  return new EventsManager(app)
}
