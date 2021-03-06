const { stringDelimiters } = require('./tokenizer')
const { reduceAsync } = require('./utils')

// evaluate a primitive expression
const exp = api => exp => {
  if (exp instanceof Array) {
    return api.evalAst(exp)
  } else if (!isNaN(exp)) { // is a number
    return ['atom', parseFloat(exp)]
  } else if (
    stringDelimiters.indexOf(exp[0]) !== -1
    && stringDelimiters.indexOf(exp[exp.length - 1]) !== -1
  ) {
    return ['atom', exp.slice(1, exp.length - 1)]
  } else { // constant
    let value = api.getValue(exp)
    if (value !== undefined) {
      return value
    } else {
      return api.evalAst(['throw', `"There are no name '${exp}' in the scope"`])
    }
  }
}

// evaluate a list (AST)
const evalAst = api => ast => {
  // () = null
  if (ast.length === 0) {
    api._popScope
    return ['atom', null]
  }
  let op = ast[0]
  let args = ast.slice(1, ast.length)
  if (!op) {
    return api.evalAst(['throw', `'Invalid operation in: ${ast}'`])
  }
  if (op instanceof Array) { // op expression
    op = api.exp(op)
    // lambda evaluation
    if (op[0] === 'fn') {
      return evaluateFn(api, 'lambda', op[1], args)
    } else if (op[0] === 'atom') {
      op = op[1]
    }
  }
  let fn = api.getValue(op)
  if (fn !== undefined && fn[0] === 'fn') {
    return evaluateFn(api, op, fn[1], args)
  } else if (api.env[op]) {
    return await api.env[op](api, args)
  } else if (atoms[op]) {
    return await atoms[op](api, args)
  } else {
    return api.evalAst(['throw', `'The operation is not defined: ${op}'`])
  }
}

function evaluateFn (api, name, [params, body], args) {
  api._pushScope()
  let argsVal = args.map(api.exp)
  for (let i = 0, len = params.length; i < len; i++) {
    if (argsVal[i] !== undefined) {
      api.setValue(params[i], argsVal[i])
    } else {
      return api.evalAst(['throw', `"Missing argument '${params[i]}' in function '${name}'"`])
    }
  }
  let result = api.exp(body)
  api._popScope()
  return result
}

const setValue = (api, stack) => (name, value) => {
  let scope = stack[stack.length - 1]
  scope[name] = value
}

const getValue = (api, stack) => name => {
  let scope, i = stack.length - 1
  while (scope = stack[i]) {
    if (scope.hasOwnProperty(name)) {
      return scope[name]
    }
    i--
  }
  if (api.env.hasOwnProperty(name)) {
    return api.env[name]
  }
  return undefined
}

const makeAPI = env => {
  let stack = []
  let path = []
  let api = {
    env: {
      ...constants,
      ...env,
    },
    _stack: stack,
    _pushScope: () => stack.push({}),
    _popScope: () => stack.pop(),
    _path: path,
    _pushPath: () => stack.push(0),
    _popPath: () => stack.pop(),
  }
  api.evalAst = evalAst(api)
  api.exp = exp(api)
  api.getValue = getValue(api, stack)
  api.setValue = setValue(api, stack)
  // Pausable stuff
  let stepEnd = () => new Promise ((res, rej) => {
    api.doStepEnd = res
  })
  const step = async value => {
    if (api.doStepEnd) {
      api.doStepEnd()
      api.doStepEnd = undefined
    }
    return new Promise((res, rej) => {
      api.doStep = () => {
        res()
        api.doStep = undefined
        return value
      }
    })
  }
  api.step = step
  api.stepEnd = stepEnd
  return api
}

module.exports = {
  makeAPI,
  getValue,
  evalAst,
  exp,
}

const constants = {
  'true': ['atom', true],
  'false': ['atom', false],
}

const atoms = {
  // Built in
  // ---- Special Forms
  process: (api, args) => {
    let result
    api._pushScope()
    for (let i = 0, len = args.length, arg; arg = args[i]; i++) {
      if (arg instanceof Array) {
        result = api.evalAst(arg)
      } else if (i === len - 1) {
        result = api.exp(arg)
      } else {
        return api.evalAst(['throw', `'process only can have lists as arguments'`])
      }
    }
    api._popScope()
    return result
  },
  // Constant definition
  def: (api, [name, exp]) => {
    if (name instanceof Array) {
      api.setValue(name[0], ['fn', [name.slice(1), exp]])
    } else {
      api.setValue(name, api.exp(exp))
    }
  },
  // Lambda definition
  lambda: (api, [params, body]) => {
    return ['fn', [params, body]]
  },
  // Function composition operator
  '.': (api, args) => {
    // `(pipe x y z) -> (fn (param) (x (y (z param))`
    return ['fn', [['param'], args.reduceRight((a, fn) => [fn, a], 'param')]]
  },
  // Inverse function composition operator
  'pipe': (api, args) => {
    // `(pipe x y z) -> (fn (param) (z (y (x param))`
    return ['fn', [['param'], args.reduce((a, fn) => [fn, a], 'param')]]
  },
  // JS Math
  Math: (api, args) => {
    let name = args[0]
    name = name[0] === '.' ? name.slice(1) : api.exp(name)[1]
    let subj = Math[name]
    return typeof subj === 'function'
    ? ['atom', subj.apply(null, args.slice(1).map(a => api.exp(a)[1]))]
    : ['atom', subj]
  },
  cond: (api, args) => {
    for (let i = 0, arg; arg = args[i]; i++) {
      if (arg[0] === 'else') {
        return api.exp(arg[1])
      } else if (api.exp(arg[0])[1]) {
        return api.exp(arg[1])
      }
    }
  },
  if: (api, [pred, con, alter]) => api.exp(pred)[1] ? api.exp(con) : api.exp(alter),
  // ----
  // Error handling 
  throw: (api, args) => {
    throw args.map(a => api.exp(a)[1]).join(' ')
  },
  // Mathematical
  '+': async (api, args) => await ['atom', reduceAsync(args, async (a, n, idx) => {
    await api.step(idx + 1)
    return a + await api.exp(n)[1]
  }, 0)],
  '-': (api, args) => ['atom', args.slice(1).reduce((a, n) => a - api.exp(n)[1], api.exp(args[0])[1])],
  '*': (api, args) => ['atom', args.reduce((a, n) => a * api.exp(n)[1], 1)],
  '/': (api, args) => ['atom', api.exp(args[0])[1] / args.slice(1).reduce((a, n) => a * api.exp(n)[1], 1)],
  // Logical
  '>': (api, args) => ['atom', api.exp(args[0])[1] > api.exp(args[1])[1]],
  '>=': (api, args) => ['atom', api.exp(args[0])[1] >= api.exp(args[1])[1]],
  '=': (api, args) => ['atom', api.exp(args[0])[1] == api.exp(args[1])[1]],
  '<': (api, args) => ['atom', api.exp(args[0])[1] < api.exp(args[1])[1]],
  '<=': (api, args) => ['atom', api.exp(args[0])[1] <= api.exp(args[1])],
  xor: (api, args) => ['atom', api.exp(args[0])[1] ^ api.exp(args[1])[1]],
  not: (api, args) => ['atom', !api.exp(args[0])[1]],
  and: (api, args) => ['atom', args.reduce((a, n) => a && api.exp(n)[1], true)],
  or: (api, args) => ['atom',  args.reduce((a, n) => a || api.exp(n)[1], false)],
  // Strings
  cat: (api, args) => ['atom', args.reduce((a, n) => a + api.exp(n)[1], '')],
  // Key-Value structure
  kv: (api, args) => {
    let obj = {}
    let evArgs = args.map((a, idx) => (idx % 2 === 1 || a instanceof Array) ? api.exp(a)[1] : a)
    for (let i = 0, len = evArgs.length; i < len; i += 2) {
      obj[evArgs[i]] = evArgs[i + 1]
    }
    return ['atom', obj]
  },
  // List structure
  ls: (api, args) => ['atom', args.map(a => api.exp(a)[1])],
}
