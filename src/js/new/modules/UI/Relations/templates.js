import { capitalize } from '../../../utils/string'

const CSS = {
  hideIfCompact: 'hide-when-compact',
  hideIfNotCompact: 'hide-when-not-compact',
}

// Add group title

export const createTitle = name => `
  <div class="fly-out__headerRow">
      <div class="fly-out__title fly-out__title--big">
          ${capitalize(name)}s
      </div>
  </div>
`

// Add relation <button>

export const createBtn = (name, type, index) => `
  <button
      type="button"
      class="
        btn btn--hollow btn--relation color-relation-${name}
        ${index > 2 ? CSS.hideIfCompact : ''}
      "
      data-relation-name="${name}"
      data-relation-type="${type}"
  >
      ${capitalize(name)}
  </button>
`

// Show more <button>

export const createShowMoreBtn = type => `
  <button
      type="button"
      class="fly-out__secondaryBtn fly-out__showMore ${CSS.hideIfNotCompact} | btn btn--hollow"
      title="View more ${type}"
  >
      <span class="visually-hidden">View more ${type}</span>
      &hellip;
  </button>
`

export const createDatalistFillable = (config, type) => `
  <form
      class="btn-group btn-group--free-field hide-when-compact"
      id="free-field-${type}-form"
  >
      ${createFillable(type, { label: 'Or type a ' + config.name })}
      ${createDatalist(config.additional, type)}

      <button class="btn btn--plain btn--small">
          Assign <span class="visually-hidden">${type}</span>
      </button>
  </form>
`

const createFillable = (id, { label, placeholder = '' }) => `
  <label
      class="fillable fly-out__relationsField ${CSS.hideIfCompact}"
      for="free-field-${id}"
  >
      <span class="fillable__label">
          <span class="fillable__label__text">${label}</span>
          <svg class="fillable__label__triangle | btn__icon" width="10" height="8">
              <use href="#triangle-path"/>
          </svg>
      </span>

      <input
          class="fillable__input"
          id="free-field-${id}"
          type="text"
          list="datalist-${id}"
          placeholder="${label}"
          data-relation-type="${id}"
      >
  </label>
`

const createDatalist = (types, id) => `
  <datalist id="datalist-${id}">${createOptions(types)}</datalist>
`

const createOptions = options => options.map(createOption).join('')
const createOption = value => `<option value="${value}">`

/**
 * Two optional functions, not needed right now:
 * - createDatalist: alternate implementation requiring wrapHtmlIn
 * - wrapHtmlin: wrap any string with HTML tag + attributes (passed as object)
 */

// export const createDatalist = (types, id) => wrapHtmlIn(createOptions(types), 'datalist', {
//   id: `datalist-${id}`
// })

// const wrapHtmlIn = (htmlString, elementTag, attributes = {}) => {
//   attributes = Object.entries(attributes).map(attr => `${attr[0]}="${attr[1]}"`).join(' ')
//   return `<${elementTag} ${attributes}>${htmlString}</${elementTag}>`
// }
