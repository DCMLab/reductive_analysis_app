import { reduce, unreduce } from '../utils/reductions'
import { getCurrentDrawContext } from '../utils/misc'

export default class Reductions {
  constructor(layers) {
    this.layers = layers

    this.ctn = document.getElementById('layers-menu-reductions')
    this.reduceBtn = document.getElementById('layers-menu-reduce')
    this.unreduceBtn = document.getElementById('layers-menu-unreduce')
  }

  reduce = () => reduce()

  unreduce = () => unreduce()

  onTap(e) {
    if (!e.composedPath().includes(this.ctn)) { return }

    const currentLayerObject = getCurrentDrawContext() // use the current draw context

    if (e.target == this.reduceBtn) { return this.reduce(currentLayerObject) }
    if (e.target == this.unreduceBtn) { return this.unreduce(currentLayerObject) }
  }
}
