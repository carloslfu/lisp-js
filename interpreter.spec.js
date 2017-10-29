var test = require('tape')
var { evalAst, makeAPI } = require('./interpreter')

test('interpreter', t => {
  t.plan(19)

  t.deepEqual(
    evalAst(makeAPI({}))(['+', '1', '2', '3']),
    ['atom', 6],
    'Simple expression'
  )
  
  t.deepEqual(
    evalAst(makeAPI({}))(['*', '2', '3', ['-', '3', '4'], '2', ['/', '1', '2']]),
    ['atom', -6],
    'Composed expression'
  )

  t.deepEqual(
    evalAst(makeAPI({ x: ['atom', 5], y: ['atom', 3] }))(['*', 'x', 'y', ['-', '3', '4'], '2', ['/', '1', '2']]),
    ['atom', -15],
    'Composed expression with env constants'
  )

  t.deepEqual(
    evalAst(makeAPI({}))(
      ['process',
        ['def', ['a1', 'x'], 'x'],
        [['cat', '"a"', '"1"'], 11],
      ],
    ),
    ['atom', 11],
    'Computed operation name'
  )

  t.deepEqual(
    evalAst(makeAPI({ x: ['atom', 5], y: ['atom', 3] }))(
      ['process',
        ['def', 'a', '2'],
        ['def', 'b', '3'],
        ['def', 'x', ['+', 'a', '3', 'b', ['*', 'b', 'a']]],
        ['+', 'y', 'x'],
      ]
    ),
    ['atom', 17],
    'Process expression with env constants'
  )

  t.deepEqual(
    evalAst(makeAPI({}))(
      ['process',
        ['def', ['identity', 'x'], 'x'],
        ['identity', 7],
      ]
    ),
    ['atom', 7],
    'Identity procedure definition / application'
  )

  t.deepEqual(
    evalAst(makeAPI({}))(
      ['process',
        ['def',
          ['inc', 'x'],
          ['+', 'x', '1'],
        ],
        ['inc', 7],
      ]
    ),
    ['atom', 8],
    'Procedure declaration / application'
  )

  t.deepEqual(
    evalAst(makeAPI({}))(
      ['process',
        ['def',
          ['sum', 'x', 'y'],
          ['+', 'x', 'y'],
        ],
        ['sum', 7, 8],
      ]
    ),
    ['atom', 15],
    'Multiparameter procedure declaration / application'
  )

  t.deepEqual(
    evalAst(makeAPI({}))(
      ['process',
        ['def',
          ['sqrtIter', 'x', 'guess'],
          ['if',
            ['=', ['Math', '.abs', ['-', 'x', ['*', 'guess', 'guess']]], 0],
            'guess',
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
    ['atom', 3],
    'Procedure recursion'
  )

  t.deepEqual(
    evalAst(makeAPI({}))(['+', ['*', '1', '2', '3'], '2', ['/', '27', '3', '3']]),
    ['atom', 11],
    'Mathematical operators'
  )

  t.deepEqual(
    evalAst(makeAPI({}))(['or', ['and', 'true', ['>', '3', '4']], 'false', ['<', '27', '3'], ['or', 'true', 'false', 'false']]),
    ['atom', true],
    'Logical operators'
  )

  t.deepEqual(
    evalAst(makeAPI({}))(
      ['process',
        ['def', 'a', `'log'`],
        ['def', 'b', `'E'`],
        ['Math', 'a', ['Math', 'b']],
      ]
    ),
    ['atom', 1],
    'Math operators with evaluated name'
  )

  t.deepEqual(
    evalAst(makeAPI({}))(
      ['process',
        ['Math', '.log', ['Math', '.E']],
      ]
    ),
    ['atom', 1],
    'Math operators with evaluated name'
  )

  // Special forms
  t.deepEqual(
    evalAst(makeAPI({}))(
      ['process',
        ['def', 'x', ['process',
          ['def', 'a', 2],
          ['def', 'b', ['+', 'a', 10]],
          'b',
        ]],
        ['+', 'x', 8],
      ]
    ),
    ['atom', 20],
    'Process application / definition'
  )

  t.deepEqual(
    evalAst(makeAPI({}))(
      ['cond',
        ['false', 2],
        [['>', 1, 2], 11],
        [['<', 1, 2], 10],
        ['else', ['+', 12, 3]],
      ]
    ),
    ['atom', 10],
    'Case analysis'
  )


  t.deepEqual(
    evalAst(makeAPI({}))(
      ['cond',
        ['false', 2],
        [['<', 10, 2], 11],
        [['>', 1, 2], 10],
        ['else', ['+', 12, 3]],
      ]
    ),
    ['atom', 15],
    'Case analysis - else'
  )

  t.deepEqual(
    evalAst(makeAPI({}))(
      ['if',
        ['<', 1, 2],
        10,
        ['+', 12, 3],
      ]
    ),
    ['atom', 10],
    'Conditional'
  )

  t.deepEqual(
    evalAst(makeAPI({}))(
      ['if',
        ['>', 1, 2],
        10,
        ['+', 12, 3],
      ]
    ),
    ['atom', 15],
    'Conditional - else'
  )

  t.deepEqual(
    evalAst(makeAPI({}))(
      [['lambda', ['x', 'y'], ['+', 'x', 'y']], 23, 34],
    ),
    ['atom', 57],
    'Lambda definition and application'
  )

})
