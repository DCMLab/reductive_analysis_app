import { capitalize } from '../../../utils/string'

// Add relation <button>

export const createBtn = (name, type) => `
  <button
      type="button"
      class="btn btn--hollow btn--relation color-relation-${name}"
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
      class="fly-out__showMore | btn btn--hollow"
      data-relation-type="${type}"
  >
      <span class="visually-hidden">View more ${type}</span>
      &hellip;
  </button>
`

export const createSeparator = () => `<hr class="fly-out__hr" style="
flex: 1 0 100%;
">`

export const createFillable = (id, { label, placeholder = '' }) => `
  <label class="fillable fly-out__title" for="free-field-${id}">
      <span class="fillable__label">
          ${label}
          <svg class="fillable__label__triangle | btn__icon" width="10" height="8">
              <use xlink:href="#triangle-path"/>
          </svg>
      </span>

      <input
          class="fillable__input"
          id="free-field-${id}"
          type="text"
          list="datalist-${id}"
          placeholder="${placeholder}"
          data-relation-type="${id}"
      >
  </label>
`

export const createDatalist = (types, id) => `
  <datalist id="datalist-${id}">${createOptions(types)}</datalist>
`

const createOptions = options => options.map(createOption).join('')
const createOption = value => `<option value="${value}">`

/**
 * Two optional functions, not needed right now:
 * - createDatalist: alternate implementation requiring wrapHtmlIn
 * - wraHtmlin: wrap any string with HTML tag + attributes (passed as object)
 */

// export const createDatalist = (types, id) => wrapHtmlIn(createOptions(types), 'datalist', {
//   id: `datalist-${id}`
// })

// const wrapHtmlIn = (htmlString, elementTag, attributes = {}) => {
//   attributes = Object.entries(attributes).map(attr => `${attr[0]}="${attr[1]}"`).join(' ')
//   return `<${elementTag} ${attributes}>${htmlString}</${elementTag}>`
// }
