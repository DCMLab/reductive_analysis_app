/**
 * Prevent an event and optionally run a callback.
 *
 * @param {Event} e Event.
 * @param {Function=} callback Function callback.
 * @returns {void}
 */
export function prevent(event, callback = null) {
  event.preventDefault()

  if (callback) {
    callback.call()
  }
}
