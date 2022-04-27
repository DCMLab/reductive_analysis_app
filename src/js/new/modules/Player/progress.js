import { clamp, round } from '../../utils/math'

export default class ProgressBar {
  constructor(idPrefix = '') {
    this.ctn = document.getElementById(`${idPrefix}-progress-ctn`)

    // <progress>
    this.el = document.getElementById(`${idPrefix}-progress`)

    // Label elements
    this.doneEl = document.getElementById(`${idPrefix}-progress-done`)
    this.maxEl = document.getElementById(`${idPrefix}-progress-max`)

    this.reset()
  }

  update(done = this.done, max = this.max) {
    if (max <= 0) { return this.reset() }

    this.done = done
    this.max = max

    this.el.max = max
    this.el.value = done
    this.el.innerHTML = `${done} / ${max}`

    // Convert progress to ratio (between 0 and 1).
    const progress = round(this.el.position, 3)
    this.setBar(progress)

    this.updateLabel()
  }

  setBar(ratio) {
    this.ctn.style.setProperty('--progress', clamp(0, ratio, 1))
  }

  updateLabel() {
    this.doneEl.innerHTML = this.formatTime(this.done)
    this.maxEl.innerHTML = this.formatTime(this.max)
  }

  // Example: `63` (seconds) becomes `1:03`
  formatTime(seconds) {
    seconds = round(seconds) // drop milliseconds

    const minutes = Math.floor(seconds / 60)
    seconds = seconds % 60

    return `${p(minutes)}:${p(seconds)}`
  }

  reset() {
    this.el.innerHTML = ''
    this.el.removeAttribute('value') // make it `:indeterminate` (CSS)
    this.el.removeAttribute('max')

    this.setBar(0)

    this.done = 0
    this.max = 0
  }
}

/**
 * padStart a stringable variable by the provided number of 0.
 *
 * @param {*} value A stringable value (string, number…).
 * @param {number=} [length=2] The number of 0 at the beginning of the result.
 * @returns {string}
 */
const p = (value, length = 2) => value.toString().padStart(length, '0')
