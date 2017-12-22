import { parse } from './parser'
import { tokenize } from './tokenizer'
import { evalAst, makeAPI } from './interpreter'

export function getAst (code) {
  return parse(tokenize(code))
}

export const run = env => {
  let _evalAst = evalAst(makeAPI(env))
  return code => _evalAst(getAst(code))
}
