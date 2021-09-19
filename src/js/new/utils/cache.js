/**
 * An extension of Map to use it as a cache.
 */
export class CacheMap extends Map {

  /**
   * Add a cache entry if one with the specified name doesn’t already exist.
   *
   * @param {string} key
   * @param {*} value
   * @returns CacheMap
   */
  setIfNew = (key, value) => this.has(key) ? this : this.set(key, value)
}
