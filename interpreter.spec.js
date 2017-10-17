var test = require('tape')
var { evalAst, makeAPI } = require('./interpreter')

test('interpreter', t => {
  t.plan(14)

  t.deepEqual(
    evalAst(makeAPI({}))(['+', '1', '2', '3']),
    ['atom', 6],
    'simple expression'
  )
  
  t.deepEqual(
    evalAst(makeAPI({}))(['*', '2', '3', ['-', '3', '4'], '2', ['/', '1', '2']]),
    ['atom', -6],
    'composed expression'
  )

  t.deepEqual(
    evalAst(makeAPI({ x: ['atom', 5], y: ['atom', 3] }))(['*', 'x', 'y', ['-', '3', '4'], '2', ['/', '1', '2']]),
    ['atom', -15],
    'composed expression with env constants'
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
    'process expression with env constants'
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
    'procedure declaration / aplication'
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
    'multiparameter procedure declaration / aplication'
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

})
