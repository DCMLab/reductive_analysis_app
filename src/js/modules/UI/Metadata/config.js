/**
 * The config file for editable metadata.
 *
 * This is the score XML head structure containing title and roles:
 *  - meiHead
 *    - fileDesc
 *      - titleStmt
 *        - title // `title` in the config object below
 *        - respStmt // container of `roles` in the object below
 *          - persName[role="composer"]
 *          - persName[role="analyst"]
 *          - persName[role="annotator"]
 *          - persName[role="…"]
 *
 * The title and every roles below use the same config structure:
 *
 * `roleName`: { // the name of the role (kebab-case)
 *   - `label`: the label of the field;
 *   - `saveBtn`: the label of the button updating the metadata;
 *   - `placeholder`: (optional) the placeholder of the field.
 * }
 *
 * You can add as many role as you need. Refer to the spec:
 * https://music-encoding.org/guidelines/v4/content/metadata.html
 */
export default {
  title: {
    label: 'Title',
    saveBtn: 'Update',
    placeholder: '',
  },

  roles: {
    composer: {
      label: 'Composer',
      saveBtn: 'Update',
      placeholder: '',
    },
    analyst: {
      label: 'Analyst',
      saveBtn: 'Update',
      placeholder: '',
    },
    annotator: {
      label: 'Annotator',
      saveBtn: 'Update',
      placeholder: '',
    },
  },
}
