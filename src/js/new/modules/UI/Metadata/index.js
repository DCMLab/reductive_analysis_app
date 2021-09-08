// MEI Metadata spec: https://music-encoding.org/guidelines/v4/content/metadata.html
import { get_by_id, get_id } from '../../../../utils'
import score from '../../Score'
import config from './config'
import { createField, createRolesFields, createUpdateBtn } from './templates'

const parser = new DOMParser()

// Assign button id looks like `metadata-something-assign`
const assignBtnRegex = new RegExp(/^metadata-\w+-assign$/)

class Metadata {
  constructor() {
    this.visible = false
    this.ctn = document.getElementById('metadata')
    this.toggleBtn = document.getElementById('metadata-toggle')

    this.persRoles = Object.keys(config.roles)

    // Form DOM elements
    this.formDOM = {
      ctn: document.getElementById('metadata-form'),
    }

    this.formDOM.inputs = this.formDOM.ctn.getElementsByClassName('fillable__input')

    // Score DOM elements
    this.scoreHead = {
      titleStmt: null,
      title: null,
      respStmt: null,
      respPersName: [],
    }
  }

  /**
   * Events and related actions
   */

  onTap({ target }) {

    // Open/close metadata form
    if (target == this.toggleBtn) {
      return this.toggle()
    }

    // Update a metadata
    if (assignBtnRegex.test(target.id)) {
      const name = target.id.replace('metadata-', '').replace('-assign', '')
      this.updateScoreMetadata(name)
    }
  }

  onScoreLoad() {
    this.initScore()
    this.initFields()
  }

  toggle(state = !this.visible) {
    this.visible = state
    this.ctn.classList.toggle('fly-out--expanded', state)
    this.ctn.classList.toggle('fly-out--collapsed', !state)
  }

  updateScoreMetadata(name) {
    const field = [...this.formDOM.inputs].find(({ id }) => id = `metadata-${name}`)
    if (!field) { return }

    const value = field.value

    // The metadata is the title

    if (name == 'title') {
      this.scoreHead.title[0].innerHTML = value
      return
    }

    // The metadata is a role

    const role = this.persNames.find(pers => pers.role == name)
    role.value = value
    role.el.innerHTML = value

    if (name == 'composer') { return }

    // For other roles than composer, add resp. name on a note or a relation.

    score.flatSelection.forEach(el => {
      const meiId = get_id(el)
      const meiEl = get_by_id(score.mei, meiId)

      // A <note> or the <label> inside <node [type="(meta)relation"]>.
      const target = meiEl.tagName == 'note'
        ? meiEl
        : meiEl.firstChild

      target.setAttribute('resp', name)
    })
  }

  /**
   * Initialization methods
   */

  initScore() {

    // MEI XML structure is documented in `./config.js`.
    this.scoreHead.titleStmt = score.mei.querySelector('meiHead fileDesc titleStmt')
    if (!this.scoreHead.titleStmt) { return }

    // Initialize <title>, <respStmt> and its content (the roles).

    this.initStmtEl('title')
    this.initStmtEl('respStmt')
    this.initRoles()
  }

  // Get/create direct children of <titleStmt> (title or Stmt)

  initStmtEl(name) {
    this.scoreHead[name] = this.scoreHead.titleStmt.getElementsByTagName(name)

    if (!this.scoreHead[name].length) {
      const el = score.mei.createElement(name)
      this.scoreHead.titleStmt.appendChild(el)
    }
  }

  // Get roles

  initRoles() {
    this.scoreHead.respPersName = this.scoreHead.respStmt[0].getElementsByTagName('persName')

    this.persNames = Array.from(this.scoreHead.respPersName)
      .filter(pers => this.persRoles.includes(pers.getAttribute('role')))
      .map(pers => ({
        el: pers,
        role: pers.getAttribute('role'),
        value: pers.innerHTML,
        config: config.roles[pers.getAttribute('role')]
      }))

    // Find and initialize missing roles
    this.persRoles
      .filter(role => !this.persNames.find(pers => pers.role == role))
      .forEach(role => this.initRole(role))
  }

  // Add freshly-created element in score for the missing role.

  initRole(role) {
    const missingRoleEl = parser.parseFromString(`<persName role="${role}" xml:id="${role}" />`, 'text/xml').firstChild
    this.scoreHead.respStmt[0].appendChild(missingRoleEl)

    this.persNames.push({
      el: missingRoleEl,
      role,
      value: '',
      config: config.roles[role]
    })
  }

  // Add all metadata fields to the metadata form.

  initFields() {
    this.formDOM.ctn.innerHTML =
      createField('title', config.title, this.scoreHead.title[0].innerHTML)
      + createUpdateBtn('title', config.title)
      + createRolesFields(this.persNames)
  }
}

const metadata = new Metadata()

export default metadata
