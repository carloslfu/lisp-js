import { openListDelimiters, closeListDelimiters } from './tokenizer'

// A node can be a list, atom, number, string
export function parse (tokens) {
  let list
  let path = []
  for (let i = 0, token; token = tokens[i]; i++) {
    if (openListDelimiters.indexOf(token) !== -1) {
      if (!list) {
        list = []
      } else {
        setPath([], path, list)
      }
      path.push(0)
    } else if (closeListDelimiters.indexOf(token) !== -1) {
      path.pop()
      path[path.length - 1]++
    } else {
      setPath(token, path, list)
      path[path.length - 1]++
    }
  }
  return list
}

export function getPath (path, tree) {
  let value = tree
  for (let i = 0, len = path.length; i < len; i++) {
    value = value[path[i]]
  }
  return value
}

export function setPath (value, path, tree) {
  getPath(path.slice(0, path.length - 1), tree)[path[path.length - 1]] = value
  return tree
}
