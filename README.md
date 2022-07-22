# Sweet

## Notes

### Operators

`<<%=`, `++%`, `--%`, `<<%`, `**%`, `+%=`, `-%=`, `??=`, `<<=`, `>>=`, `&&=`, `||=`, `**=`, `&=`, `|=`, `:=`, `^=`, `+=`, `-=`, `*=`, `!=`, `%=`, `~=`, `<=`, `>=`, `/=`, `<<`, `>>`, `+%`, `-%`, `++`, `--`, `**`, `*%`, `==`, `&&`, `||`, `?.`, `>`, `<`, `.`, `,`, `^`, `+`, `-`, `/`, `*`, `%`, `!`, `&`, `|`, `~`, `=`, `?`

#### `+` (plus)

in sweet, the `+` is not the `+` operator from other languages
it takes take 2 numbers of any type and adds them together
however it prevents overflow by promoting the types before adding them
the type the `+` operator evaluates to is bits of the biggest input type plus 1
e.g. `(a as u4) + (b as u8)` results in a `u9` type

#### `-` (minus)

like sweet's `+` operator, the `-` operator also prevents overflow
even if given 2 unsigned integer types, the result is always a signed integer type

---

`->`, `=>`, `:`, `(`, `)`, `{`, `}`, `[`, `]`, `,`

## Grammar

Module = Statement<0>+

Statement\<indent> `\t`{indent} Expression<indent> `\n`

Expression = Function | Identifier

Function\<indent> = `function` ` `* FunctionSignature `\n` Statement<indent + 1>+

FunctionSignature = Identifier ` `* `(` ` `* FunctionParameters? ` `* `)` (` `* (`->` | `:`?) ` `* Expression)?

FunctionParameters = FunctionParameter (` `* `,` ` `* FunctionParameter)*

FunctionParameter = Identifier (` `* `:` ` `* Expression)?

Identifier = (`a`-`z` | `A`-`Z` | `_` | `$`) (`a`-`z` | `A`-`Z` | `_` | `$` | `0`-`9`)*
