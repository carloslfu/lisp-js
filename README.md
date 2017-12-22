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

let result = run({})(code)

console.log(result)
```

## Roadmap

- Port pausable interpreter to TypeScript
- Implement a pausable interpreter
- Make the build env with FuseBox :fire:
- Improve README and docs
- Support for comments (`;`) as a special form
- Implement code generation
- Implement a code generator for WebAssembly
- Allow concurrent execution
- Allow multi-threaded execution

## Goals

- Build a language for Fractal over JS
- Be simple and performant

## Docs

- Language is described in LANGUAGE.md
