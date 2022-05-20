import { do_reduce_pre, undo_reduce } from '../../../../reductions'
import { getReducedMidi } from '../../../../ui'
import { getCurrentDrawContext } from '../../../../ui'
import player from '../../Player'

export default class Reductions {
  constructor(layers) {
    this.layers = layers

    this.ctn = document.getElementById('layers-menu-reductions')
    this.reduceBtn = document.getElementById('layers-menu-reduce')
    this.unreduceBtn = document.getElementById('layers-menu-unreduce')
    this.playReductionBtn = document.getElementById('layers-menu-play-reduction')
  }

  reduce = drawContext => do_reduce_pre(drawContext)

  unreduce = drawContext => undo_reduce(drawContext)

  play(drawContext) {
    const midi = getReducedMidi(drawContext)
    player.loadSound(midi, drawContext.id_prefix)
    player.play()
  }

  onTap(e) {
    if (!e.composedPath().includes(this.ctn)) { return }

    const currentLayerObject = getCurrentDrawContext() // use the current draw context
    
    if (e.target == this.reduceBtn) { return this.reduce(currentLayerObject) }
    if (e.target == this.unreduceBtn) { return this.unreduce(currentLayerObject) }
    if (e.target == this.playReductionBtn) { return this.play(currentLayerObject) }
  }
}
