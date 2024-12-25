/**
 * Randomly shuffles an array in place using the Fisher-Yates algorithm.
 * @param {Array} arr - The array to shuffle.
 * @returns {Array} The shuffled array.
 */
export function shuffle(arr) {
  let i = arr.length
  if (i === 0) return arr
  while (--i) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = arr[i]
    const b = arr[j]
    arr[i] = b
    arr[j] = a
  }
  return arr
}

/**
 * Inserts an item into an array at a specified interval.
 * @param {Array} arr - The array to modify.
 * @param {*} item - The item to insert.
 * @param {number} interval - The interval at which to insert the item.
 * @returns {Array} A new array with the item inserted at the specified interval.
 */
export function insertEvery(arr, item, interval) {
  const result = []
  for (let i = 0; i < arr.length; i++) {
    result.push(arr[i])
    if ((i + 1) % interval === 0 && i !== arr.length - 1) {
      result.push(item)
    }
  }
  return result
}
