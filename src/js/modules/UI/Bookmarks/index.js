import { getCurrentDrawContext } from '../utils/misc'
import { doc } from '../../../utils/document'
import { getDOMRect } from '../../../utils/dom'
import score from '../../Score'
import viewport from '../../Viewport'
import { isNote } from '../Selection/helpers'
import { createBookmarkElement } from './template'

class Bookmarks {
  constructor() {
    this.items = []
    this.previousBtn = document.getElementById('previous-bookmark')
    this.nextBtn = document.getElementById('next-bookmark')
    this.$count = document.getElementById('bookmarks-count')
  }

  get currentContextItems() {
    const context = getCurrentDrawContext()
    const contextId = parseInt(context.id_prefix || 0)
    return this.items.filter(
      bookmark => parseInt(bookmark.dataset.contextId) == contextId
    )
  }

  get count() {
    return this.currentContextItems.length
  }

  onTap({ target }) {
    if (target == this.btn) { return this.toggle() }
    if (target == this.previousBtn) { return this.toPrevious() }
    if (target == this.nextBtn) { return this.toNext() }
  }

  // Add or remove a note from the bookmarks
  toggle(note = score.lastSelected) {
    if (!isNote(note)) { return }

    const context = getCurrentDrawContext()
    const noteHead = note.children[0].children[0]

    // Remove note bookmark

    if (note.dataset.bookmarkId) {
      const existingBookmark = context.svg_elem.querySelector(`#${note.dataset.bookmarkId}`)

      // remove from bookmarks array
      this.items = this.items.filter(({ id }) => id != existingBookmark.id)

      // remove from DOM
      existingBookmark.remove()

      // remove from note
      delete note.dataset.bookmarkId

      return this.setCount()
    }

    // Add note bookmark

    const bookmarkId = `bookmark-${note.id}`

    let noteHeadTrans =
      noteHead
        .getAttribute('transform')
        .match(/translate\(\d+, \d+\)/)[0]
    let noteHeadX =
      noteHeadTrans
        .match(/\d+,/)[0]
        .slice(0, -1)
    let noteHeadY =
      noteHeadTrans
        .match(/, \d+/)[0]
        .slice(2)

    // add sprite to the score
    const bookmarkIcon = createBookmarkElement({
      id: bookmarkId,
      x: noteHeadX - 6,
      y: 0,
      noteId: note.id,
      contextId: context.id_prefix || 0,
    })

    context
      .svg_elem
      .querySelector('.page-margin')
      .insertAdjacentHTML('beforeend', bookmarkIcon)

    // reference the bookmark in the note
    note.dataset.bookmarkId = bookmarkId

    const bookmark = context.svg_elem.querySelector(`#${bookmarkId}`)

    // update bookmarks list and count
    this.items.push(bookmark)
    this.items.sort((a, b) => {
      const xa = parseInt(a.getElementsByTagName('path')[0].getAttribute('x'))
      const xb = parseInt(b.getElementsByTagName('path')[0].getAttribute('x'))

      return xa - xb
    })

    this.setCount()
  }

  setCount() {
    this.$count.innerHTML = this.count
    doc.classList.toggle('has-bookmarks-in-context', this.count)
    doc.classList.toggle('has-several-bookmarks-in-context', this.count > 1)
  }

  toPrevious() { this.goTo(-1) }
  toNext() { this.goTo(1) }

  goTo(dir = 1) {
    let targetBookmark = null
    let rect = null
    let view =
      document
        .getElementsByClassName('layer--active')[0]
        .getElementsByClassName('view')[0]

    if (!dir) return

    if (dir < 0) // For 'previous' lookup
      this.items.reverse()

    targetBookmark = this.currentContextItems.find(bookmark => {
      rect = getDOMRect(
        bookmark.getElementsByTagName('path')[0], ['left', 'right']
      )

      return dir > 0
        ? rect.left > (viewport.w / 2)
        : rect.right < 0
    })

    // Going to next bookmark but scroll is maxed
    if (
      dir > 0 &&
      (view.scrollLeft + viewport.w) >= view.scrollWidth
    ) {
      targetBookmark = null
    }

    if (dir < 0) // Reordering afterwards
      this.items.reverse()

    // If there’s no next/previous bookmark, we loop to the first/last.
    if (!targetBookmark) {
      targetBookmark = dir > 0
        ? this.currentContextItems[0] // first
        : this.currentContextItems[this.count - 1] // last

      rect = getDOMRect(
        targetBookmark.getElementsByTagName('path')[0], ['left']
      )

      // revert scroll direction in `doc.scrollBy`
      dir = dir * -1
    }

    console.log(this.currentContextItems())
    console.log('Target: ', targetBookmark)

    view.scrollBy({
      top: 0,
      left: rect.left - (viewport.w / 3),
      behavior: 'smooth',
    })
  }

  init() {
    this.btn = document.getElementById('bookmark-note')
    this.items = []
  }
}

const bookmarks = new Bookmarks()

export default bookmarks
