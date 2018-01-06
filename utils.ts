
export const reduceAsync = async (arr, fn, v0) => {
  for (let i = 0, len = arr.length; i < len; i++) {
    v0 = await fn(v0, arr[i], i)
  }
  return v0
}

export const reduceRightAsync = async (arr, fn, v0) => {
  for (let i = arr.length - 1; i >= 0; i--) {
    v0 = await fn(v0, arr[i], i)
  }
  return v0
}

export const mapAsync = async (arr, fn) => {
  let res = []
  for (let i = 0, len = arr.length; i < len; i++) {
    res.push(await fn(arr[i], i))
  }
  return res
}

export const expArgs = async (api, args) => {
  return await mapAsync(args, async a => await api.exp(a))
}
