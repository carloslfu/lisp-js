const { run } = require('./index')

const code = `
  ((.
    (lambda (x) (+ x 1))
    (lambda (x) (* x 3))
  ) 3)
`

let result = run({
  log: (api, args) => console.log.apply(null, args.map(a => api.exp(a)[1])),
})(code)

console.log(result)
