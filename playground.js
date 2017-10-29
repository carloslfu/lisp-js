const { run } = require('./index')

const code = `
  (process
    (def (a1 x) x)
    ((cat 'a' '1') 11)
  )
`

let result = run({
  log: (api, args) => console.log.apply(null, args.map(a => api.exp(a)[1])),
})(code)

console.log(result)
