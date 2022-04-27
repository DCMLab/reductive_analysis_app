export const isNote = element => element?.classList?.contains('note')
export const isRelation = element => element?.classList?.contains('relation')

export const isMetaRelationCircle = element =>
  element.tagName == 'circle'
  && element.parentElement?.classList.contains('metarelation')

export const getRelationType = element => element.getAttribute('type')
