import test = require('tape')
import { parse, getPath, setPath } from './parser'

test('parse', function (t) {
  t.plan(2)

  t.deepEqual(
    parse(['(', '+', 'a', 'b', 'c', ')']),
    ['+', 'a', 'b', 'c'],
    'simple expression'
  )

  t.deepEqual(
    parse([
      '(', '++', '(', 'aa/sd', 'bs', 'c', ')' ,
      '(', 'aasd', 'b&', '+', ')', '(', '(', 'aasd&', '123', ')', 'asdasd', '?asd<', ')', ')',
    ]),
    ['++', [ 'aa/sd', 'bs', 'c' ], [ 'aasd', 'b&', '+' ], [ ['aasd&', '123'], 'asdasd', '?asd<' ]],
    'complex expression'
  )

})

test('getPath', function (t) {
  t.plan(1)

  t.deepEqual(
    getPath([1, 2, 0, 1], ['1', [1, 2, [[1, 2, 3, 4], 2, 3], 4]]),
    2,
    'get a path from a tree'
  )

})

test('setPath', function (t) {
  t.plan(1)

  t.deepEqual(
    setPath(4, [1, 2, 0, 1], ['1', [1, 2, [[1, 2, 3, 4], 2, 3], 4]]),
    ['1', [1, 2, [[1, 4, 3, 4], 2, 3], 4]],
    'set a path in a tree'
  )

})
