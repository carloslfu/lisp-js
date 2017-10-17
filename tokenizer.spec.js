var test = require('tape')
var { tokenize } = require('./tokenizer')

test('tokenizer', function (t) {
  t.plan(2)

  t.deepEqual(
    tokenize(`(  +  a  b  'string  :D e$ref' c)`),
    ['(', '+', 'a', 'b', `'string  :D e$ref'`, 'c', ')'],
    'simple expression'
  )

  t.deepEqual(
    tokenize(`(  ++ ( aa/sd  'string  :D e$ref'  bs c)  ( aasd b&  +) ( (aasd& 123) asdasd  ?asd< ) )`),
    [
      '(', '++', '(', 'aa/sd', `'string  :D e$ref'`, 'bs', 'c', ')' ,
      '(', 'aasd', 'b&', '+', ')', '(', '(', 'aasd&', '123', ')', 'asdasd', '?asd<', ')', ')',
    ],
    'complex expression'
  )

})
