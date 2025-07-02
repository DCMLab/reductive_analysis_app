/*
This file is part of MuseReduce, a webapp for graph-based musical analysis

Copyright (C) 2022  Petter Ericson, Yannis Rammos, Mehdi Merah, and the EPFL Digital and Cognitive Musicology Lab (DCML).

MuseReduce is free software: you can redistribute it and/or modify it under the terms of the Affero General Public License as published by the Free Software Foundation. MuseReduce is distributed without explicit or implicit warranty. See the Affero General Public License at https://www.gnu.org/licenses/agpl-3.0.en.html for more details.
*/
/**
 * An extension of Map to use it as a cache.
 */
export class CacheMap extends Map {

  /**
   * Adds a cache entry if the specified key is new in the cache.
   *
   * @param {string} key
   * @param {*} value
   * @returns {CacheMap}
   */
  add = (key, value) => this.has(key) ? this : this.set(key, value)

  /**
   * Adds a cache entry if the key is new in the cache, then returns the value.
   *
   * The provided value can be of any type, and can also be a function that
   * will only be executed if the key is new in the cache.
   *
   * @param {string} key
   * @param {*|function():*} value Value to cache or a function returning it.
   * @returns {*} Returns the `value` parameter.
   */
  remember = (key, value) => {
    if (typeof value == 'function') {
      value = this.has(key) ? this.get(key) : value()
    }

    this.add(key, value)
    return value
  }
}
