// https://github.com/grimmdude/MidiPlayerJS
// https://github.com/danigb/soundfont-player

import MidiPlayer from 'midi-player-js'
import Soundfont from 'soundfont-player'
import { getOrigMidi } from '../../../app'

const audioContext = new AudioContext()
let midiPlayer

class Player {
  constructor() {
    this.midiId = null // active track
    this.playbackPosition = 0

    // DOM elements
    this.playBtn = document.getElementById('play-button')
    this.pauseBtn = document.getElementById('pause-button')
    this.stopBtn = document.getElementById('stop-button')

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

  // Playback control

  play() {
    if (this.playbackPosition) {
      midiPlayer.skipToTick(this.playbackPosition) // resume playback
    }

    midiPlayer.play()
  }

  stop() {
    midiPlayer.stop()
    this.playbackPosition = 0
  }

  pause() {
    this.playbackPosition = midiPlayer.getCurrentTick()
    midiPlayer.pause()
  }

  // Events

  onTap({ target }) {

    // Play button

    if (target == this.playBtn && !midiPlayer.isPlaying()) {
      const base64Midi = getOrigMidi() // maybe should only be done once by music score load
      if (this.midiId != 'original') {
        this.loadSound(base64Midi, 'original')
      }
      this.play()
      return
    }

    // Pause button

    if (target == this.pauseBtn && midiPlayer.isPlaying()) {
      this.pause()
      return
    }

    // Stop button

    if (target == this.stopBtn && midiPlayer.isPlaying()) {
      this.stop()
    }
  }

  init() {
    Soundfont.instrument(audioContext, '/instruments/acoustic-grand-piano-mp3.js')
      .then(instrument => {
        midiPlayer = new MidiPlayer.Player(event => {
          if (event.name == 'Note on' && event.velocity > 0) {
            instrument.play(event.noteName, audioContext.currentTime, {
              gain: event.velocity / 100
            })
          }
        })
      })
  }
}

const player = new Player()

export default player
