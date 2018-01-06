import test = require('tape')
import { evalAst, makeAPI } from './interpreter'

test('interpreter', async t => {
  t.plan(27)

  t.deepEqual(
    await evalAst(makeAPI({}))(['+', '1', '2', '3']),
    6,
    'Simple expression'
  )

  t.deepEqual(
    await evalAst(makeAPI({}))(['*', '2', '3', ['-', '3', '4'], '2', ['/', '1', '2']]),
    -6,
    'Composed expression'
  )

  t.deepEqual(
    await evalAst(makeAPI({ x: 5, y: 3 }))(['*', 'x', 'y', ['-', '3', '4'], '2', ['/', '1', '2']]),
    -15,
    'Composed expression with env constants'
  )

  t.deepEqual(
    await evalAst(makeAPI({}))(
      ['process',
        ['def', ['a1', 'x'], 'x'],
        [['cat', '"a"', '"1"'], 11],
      ],
    ),
    11,
    'Computed operation name'
  )

  t.deepEqual(
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

  t.deepEqual(
    await evalAst(makeAPI({}))(
      ['process',
        ['def', ['identity', 'x'], 'x'],
        ['identity', 7],
      ]
    ),
    7,
    'Identity procedure definition / application'
  )

  t.deepEqual(
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

  t.deepEqual(
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

  t.deepEqual(
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

  t.deepEqual(
    await evalAst(makeAPI({}))(['+', ['*', '1', '2', '3'], '2', ['/', '27', '3', '3']]),
    11,
    'Mathematical operators'
  )

  t.deepEqual(
    await evalAst(makeAPI({}))(['or', ['and', 'true', ['>', '3', '4']], 'false', ['<', '27', '3'], ['or', 'true', 'false', 'false']]),
    true,
    'Logical operators'
  )

  t.deepEqual(
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

  t.deepEqual(
    await evalAst(makeAPI({}))(
      ['process',
        ['Math', '.log', ['Math', '.E']],
      ]
    ),
    1,
    'Math operators with known name'
  )

  // Special forms
  t.deepEqual(
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

  t.deepEqual(
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


  t.deepEqual(
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

  t.deepEqual(
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

  t.deepEqual(
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

  t.deepEqual(
    await evalAst(makeAPI({}))(
      [['->', ['x', 'y'], ['+', 'x', 'y']], 23, 34],
    ),
    57,
    'Lambda definition and application'
  )

  t.deepEqual(
    await evalAst(makeAPI({}))(
      [['->', 'param', ['+', 'param', '10']], 23],
    ),
    33,
    'Lambda definition and application (one parameter)'
  )

  t.deepEqual(
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

  t.deepEqual(
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

  t.deepEqual(
    await evalAst(makeAPI({}))(
      ['get',
        ['kv', 'key', ['kv', 'a', ['kv', 'b', 12]]],
        '"key"', '"a"', '"b"',
      ],
    ),
    12,
    'Get (get) general getter for objects and lists'
  )

  t.deepEqual(
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

})
