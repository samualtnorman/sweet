# Sweet

## Influences
- [JavaScript](https://developer.mozilla.org/en-US/docs/Web/javascript)/[TypeScript](https://www.typescriptlang.org/)
- [Zig](https://ziglang.org/)
- [Lua](https://www.lua.org/)
- [Rust](https://www.rust-lang.org/)
- [Roc](https://www.roc-lang.org/)
- [CoffeeScript](https://coffeescript.org/)

## Notes

### `if`

```sw
if condition
	body
```

is syntactic sugar for:

```sw
if condition then do
	body
```

### `enum`

```sw
enum MyEnum
	Foo
	Bar
	Baz
```

is syntactic sugar for:

```sw
tag MyEnum: MyEnum.Foo ? MyEnum.Bar ? MyEnum.Baz

namespace MyEnum
	tag Foo
	tag Bar
	tag Baz
```

### `when`

```sw
when one is Two { three, four }
	// ...
```

is syntactic sugar for:

```sw
if one is Two
	let { three, four } = one

	// ...
```

### `with`

```sw
with one as Two { three, four }
	// ...
```

is syntactic sugar for:

```sw
block
	let { three, four } = one as Two

	// ...
```

### Operators

#### `+` (plus)

In sweet, the `+` is not the `+` operator from other languages.
It takes take 2 numbers of any type and adds them together.
However it prevents overflow by promoting the types before adding them.
The type the `+` operator evaluates to is bits of the biggest input type plus 1.

e.g. `(a as u4) + (b as u8)` results in a `u9` type.

#### `-` (minus)

Like sweet's `+` operator, the `-` operator also prevents overflow.
Even if given 2 unsigned integer types, the result is always a signed integer type.

## Grammar

Module = Statement\<indent = 0>+

Statement `\t`{indent} Expression `\n`

Expression = Function | Identifier | Tag | Enum | UnaryExpression | BinaryExpression | Rement | Assignment |
	GetMember | VariableDeclaration | Object | Call | String | FunctionType | Import | Array

DeclaredImport = `declare` `import` String `as` `{` DeclaredImportMember (`,` DeclaredImportMember)* `}`

DeclaredImportMember = ((Identifier | String) `as`)? Identifier `:` Expression

Array = `[` (Expression (`,` Expression)*)? `]`

Import = `import` String (`as` (Identifier | ImportDestructure))?

ImportDestructure = `{` (ImportDestructureMember (`,` ImportDestructureMember)*)? `}`

ImportDestructureMember = Identifier (`as` (Identifier | ImportDestructure))?

FunctionType = Expression `->` Expression

String = `"` (`\"` | !`"`)+ `"`

Call = Expression Expression

Object = `{` (ObjectMember (`,` ObjectMember)*)? `}`

ObjectMember = Identifier (`:` Expression)? (`=` Expression)?

VariableDeclaration = `let` (Identifier | Destructure) (`=` Expression)?

Destructure = `{` (DestructureMember (`,` DestructureMember)*)? `}`

DestructureMember = Identifier (`as` (Identifier | Destructure))? (`=` Expression)?

Rement = (Identifier | GetMember) RementOperator

RementOperator = `++` | `--` | `++%` | `--%`

UnaryExpression = UnaryOperator Expression

UnaryOperator = `void` | `-` | `~` | `!`

BinaryExpression = Expression BinaryOperator Expression

BinaryOperator = ArithmeticOperator | RelationalOperator | EqualityOperator | BitwiseShiftOperator |
	BinaryBitwiseOperator | BinaryLogicalOperator | `?` | `..` | `to` | `as`

ArithmeticOperator = `+` | `-` | `/` | `*` | `%` | `**` | `+%` | `-%` | `/%` | `*%` | `**%`

RelationalOperator = `is` | `<` | `>` | `<=` | `>=`

EqualityOperator = `==` | `!=`

BitwiseShiftOperator = `<<` | `>>` | `<<%`

BinaryBitwiseOperator = `&` | `|` | `^`

BinaryLogicalOperator = `&&` | `||` | `??`

Assignment = (Identifier | GetMember | Destructure) AssignmentOperator Expression

GetMember = Expression `.` Identifier

AssignmentOperator = `=` | `+=` | `-=` | `/=` | `*=` | `%=` | `**=` | `+%=` | `-%=` | `/%=` | `*%=` | `**%=` | `<<=` |
	`>>=` | `<<%=` | `&=` | `|=` | `^=` | `&&=` | `||=` | `??=` | `..=` | `:=`

Enum = `enum` Identifier `\n` (`\t`{(indent + 1)} Identifier (`:` Expression)? `\n`)+

Tag = `tag` Identifier (`:` Expression)?

Function = `function` Identifier (Identifier | Object) (`:` Expression)? (`->` Expression)? `\n` Statement\<indent = (indent + 1)>+

Identifier = (`a`-`z` | `A`-`Z` | `_`) (`a`-`z` | `A`-`Z` | `_` | `0`-`9`)*
