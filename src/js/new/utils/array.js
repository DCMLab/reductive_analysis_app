/**
 * Compare two arrays by looking at their primitives.
 */
export const sameArray = (a1, a2) => a1?.every(item => a2?.includes(item)) ?? false
