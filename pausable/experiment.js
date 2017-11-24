
async function fn (step) {
  await step(0)  
  console.log('a')
  await step(1)
  console.log('b')
  await step(2)  
  for (let i = 0; i < 10; i++) {
    console.log(i)
    await step(3 + i)  
  }
}


let doStep
let doStepEnd
let stepEnd = () => new Promise ((res, rej) => {
  doStepEnd = res
})
const step = async value => {
  if (doStepEnd) {
    doStepEnd()
    doStepEnd = undefined
  }
  return new Promise((res, rej) => {
    doStep = () => {
      res()
      doStep = undefined
      return value
    }
  })
}

fn(step)

;(async () => {
  while (doStep) {
    console.log('STEP', doStep())
    await stepEnd()
    await new Promise((res, rej) => {
      setTimeout(res, 1000)
    })
  }
})()
