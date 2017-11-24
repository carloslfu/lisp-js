
module.exports = {
  reduceAsync: async (arr, fn, v0) => {
    for (let i = 0, len = arr.length; i < len; i++) {
      v0 = await fn(v0, arr[i], i)
    }
    return v0
  },
}
