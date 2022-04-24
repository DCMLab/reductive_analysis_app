import { doc } from '../../../utils/document'
import score from '../../Score'
import { isNote } from '../Selection/helpers'
import { createBookmarkElement } from './template'

class Bookmarks {
  constructor() {
    this.items = []
  }

  onTap({ target }) {
    if (target == this.btn) { return this.toggle() }
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
  }
    }
  }

  init() {
    this.btn = document.getElementById('bookmark-note')
  }
}

const bookmarks = new Bookmarks()

export default bookmarks
