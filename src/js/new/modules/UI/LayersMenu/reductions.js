import { do_reduce_pre, undo_reduce } from '../../../../reductions'
import { getReducedMidi } from '../../../../ui'
import player from '../../Player'

export default class Reductions {
  static reduce = drawContext => do_reduce_pre(drawContext)

  static unreduce = drawContext => undo_reduce(drawContext)

  static play(drawContext) {
    const midi = getReducedMidi(drawContext)
    player.loadSound(midi, drawContext.id_prefix)
    player.play()
  }
}
