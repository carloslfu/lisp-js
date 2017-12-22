import { run } from './index'

const code = `
  ((.
    (lambda (x) (+ x 1))
    (lambda (x) (* x 3))
  ) 3)
`

let env = {
  log: (api, args) => console.log.apply(null, args.map(a => api.exp(a)[1])),
}

let result = run(env)(code)

console.log(result)
