import { stringDelimiters } from './tokenizer'
import { expArgs, mapAsync, reduceAsync } from './utils'

// evaluate a primitive expression
export const exp =  api => async exp => {
  if (exp instanceof Array) {
    return await api.evalAst(exp)
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
      return await api.evalAst(['throw', `"There are no name '${exp}' in the scope"`])
    }
  }
}

// evaluate a list (AST)
export const evalAst = api => async ast => {
  // () = null
  if (ast.length === 0) {
    return ['atom', null]
  }
  let op = ast[0]
  let args = ast.slice(1, ast.length)
  if (!op) {
    return await api.evalAst(['throw', `'Invalid operation in: ${ast}'`])
  }
  if (op instanceof Array) { // op expression
    op = await api.exp(op)
    // lambda evaluation
    if (op[0] === 'fn') {
      return await evaluateFn(api, 'lambda', op[1], args)
    } else if (op[0] === 'atom') {
      op = op[1]
    }
  }
  let fn = api.getValue(op)
  if (fn !== undefined) {
    if (fn[0] === 'fn') {
      return await evaluateFn(api, op, fn[1], args)
    } else if (typeof fn === 'function') {
      return await fn(api, args)
    } else {
      return await api.evalAst(['throw', `'The operation is not valid: ${op}'`])
    }
  } else {
    return await api.evalAst(['throw', `'The operation is not defined: ${op}'`])
  }
}

export async function evaluateFn (api, name, [params, body], args) {
  api._pushScope()
  let argsVal = await mapAsync(args, api.exp)
  if (params instanceof Array) {
    for (let i = 0, len = params.length; i < len; i++) {
      if (argsVal[i] !== undefined) {
        api.setValue(params[i], argsVal[i])
      } else {
        return await api.evalAst(['throw', `"Missing argument '${params[i]}' in function '${name}'"`])
      }
    }
  } else {
    if (argsVal[0] !== undefined) {
      api.setValue(params, argsVal[0])
    } else {
      return await await api.evalAst(['throw', `"Missing argument '${params[0]}' in function '${name}'"`])
    }
  }
  let result = await api.exp(body)
  api._popScope()
  return result
}

export const setValue = (api, stack) => (name, value) => {
  let scope = stack[stack.length - 1]
  scope[name] = value
}

export const getValue = (api, stack) => name => {
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

export const makeAPI = env => {
  let stack = []
  let api: any = {
    env: {
      ...constants,
      ...atoms,
      ...env,
    },
    _pushScope: () => stack.push({}),
    _popScope: () => stack.pop(),
  }
  api.evalAst = evalAst(api)
  api.exp = exp(api)
  api.getValue = getValue(api, stack)
  api.setValue = setValue(api, stack)
  return api
}

export const constants = {
  'true': ['atom', true],
  'false': ['atom', false],
}

export const atoms = {
  // Built in
  // ---- Special Forms
  process: async (api, args) => {
    let result
    api._pushScope()
    for (let i = 0, len = args.length, arg; arg = args[i]; i++) {
      if (arg instanceof Array) {
        result = await api.evalAst(arg)
      } else if (i === len - 1) {
        result = await api.exp(arg)
      } else {
        return await api.evalAst(['throw', `'process only can have lists as arguments'`])
      }
    }
    api._popScope()
    return result
  },
  // Constant definition
  def: async (api, [name, exp]) => {
    if (name instanceof Array) {
      api.setValue(name[0], ['fn', [name.slice(1), exp]])
    } else {
      api.setValue(name, await api.exp(exp))
    }
  },
  // Lambda definition
  '->': (api, [params, body]) => {
    return ['fn', [params, body]]
  },
  // Function composition operator
  '.': (api, args) => {
    // `(. x y z) -> (fn (param) (x (y (z param))`
    return ['fn', [['param'], args.reduceRight((a, fn) => [fn, a], 'param')]]
  },
  // Inverse function composition operator
  'pipe': (api, args) => {
    // `(pipe x y z) -> (fn (param) (z (y (x param))`
    return ['fn', [['param'], args.reduce((a, fn) => [fn, a], 'param')]]
  },
  // JS Math (TODO: Doc)
  Math: async (api, args) => {
    let name = args[0]
    name = name[0] === '.' ? name.slice(1) : (await api.exp(name))[1]
    let subj = Math[name]
    let fnArgs = await expArgs(api, args.slice(1))
    return typeof subj === 'function'
      ? ['atom', subj.apply(null, fnArgs)]
      : ['atom', subj]
  },
  cond: async (api, args) => {
    for (let i = 0, arg; arg = args[i]; i++) {
      if (arg[0] === 'else') {
        return await api.exp(arg[1])
      } else if ((await api.exp(arg[0]))[1]) {
        return await api.exp(arg[1])
      }
    }
  },
  if: async (api, [pred, con, alter]) => (await api.exp(pred))[1] ? await api.exp(con) : await api.exp(alter),
  // ----
  // Error handling
  throw: async (api, args) => {
    throw (await mapAsync(args, async a => (await api.exp(a))[1])).join(' ')
  },
  // Mathematical
  '+': async (api, args) => ['atom', await reduceAsync(args, async (a, n) => a + (await api.exp(n))[1], 0)],
  '-': async (api, args) => ['atom', await reduceAsync(args.slice(1), async (a, n) => a - (await api.exp(n))[1], (await api.exp(args[0]))[1])],
  '*': async (api, args) => ['atom', await reduceAsync(args, async (a, n) => a * (await api.exp(n))[1], 1)],
  '/': async (api, args) => ['atom', (await api.exp(args[0]))[1] / await reduceAsync(args.slice(1), async (a, n) => a * (await api.exp(n))[1], 1)],
  // Logical
  '>': async (api, args) => ['atom', (await api.exp(args[0]))[1] > (await api.exp(args[1]))[1]],
  '>=': async (api, args) => ['atom', (await api.exp(args[0]))[1] >= (await api.exp(args[1]))[1]],
  '=': async (api, args) => ['atom', (await api.exp(args[0]))[1] == (await api.exp(args[1]))[1]],
  '<': async (api, args) => ['atom', (await api.exp(args[0]))[1] < (await api.exp(args[1]))[1]],
  '<=': async (api, args) => ['atom', (await api.exp(args[0]))[1] <= (await api.exp(args[1]))],
  xor: async (api, args) => ['atom', (await api.exp(args[0]))[1] ^ (await api.exp(args[1]))[1]],
  not: async (api, args) => ['atom', !(await api.exp(args[0]))[1]],
  and: async (api, args) => ['atom', await reduceAsync(args, async (a, n) => a && (await api.exp(n))[1], true)],
  or: async (api, args) => ['atom',  await reduceAsync(args, async (a, n) => a || (await api.exp(n))[1], false)],
  // Strings
  cat: async (api, args) => ['atom', await reduceAsync(args, async (a, n) => a + (await api.exp(n))[1], '')],
  // Key-Value structure
  kv: async (api, args) => {
    let obj = {}
    let evArgs = await mapAsync(args, async (a, idx) => (idx % 2 === 1 || a instanceof Array) ? (await api.exp(a))[1] : a)
    for (let i = 0, len = evArgs.length; i < len; i += 2) {
      obj[evArgs[i]] = evArgs[i + 1]
    }
    return ['atom', obj]
  },
  // List structure
  ls: async (api, args) => ['atom', await mapAsync(args, async a => (await api.exp(a))[1])],
  get: async (api, args) => {
    let a = await mapAsync(args, async a => (await api.exp(a))[1])
    let res = a[0]
    for (let i = 1, len = a.length; i < len; i++) {
      res = res[a[i]]
    }
    return ['atom', res]
  },
  set: async (api, args) => {
    let a = await mapAsync(args, async a => (await api.exp(a))[1])
    let subj = a[0]
    for (let i = 1, len = a.length - 2; i < len; i++) {
      subj = subj[a[i]]
    }
    let lastKey = a[a.length - 2]
    let value = a[a.length - 1]
    subj[lastKey] = value
    return ['atom', value]
  },
}
