const { parse } = require('./parser')
const { tokenize } = require('./tokenizer')
const { evalAst, makeAPI } = require('./interpreter')

function getAst (code) {
  return parse(tokenize(code))
}

function run (env, code) {
  return evalAst(makeAPI(env))(getAst(code))
}

module.exports = {
  getAst,
  run,
}
