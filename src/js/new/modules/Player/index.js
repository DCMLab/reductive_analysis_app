// https://github.com/grimmdude/MidiPlayerJS
// https://github.com/danigb/soundfont-player

import MidiPlayer from 'midi-player-js'
import Soundfont from 'soundfont-player'
import { getOrigMidi } from '../../../app'
import { setAttributes } from '../../utils/dom'
import { clamp, round } from '../../utils/math'
import ProgressBar from './progress'

const audioContext = new AudioContext()
let midiPlayer

class Player {
  constructor() {
    this.midiId = null // active track
    this.playhead = 0 // playback position, not in seconds but in “ticks”
    this.instrument // the soundfont player
    this.status = 'paused' // 'playing', 'paused', or 'stopped'
    this.activeNotes = {} // notes that are currently being played

    // DOM elements
    this.ctn = document.getElementById('player')
    this.playPauseBtn = document.getElementById('player-play-pause')
    this.stopBtn = document.getElementById('player-stop')
    this.timelineRange = document.getElementById('player-timeline-input')

    this.init()
  }

  // Load Base64 midi into the player.

  loadSound(midi, id = '') {
    if (this.midiId != id) {
      this.stop()
      this.midiId = id
    }

    midiPlayer.loadDataUri(`data:audio/midi;base64,${midi}`)

    /**
     * Alternative method to pass the midi to the player. It requires to
     * `import { decode } from 'base64-arraybuffer'`. Let’s keep this
     * comment in case we figure out that `midi-player-js` doesn’t
     * properly decode base64.
     */
    // midiPlayer.loadArrayBuffer(decode(midi))
  }

  // Events

  onTap({ target }) {

    // Play/pause button

    if (target == this.playPauseBtn) {

      // Pause
      if (midiPlayer.isPlaying()) {
        return this.pause()
      }

      //  Play
      const base64Midi = getOrigMidi()
      if (this.midiId != 'original') {
        this.loadSound(base64Midi, 'original')
      }

      return this.play()
    }

    // Stop button

    if (target == this.stopBtn && this.status != 'stopped') {
      this.stop()
    }
  }

  onChange({ target }) {

    // Timeline control

    if (target == this.timelineRange) {
      midiPlayer.skipToSeconds(target.value).play()
    }
  }

  // Update progress bar

  updateProgress() {

    /**
     * Duration and remaining time are `NaN` between the moment play is clicked
     * and the first tick, hence the additional checks.
     */
    let duration = midiPlayer.getSongTime()
    let remainingTime = midiPlayer.getSongTimeRemaining()

    if (isNaN(duration) || isNaN(remainingTime)) {
      duration = 0
      remainingTime = 0
    }

    /**
     * There’s probably a bug in midi-player-js (or in the Verovio toolkit)
     * causing the remaining time to be bigger than the duration. Likely
     * an issue with `getSongTimeRemaining()`. Should be reported on:
     * https://github.com/grimmdude/MidiPlayerJS. In the meantime,
     * `clamp()` makes sure it stays in the boundaries [0, xx].
     */
    remainingTime = clamp(remainingTime, 0, duration)

    const elapsedTime = round(duration - remainingTime, 2)

    this.progressBar.update(elapsedTime, duration)

    // Update range input attributes.
    this.timelineRange.setAttribute('max', duration)
    this.timelineRange.setAttribute('value', elapsedTime)
  }

  // Playback control

  play() {
    if (this.playhead) {
      midiPlayer.skipToTick(this.playhead) // resume playback
    }

    midiPlayer.play()

    this.updateControls('playing')
  }

  stop() {
    midiPlayer.stop()
    this.instrument.stop()
    this.updateProgress()
    this.playhead = 0

    this.updateControls('stopped')
  }

  pause() {
    this.playhead = midiPlayer.getCurrentTick()
    this.instrument.stop()
    midiPlayer.pause()

    this.updateControls('paused')
  }

  updateControls(newStatus) {
    this.status = newStatus

    // Update play/pause HTML

    let playingLabel = newStatus == 'playing' ? 'Pause' : 'Play'
    playingLabel = this.playPauseBtn.dataset[`label${playingLabel}`]

    setAttributes(this.playPauseBtn, {
      title: playingLabel,
      ariaLabel: playingLabel,
    });

    // Swap play/pause icons

    ['stopped', 'playing', 'paused'].forEach(status =>
      this.ctn.classList.toggle(`player--${status}`, newStatus == status)
    )
  }

  init() {
    Soundfont.instrument(audioContext, './instruments/acoustic-grand-piano-mp3.js')
      .then(instrument => {
        this.instrument = instrument
        midiPlayer = new MidiPlayer.Player(event => {
          const noteKey = event.noteName + event.track

          if (event.name == 'Note on' && event.velocity > 0) {
            this.activeNotes[noteKey] = instrument.play(event.noteNumber, audioContext.currentTime, {
              gain: event.velocity / 127,
            })
          } else if (
            event.name == 'Note off' ||
            (event.name == 'Note on' && event.velocity == 0) // synonym of `Note off`
          ) {
	          this.activeNotes[noteKey]?.stop()
	        }

          this.updateProgress()
        })

        midiPlayer.on('endOfFile', () => this.stop())
      })

    this.updateControls('stopped')
    this.progressBar = new ProgressBar('player')
  }

  reset() {
    this.stop()
    this.midiId = null
    this.activeNotes = {}
  }
}

const player = new Player()

export default player
