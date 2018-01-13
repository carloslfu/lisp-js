import { run } from './index'
import { wrapObj } from './js-interop'

let env = wrapObj({
  sum: (x, z) => x + z,
  inc: x => x + 1,
})

const code = `
  (process
    (sum 2 (inc 10))
  )
`

;(async () => {
  let result = await run(env)(code)
  console.log(result)
})()
