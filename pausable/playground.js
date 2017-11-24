const { run } = require('../index')

const code = `
  ()
`

let env = {
  log: (api, args) => console.log.apply(null, args.map(a => api.exp(a)[1])),
}

let result = run(env)(code)

console.log(result)
