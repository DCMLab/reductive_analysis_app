import { getCurrentDrawContext } from '../../../../ui'
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

    // add sprite to the score
    const bookmarkIcon = createBookmarkElement({
      id: bookmarkId,
      x: parseInt(noteHead.getAttribute('x')) + 11,
      y: parseInt(noteHead.getAttribute('y')) - 500,
      noteId: note.id,
      contextId: context.id_prefix || 0,
    })

    context.svg_elem.querySelector('.page-margin').insertAdjacentHTML('beforeend', bookmarkIcon)

    // reference the bookmark in the note
    note.dataset.bookmarkId = bookmarkId

    const bookmark = context.svg_elem.querySelector(`#${bookmarkId}`)

    // update bookmarks list and count
    this.items.push(bookmark)
    this.items.sort((a, b) => {
      const xa = parseInt(a.getAttribute('x'))
      const xb = parseInt(b.getAttribute('x'))
      const ya = parseInt(a.getAttribute('y'))
      const yb = parseInt(b.getAttribute('y'))

      return xa != xb ? xa - xb : ya - yb
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

    // Next

    if (dir > 0) {
      targetBookmark = this.currentContextItems.find(bookmark => {
        rect = getDOMRect(bookmark, ['top', 'right', 'bottom', 'left'])

        return rect.right > viewport.w // out of the viewport right side
          || (
            // or at the right of the viewport middle
            rect.left > (viewport.w / 2)

            // and outside of it vertically
            && (rect.bottom > viewport.h || rect.top < 0)
          )
      })
    }

    // Previous

    if (dir < 0) {
      this.items.reverse()

      targetBookmark = this.currentContextItems.find(bookmark => {
        rect = getDOMRect(bookmark, ['top', 'right', 'bottom', 'left'])

        return rect.left < 0// out of the viewport left side
          || (
            // or at the right of the viewport middle
            rect.left < (viewport.w / 2) // (should substract bookmark width…)

            // and outside of it vertically
            && (rect.bottom > viewport.h || rect.top < 0)
          )
      })

      this.items.reverse()
    }

    // If there’s no next/previous bookmark, we loop to the first/last.
    if (!targetBookmark) {
      targetBookmark = dir > 0
        ? this.currentContextItems[0] // first
        : this.currentContextItems[this.count - 1] // last

      rect = getDOMRect(targetBookmark, ['top', 'left'])

      // revert scroll direction in `doc.scrollBy`
      dir = dir * -1
    }

    // This 👇 is the prefered method, but Safari fails (see next comment).

    // targetBookmark?.scrollIntoView({ block: 'center', inline: 'center' })

    /**
     * This 👇 is roughly the same as this 👆, but this 👆 on Safari only works
     * when the wanted bookmark is on the right or the bottom. Top and left
     * are ignored.
     *
     * A reduce test case (https://codepen.io/meduzen/details/GRyPdaJ) couldn’t
     * reproduce the issue, so maybe it’s related to having a SVG in another
     * one, or maybe the transform applied to the parent SVG.
     */
    doc.scrollBy(
      rect.left + (window.innerWidth / 2 * dir),
      rect.top + (window.innerHeight / 2 * dir)
    )
  }

  init() {
    this.btn = document.getElementById('bookmark-note')
    this.items = []
  }
}

const bookmarks = new Bookmarks()

export default bookmarks
