import { expArgs } from './utils'

export function wrapFn (fn) {
  return async function (..._args) {
    let args = await expArgs(this, _args)
    return await fn.apply(this, args)
  }
}

export function wrapObj (obj) {
  let w = {}
  let key, value, type
  for (key in obj) {
    value = obj[key]
    type = typeof value
    if (type === 'function') {
      value = wrapFn(value)
    } else if (type === 'object' && type !== null) {
      value = wrapObj(value)
    }
    w[key] = value
  }
  return w
}
