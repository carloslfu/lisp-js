const { parse } = require('./parser')
const { tokenize } = require('./tokenizer')
const { evalAst, makeAPI } = require('./interpreter')

function getAst (code) {
  return parse(tokenize(code))
}

const run = env => {
  let _evalAst = evalAst(makeAPI(env))
  return code => _evalAst(getAst(code))
}

module.exports = {
  getAst,
  run,
}
