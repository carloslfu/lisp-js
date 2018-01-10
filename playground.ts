import { run } from './index'

const code = `
  (process
    (fn 23)
  )
`

let env = {
  fn: x => x + 1,
}

;(async () => {
  let result = await run(env)(code)
  console.log(result)
})()
