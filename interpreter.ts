import { stringDelimiters } from './tokenizer'
import { expArgs, mapAsync, reduceAsync, reduceRightAsync } from './utils'

// evaluate a primitive expression
export const exp =  api => async exp => {
  if (exp instanceof Array) {
    return await api.evalAst(exp)
  } else if (!isNaN(exp)) { // is a number
    return parseFloat(exp)
  } else if (
    stringDelimiters.indexOf(exp[0]) !== -1
    && stringDelimiters.indexOf(exp[exp.length - 1]) !== -1
  ) {
    return exp.slice(1, exp.length - 1)
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
    return null
  }
  let op = ast[0]
  let args = ast.slice(1, ast.length)
  if (!op) {
    return await api.evalAst(['throw', `'Invalid operation in: ${ast}'`])
  }
  if (op instanceof Array) { // op expression
    op = await api.exp(op)
    // lambda evaluation
    if (typeof op === 'function') {
      return await op.apply(api, args)
    }
  }
  let fn = api.getValue(op)
  if (fn !== undefined) {
    if (typeof fn === 'function') {
      return await fn.apply(api, args)
    } else {
      return await api.evalAst(['throw', `'The operation is not valid: ${op}'`])
    }
  } else {
    return await api.evalAst(['throw', `'The operation is not defined: ${op}'`])
  }
}

export async function evaluateFn (api, name, [params, body], args) {
  let _api = {...api}
  // Clone stack for clousure
  _api._stack = _api._stack.map(l => ({...l}))
  _api._pushScope()
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
  let api: any = {
    env: {
      ...constants,
      ...atoms,
      ...env,
    },
    _stack: [],
    _pushScope: () => api._stack.push({}),
    _popScope: () => api._stack.pop(),
  }
  api.evalAst = evalAst(api)
  api.exp = exp(api)
  api.getValue = getValue(api, api._stack)
  api.setValue = setValue(api, api._stack)
  return api
}

export const constants = {
  'true': true,
  'false': false,
}

export const atoms = {
  // Built in
  // ---- Special Forms
  process: async function (...args) {
    let result
    this._pushScope()
    for (let i = 0, len = args.length, arg; arg = args[i]; i++) {
      if (arg instanceof Array) {
        result = await this.evalAst(arg)
      } else if (i === len - 1) {
        result = await this.exp(arg)
      } else {
        return await this.evalAst(['throw', `'process only can have lists as arguments'`])
      }
    }
    this._popScope()
    return result
  },
  // Constant definition
  def: async function (name, exp) {
    if (name instanceof Array) {
      let fn = async (...args) => await evaluateFn(this, 'lambda', [name.slice(1), exp], args)
      this.setValue(name[0], fn)
    } else {
      this.setValue(name, await this.exp(exp))
    }
  },
  // Lambda definition
  '->': function (params, body) {
    return async (...args) => await evaluateFn(this, 'lambda', [params, body], args)
  },
  // Function composition operator
  '.': function (...fns) {
    return async (...args) => await reduceRightAsync(fns, async (a, fn, i) => await (await this.exp(fn)).apply(this, i === (fns.length - 1) ? a : [a]), args)
  },
  // Inverse function composition operator
  'pipe': function (...fns) {
    return async (...args) => await reduceAsync(fns, async (a, fn, i) => await (await this.exp(fn)).apply(this, i === 0 ? a : [a]), args)
  },
  // JS Math (TODO: Doc)
  Math: async function (...args) {
    let name = args[0]
    name = name[0] === '.' ? name.slice(1) : await this.exp(name)
    let subj = Math[name]
    let fnArgs = await expArgs(this, args.slice(1))
    return typeof subj === 'function'
      ? subj.apply(null, fnArgs)
      : subj
  },
  cond: async function (...args) {
    for (let i = 0, arg; arg = args[i]; i++) {
      if (arg[0] === 'else') {
        return await this.exp(arg[1])
      } else if (await this.exp(arg[0])) {
        return await this.exp(arg[1])
      }
    }
  },
  if: async function (pred, con, alter) {
    return await this.exp(pred) ? await this.exp(con) : await this.exp(alter)
  },
  // ----
  // Error handling
  throw: async function (...args) {
    throw (await mapAsync(args, async a => await this.exp(a))).join(' ')
  },
  // Mathematical
  '+': async function (...args) {
    return await reduceAsync(args, async (a, n) => a + await this.exp(n), 0)
  },
  '-': async function (...args) {
    return await reduceAsync(args.slice(1), async (a, n) => a - await this.exp(n), await this.exp(args[0]))
  },
  '*': async function (...args) {
    return await reduceAsync(args, async (a, n) => a * (await this.exp(n)), 1)
  },
  '/': async function (...args) {
    return await this.exp(args[0]) / await reduceAsync(args.slice(1), async (a, n) => a * await this.exp(n), 1)
  },
  // Logical
  '>': async function (...args) {
    return await this.exp(args[0]) > await this.exp(args[1])
  },
  '>=': async function (...args) {
    return await this.exp(args[0]) >= await this.exp(args[1])
  },
  '=': async function (...args) {
    return await this.exp(args[0]) == await this.exp(args[1])
  },
  '<': async function (...args) {
    return await this.exp(args[0]) < await this.exp(args[1])
  },
  '<=': async function (...args) {
    return await this.exp(args[0]) <= await this.exp(args[1])
  },
  xor: async function (...args) {
    return await this.exp(args[0]) ^ await this.exp(args[1])
  },
  not: async function (...args) {
    return !await this.exp(args[0])
  },
  and: async function (...args) {
    return await reduceAsync(args, async (a, n) => a && await this.exp(n), true)
  },
  or: async function (...args) {
    return  await reduceAsync(args, async (a, n) => a || await this.exp(n), false)
  },
  // Strings
  cat: async function (...args) {
    return await reduceAsync(args, async (a, n) => a + await this.exp(n), '')
  },
  // Key-Value structure
  kv: async function (...args) {
    let obj = {}
    let evArgs = await mapAsync(args, async (a, idx) => (idx % 2 === 1 || a instanceof Array) ? await this.exp(a) : a)
    for (let i = 0, len = evArgs.length; i < len; i += 2) {
      obj[evArgs[i]] = evArgs[i + 1]
    }
    return obj
  },
  // List structure
  ls: async function (...args) {
    return await mapAsync(args, async a => await this.exp(a))
  },
  get: async function (...args) {
    let a = await mapAsync(args, async a => await this.exp(a))
    let res = a[0]
    for (let i = 1, len = a.length; i < len; i++) {
      res = res[a[i]]
    }
    return res
  },
  set: async function (...args) {
    let a = await mapAsync(args, async a => await this.exp(a))
    let subj = a[0]
    for (let i = 1, len = a.length - 2; i < len; i++) {
      subj = subj[a[i]]
    }
    let lastKey = a[a.length - 2]
    let value = a[a.length - 1]
    subj[lastKey] = value
    return value
  },
}
