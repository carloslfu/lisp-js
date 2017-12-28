import { run } from './index'

const code = `
  ((.
    (-> (x) (+ x 1))
    (-> (x) (* x 3))
  ) 3)
`

let env = {
  log: (api, args) => console.log.apply(null, args.map(a => api.exp(a)[1])),
}

;(async () => {
  let result = await run(env)(code)
  console.log(result)
})()
