import { run } from './index'
import { wrapObj } from './js-interop'

let env = wrapObj({
  highFn: async obj => (await obj.root({a:3})) + 1,
})

const code = `
  (process
    (highFn (kv
      root (-> obj (+ (get obj 'a') 1))
    ))
  )
`

;(async () => {
  let result = await run(env)(code)
  console.log(result)
})()
