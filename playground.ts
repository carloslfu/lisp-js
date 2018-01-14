import { run } from './index'
import { wrapObj } from './js-interop'

let env = wrapObj({
  highFn: async obj => (await obj.root(10)) + 1,
})

const code = `
  (process
    (highFn (kv
      root (-> x (+ x 1))
    ))
  )
`

;(async () => {
  let result = await run(env)(code)
  console.log(result)
})()
