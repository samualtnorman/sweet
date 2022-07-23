# Sweet

## Notes

### Operators

#### `+` (plus)

in sweet, the `+` is not the `+` operator from other languages
it takes take 2 numbers of any type and adds them together
however it prevents overflow by promoting the types before adding them
the type the `+` operator evaluates to is bits of the biggest input type plus 1
e.g. `(a as u4) + (b as u8)` results in a `u9` type

#### `-` (minus)

like sweet's `+` operator, the `-` operator also prevents overflow
even if given 2 unsigned integer types, the result is always a signed integer type

## Grammar

Module = Statement\<indent = 0>+

Statement `\t`{indent} Expression `\n`

Expression = Function | Identifier | Tag | Enum | UnaryExpression | BinaryExpression | Rement | Assignment

Rement = Identifier RementOperator

RementOperator = `++` | `--` | `++%` | `--%`

UnaryExpression = UnaryOperator Expression

UnaryOperator = `void` | `-` | `~` | `!`

BinaryExpression = Expression ` `* BinaryOperator ` `* Expression

BinaryOperator = ArithmeticOperator | RelationalOperator | EqualityOperator | BitwiseShiftOperator |
	BinaryBitwiseOperator | BinaryLogicalOperators

ArithmeticOperator = `+` | `-` | `/` | `*` | `%` | `**` | `+%` | `-%` | `/%` | `*%` | `**%`

RelationalOperator = `is` | `<` | `>` | `<=` | `>=`

EqualityOperator = `==` | `!=`

BitwiseShiftOperator = `<<` | `>>` | `<<%`

BinaryBitwiseOperator = `&` | `|` | `^`

BinaryLogicalOperators = `&&` | `||` | `??`

Assignment = Identifier ` `+ AssignmentOperator Expression

AssignmentOperator = `=` | `+=` | `-=` | `/=` | `*=` | `%=` | `**=` | `+%=` | `-%=` | `/%=` | `*%=` | `**%=` | `<<=` |
	`>>=` | `<<%=` | `&=` | `|=` | `^=` | `&&=` | `||=` | `??=`

Enum = `enum` ` `+ Identifier `\n` (`\t`{(indent + 1)} Identifier (` `* `:` ` `* Expression)? `\n`)+

Tag = `tag` ` `+ Identifier (` `* `:` ` `* Expression)?

Function = `function` ` `+ FunctionSignature `\n` Statement\<indent = (indent + 1)>+

FunctionSignature = Identifier ` `* `(` ` `* FunctionParameters? ` `* `)` (` `* (`->` | `:`?) ` `* Expression)?

FunctionParameters = FunctionParameter (` `* `,` ` `* FunctionParameter)*

FunctionParameter = Identifier (` `* `:` ` `* Expression)?

Identifier = (`a`-`z` | `A`-`Z` | `_` | `$`) (`a`-`z` | `A`-`Z` | `_` | `$` | `0`-`9`)*
