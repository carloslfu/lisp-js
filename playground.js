const { run } = require('./index')

const code = `
  (process
    (def
      a
      [+  1 2]
    )
    a
  )
`

let result = run({
  log: (api, args) => console.log.apply(null, args.map(a => api.exp(a)[1])),
}, code)
console.log(result)
