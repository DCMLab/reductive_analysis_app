// Convert numbers to rem length (e.g. `165` become `16.5rem`)

export const pxToRem = unitlessPx => unitlessPx / 10 + 'rem'
