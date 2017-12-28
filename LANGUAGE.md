# Language

This languaje is sync by default, this means all is awaited. If you need to make something parallel or async must use special functions for this (built-in async functions comming soon)

## Sintax

There are 2 kind of expressions:

- Primitive expressions
- Compound expressions

Primitive expresions (values), called atoms, any sequence of characters except `()[]`:
```lisp
some#$ ; atom
12 ; number
45 ; number
/ ; atom
"asd" ; string
'asd' ; string
```
There are 2 special kind of atoms, numbers:
```lisp
100
100.23
90
```
And strings:
```lisp
"asd"
'asd'
```
Compound expressions have two syntaxes:
```lisp
(function expression1 expression2 ... expressionN)
[function expression1 expression2 ... expressionN]
```
Note that compound expressions can contain other expressions inside, those expressions can be primitives or other compound expressions as well:
```lisp
(myfunction 12 23)
(myfunction 23 (otherfunction 12 34))
```
## Functions

All function executions are awaited by default. Below are the built-in ones:

`def` can be used in two ways, defining variables:
```lisp
(def variableName expression)
```
Or defining functions:
```lisp
(def [functionName parameter1 parameter2 .. parametern] expression)
```
`process` execute a sequence of steps and return the result of the last:
```lisp
(process
    expression1
    expression2
    returnExpression3
)
```
`->` a lambda define an anonimous function:
```lisp
(-> [param1 param2 ... paramN] expression)
(-> param expression)
```
Function composition:
```lisp
(. function1 function2 ... functionN)
```
Reverse function composition
```lisp
(pipe function1 function2 ... functionN)
```
Simple conditional evaluation
```lisp
(if
    booleanExpression1
    consequenceExpression
    alternativeExpresion
)
```
Multiple conditional evaluation
```lisp
(cond
    (booleanExpression1 resultExpresion1)
    (booleanExpression2 resultExpresion2)
    ...
    (booleanExpressionN resultExpresionN)
)
```
## Mathematical functions

### Arithmetical

With N-arguments
```lisp
(operator expression1 expression2 ... expressionN)
```
Binary operators
```lisp
(operator expression1 expression2)
```

The next operators have N-argumments, unless have 'BINARY' annotation

Addition: `+`
Substraction: `-`
Product: `*`
Division: `/`, `exp1 / (exp2 * exp3 * ... * expN)`

### Logical

Greater: `>`, BINARY
Greater or Equal`>=`, BINARY
Equal: `=`, BINARY
Lesser: `<`, BINARY
Lesser or Equal: `<=`, BINARY
Exclusive Or: `xor`, BINARY
Not: `not`, UNARY
And: `and`
Or: `or`

Strings

Concatenation: `cat`

## JavaScript related functions

### JS Math

Math object: `Math`
```lisp
(Math x a1 a2 ... an) // Math[x](a1, a2, ..., an)
(Math .log a1 a2 ... an) // Math.log(a1, a2, ..., an)
```

## Data Structures (abstractions)

Key-Value structure:
```lisp
(kv
  key1NameOrExp value1Expression
  key2NameOrExp value2Expression
  ...
  keyNNameOrExp valueNExpression
)
```

Lists:
```lisp
(ls expression1 expression2 ... expressionN)
```

Get: get a path from a list or an object
```lisp
(get obj key1 ... keyN)
```

Set: set a path to a list or an object
```lisp
(set object key1 key2 ... keyN value)
```

