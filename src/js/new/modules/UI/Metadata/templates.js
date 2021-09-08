export const createRolesFields = (persNames) =>
  persNames.map(({ role, config, value }) => `
    <hr class="fly-out__hr">
    ${createField(role, config, value)}
    ${createUpdateBtn(role, config)}
  `).join('')

export const createField = (name, { label, placeholder = '' }, value = '') => `
  <label class="fillable fly-out__title" for="metadata-${name}">
      ${label}
      <input
          class="fillable__input"
          id="metadata-${name}"
          type="text"
          placeholder="${placeholder}"
          value="${value}"
      >
  </label>
`

export const createUpdateBtn = (name, { saveBtn }) => `
  <button
      class="btn btn--plain btn--small"
      id="metadata-${name}-assign"
      type="button"
      data-role="${name}"
  >${saveBtn}</button>
`
