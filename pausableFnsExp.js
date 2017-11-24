
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
  }
  return new Promise((res, rej) => {
    doStep = () => {
      res()
      return value
    }
  })
}

fn(step)

;(async () => {
  console.log('STEP', doStep())
  await stepEnd()
  console.log('STEP', doStep())
  await stepEnd()  
  console.log('STEP', doStep())
  await stepEnd()
  console.log('STEP', doStep())
  await stepEnd()
  console.log('STEP', doStep())
  await stepEnd()
})()
