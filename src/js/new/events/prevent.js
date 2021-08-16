export function prevent(e, callback = null) {
  e.preventDefault()

  if (callback) {
    callback.call()
  }
}
