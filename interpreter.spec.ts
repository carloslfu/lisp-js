import test = require('tape')
import { evalAst, makeAPI } from './interpreter'

test('interpreter', async t => {

  t.plan(29)

  t.equal(
    await evalAst(makeAPI({}))(['+', '1', '2', '3']),
    6,
    'Simple expression'
  )

  t.equal(
    await evalAst(makeAPI({}))(['*', '2', '3', ['-', '3', '4'], '2', ['/', '1', '2']]),
    -6,
    'Composed expression'
  )

  t.equal(
    await evalAst(makeAPI({ x: 5, y: 3 }))(['*', 'x', 'y', ['-', '3', '4'], '2', ['/', '1', '2']]),
    -15,
    'Composed expression with env constants'
  )

  t.equal(
    await evalAst(makeAPI({}))(
      ['process',
        ['def', ['a1', 'x'], 'x'],
        [['cat', '"a"', '"1"'], 11],
      ],
    ),
    11,
    'Computed operation name'
  )

  t.equal(
    await evalAst(makeAPI({ x: 5, y: 3 }))(
      ['process',
        ['def', 'a', '2'],
        ['def', 'b', '3'],
        ['def', 'x', ['+', 'a', '3', 'b', ['*', 'b', 'a']]],
        ['+', 'y', 'x'],
      ]
    ),
    17,
    'Process expression with env constants'
  )

  t.equal(
    await evalAst(makeAPI({}))(
      ['process',
        ['def', ['identity', 'x'], 'x'],
        ['identity', 7],
      ]
    ),
    7,
    'Identity procedure definition / application'
  )

  t.equal(
    await evalAst(makeAPI({}))(
      ['process',
        ['def',
          ['inc', 'x'],
          ['+', 'x', '1'],
        ],
        ['inc', 7],
      ]
    ),
    8,
    'Procedure declaration / application'
  )

  t.equal(
    await evalAst(makeAPI({}))(
      ['process',
        ['def',
          ['sum', 'x', 'y'],
          ['+', 'x', 'y'],
        ],
        ['sum', 7, 8],
      ]
    ),
    15,
    'Multiparameter procedure declaration / application'
  )

  t.equal(
    await evalAst(makeAPI({}))(
      ['process',
        ['def',
          ['sqrtIter', 'x', 'guess'],
          ['if',
            ['=', ['Math', '.abs', ['-', 'x', ['*', 'guess', 'guess']]], 0],
            ['Math', '.floor', 'guess'],
            ['sqrtIter', 'x', ['/', ['+', 'guess', ['/', 'x', 'guess']], '2']],
          ],
        ],
        ['def',
          ['sqrt', 'x'],
          ['sqrtIter', 'x', '1'],
        ],
        ['sqrt', 9],
      ]
    ),
    3,
    'Procedure recursion'
  )

  t.equal(
    await evalAst(makeAPI({}))(['+', ['*', '1', '2', '3'], '2', ['/', '27', '3', '3']]),
    11,
    'Mathematical operators'
  )

  t.equal(
    await evalAst(makeAPI({}))(['or', ['and', 'true', ['>', '3', '4']], 'false', ['<', '27', '3'], ['or', 'true', 'false', 'false']]),
    true,
    'Logical operators'
  )

  t.equal(
    await evalAst(makeAPI({}))(
      ['process',
        ['def', 'a', `'log'`],
        ['def', 'b', `'E'`],
        ['Math', 'a', ['Math', 'b']],
      ]
    ),
    1,
    'Math operators with evaluated name'
  )

  t.equal(
    await evalAst(makeAPI({}))(
      ['process',
        ['Math', '.log', ['Math', '.E']],
      ]
    ),
    1,
    'Math operators with known name'
  )

  // Special forms
  t.equal(
    await evalAst(makeAPI({}))(
      ['process',
        ['def', 'x', ['process',
          ['def', 'a', 2],
          ['def', 'b', ['+', 'a', 10]],
          'b',
        ]],
        ['+', 'x', 8],
      ]
    ),
    20,
    'Process application / definition'
  )

  t.equal(
    await evalAst(makeAPI({}))(
      ['cond',
        ['false', 2],
        [['>', 1, 2], 11],
        [['<', 1, 2], 10],
        ['else', ['+', 12, 3]],
      ]
    ),
    10,
    'Case analysis'
  )


  t.equal(
    await evalAst(makeAPI({}))(
      ['cond',
        ['false', 2],
        [['<', 10, 2], 11],
        [['>', 1, 2], 10],
        ['else', ['+', 12, 3]],
      ]
    ),
    15,
    'Case analysis - else'
  )

  t.equal(
    await evalAst(makeAPI({}))(
      ['if',
        ['<', 1, 2],
        10,
        ['+', 12, 3],
      ]
    ),
    10,
    'Conditional'
  )

  t.equal(
    await evalAst(makeAPI({}))(
      ['if',
        ['>', 1, 2],
        10,
        ['+', 12, 3],
      ]
    ),
    15,
    'Conditional - else'
  )

  t.equal(
    await evalAst(makeAPI({}))(
      [['->', ['x', 'y'], ['+', 'x', 'y']], 23, 34],
    ),
    57,
    'Lambda definition and application'
  )

  t.equal(
    await evalAst(makeAPI({}))(
      [['->', 'param', ['+', 'param', '10']], 23],
    ),
    33,
    'Lambda definition and application (one parameter)'
  )

  t.equal(
    await evalAst(makeAPI({}))(
      [
        ['.',
          ['->', ['x'], ['+', 'x', '1']],
          ['->', ['x'], ['*', 'x', '3']],
        ],
        3
      ],
    ),
    10,
    'Function composition operator'
  )

  t.equal(
    await evalAst(makeAPI({}))(
      [
        ['pipe',
          ['->', ['x'], ['+', 'x', '1']],
          ['->', ['x'], ['*', 'x', '3']],
        ],
        3
      ],
    ),
    12,
    'Inverse function composition operator'
  )

  t.deepEqual(
    await evalAst(makeAPI({}))(
      ['kv',
        'key1', '"value1"',
        'key2', '2',
        'key3', '"value3"',
      ],
    ),
    { key1: 'value1', key2: 2, key3: 'value3' },
    'Key-Value (kv) constructor operator'
  )

  t.deepEqual(
    await evalAst(makeAPI({}))(
      ['kv',
        'key1', '"value1"',
        ['cat', '"key"', '2'], '2',
        ['cat', '"key"', '3'], ['+', '1', '2'],
        'key4', ['cat', '"value"', ['+', '2', '2']],
      ],
    ),
    { key1: 'value1', key2: 2, key3: 3, key4: 'value4' },
    'Key-Value Object (kv) constructor operator with evaluated arguments'
  )

  t.deepEqual(
    await evalAst(makeAPI({}))(
      ['ls',
        '1',
        ['+', '2', '3'],
        '3',
        '4',
        ['-', '10', '5'],
      ],
    ),
    [1, 5, 3, 4, 5],
    'List (ls) constructor operator with evaluated arguments'
  )

  t.equal(
    await evalAst(makeAPI({}))(
      ['get',
        ['kv', 'key', ['kv', 'a', ['kv', 'b', 12]]],
        '"key"', '"a"', '"b"',
      ],
    ),
    12,
    'Get (get) general getter for objects and lists'
  )

  t.equal(
    await evalAst(makeAPI({}))(
      ['process',
        ['def',
          'a',
          ['kv', 'key', ['kv', 'a', ['kv', 'b', 9]]],
        ],
        ['set', 'a', '"key"', '"a"', '"b"', 21],
        ['get', 'a', '"key"', '"a"', '"b"'],
      ],
    ),
    21,
    'Set (set) general setter for objects and lists'
  )

  // JS Interop

  t.equal(
    await evalAst(makeAPI({ fn: async function (x) { return await this.exp(x) + 1 } }))(
      ['process',
        ['fn', '23'],
      ],
    ),
    24,
    'Interop: Should evaluate an environment function'
  )

  debugger
  let api = makeAPI({})
  let fn = await evalAst(api)(
    ['->', 'x', ['+', 'x', '1']],
  )

  t.equal(
    await fn.apply(api, [3]),
    4,
    'Interop: Should execute returned functions'
  )

})
