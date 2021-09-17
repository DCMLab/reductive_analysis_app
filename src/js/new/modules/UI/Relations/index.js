import { do_relation } from '../../../../app'

import DraggableFlyOut from '../DraggableFlyOut'

class RelationsFlyOut extends DraggableFlyOut {
  constructor() {
    super('relations-menu')

    this.relationsBtns = this.ctn.el.getElementsByClassName('btn--relation')
  }


  onTap(e) {
    super.onTap(e)

    if (e.target.classList.contains('btn--relation')) {
      do_relation(e.target.dataset.relationType)
    }
  }
}

const relationsMenu = new RelationsFlyOut()

export default relationsMenu
