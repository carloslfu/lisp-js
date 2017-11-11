# Lisp-JS

This library is an extendable interpreter / compiler for Lisp intended for use in any JS environment as a secure sandboxed execution runtime.

Example code:

```javascript
const { run } = require('./index')

const code = `
  (process
    (def
      [sqrtIter x guess]
      (if
        [= (Math .abs (- x (* guess guess))) 0]
        guess
        (sqrtIter x (/ (+ guess (/ x guess)) 2))
      )
    )
    (def
      [sqrt x]
      (sqrtIter x 1)
    )
    (sqrt 9)
  )
`
let env = {
  log: (api, args) => console.log.apply(null, args.map(a => api.exp(a)[1])),
}

let result = run(env)(code)

console.log(result)
```

## Roadmap

- Improve README and docs
- Make the build env with FuseBox :fire:
- Implement a pausable interpreter
- Make an example
- Support for comments (`;`)
- Implement code generation
- Implement a code generator for WebAssembly

## Goals

- Build a language for Fractal over JS
- Be simple and performant

## Docs

- Language is described in LANGUAGE.md
