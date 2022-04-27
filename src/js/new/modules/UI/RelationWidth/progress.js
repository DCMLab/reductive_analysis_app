import { clamp, round } from '../../../utils/math'

export default class Progress {
  constructor(idPrefix = '', options) {
    this.ctn = document.getElementById(`${idPrefix}-progress-ctn`)

    this.setMinMax(options)
    this.update(options.value)
  }

  setMinMax({ min, max }) {
    this.min = parseInt(min)
    this.max = parseInt(max)
  }

  update(value = this.value) {
    value = parseFloat(value)

    let progress = (value - this.min) / (this.max - this.min)
    progress = round(progress, 3)
    this.setBar(progress)
  }

  setBar(ratio) {
    this.ctn.style.setProperty('--progress', clamp(0, ratio, 1))
  }
}
