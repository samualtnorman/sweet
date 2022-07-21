const DEBUG = false

export enum TokenKind {
	Identifier,
	Newline,
	Function,
	As,
	To,
	TypeAlias,
	Let,
	Const,
	Return,
	If,
	Until,
	Do,
	With,
	Else,
	Loop,
	String,
	Colon,
	Call,
	OpenBracket,
	OpenSquiglyBracket,
	CloseSquiglyBracket,
	OpenSquareBracket,
	CloseSquareBracket,
	Comma,
	CloseBracket,
	Xor,
	Increment,
	Decrement,
	Add,
	Minus,
	Divide,
	Power,
	Times,
	Equals,
	Modulo,
	LogicalAnd,
	LogicalOr,
	LogicalNot,
	NullishCoalesce,
	BitwiseAnd,
	Or,
	BitwiseNot,
	Assign,
	OptionalChain,
	LeftShift,
	RightShift,
	Error,
	HexNumber,
	Number,
	OctalNumber,
	BinaryNumber,
	Import,
	Break,
	Continue,
	SignedIntegerType,
	UnsignedIntegerType,
	Float16Type,
	Float32Type,
	Float64Type,
	Float128Type,
	Null,
	Void,
	True,
	False,
	Boolean,
	While
}

export type Token = { kind: TokenKind, data: string | undefined, index: number, line: number, column: number }

export function* tokenise(code: string): Generator<Token, void> {
	let index = 0
	let line = 1
	let column = 1
	let match

	while (index < code.length) {
		if ((match = /^((?:(?:\/\/.*)?\r?\n)+)(\t*)/.exec(code.slice(index)))) {
			yield createToken(TokenKind.Newline, match[2])
			line += match[1]!.split(``).filter(character => character == `\n`).length
			column = (match[2]!.length * 4) + 1
			index += match[0]!.length

			if (code[index] == ` `)
				throw new Error(`lines must not begin with whitespace`)
		} else {
			if (!(match = /^ +/.exec(code.slice(index)))) {
				if ((match = /^while(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.While)
				else if ((match = /^boolean(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.Boolean)
				else if ((match = /^false(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.False)
				else if ((match = /^true(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.True)
				else if ((match = /^void(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.Void)
				else if ((match = /^null(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.Null)
				else if ((match = /^f16(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.Float16Type)
				else if ((match = /^f32(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.Float32Type)
				else if ((match = /^f64(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.Float64Type)
				else if ((match = /^f128(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.Float128Type)
				else if ((match = /^u([1-9]\d*)(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.UnsignedIntegerType, match[1])
				else if ((match = /^i([1-9]\d*)(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.SignedIntegerType, match[1])
				else if ((match = /^function *([a-zA-Z_$][$\w]*) *\(/.exec(code.slice(index))))
					yield createToken(TokenKind.Function, match[1])
				else if ((match = /^as(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.As)
				else if ((match = /^to(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.To)
				else if ((match = /^type(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.TypeAlias)
				else if ((match = /^let(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.Let)
				else if ((match = /^const(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.Const)
				else if ((match = /^return(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.Return)
				else if ((match = /^if(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.If)
				else if ((match = /^until(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.Until)
				else if ((match = /^do(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.Do)
				else if ((match = /^with(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.With)
				else if ((match = /^else(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.Else)
				else if ((match = /^loop(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.Loop)
				else if ((match = /^import *"(\\"|[^"]+)"/.exec(code.slice(index))))
					yield createToken(TokenKind.Import, match[1]!)
				else if ((match = /^break(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.Break, match[1]!)
				else if ((match = /^continue(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenKind.Continue, match[1]!)
				else if ((match = /^\d(?:_?\d)*(?:\.\d(?:_?\d)*)?/.exec(code.slice(index))))
					yield createToken(TokenKind.Number, match[0]!)
				else if ((match = /^0[xX][\da-fA-F](?:_?[\da-fA-F])*/.exec(code.slice(index))))
					yield createToken(TokenKind.HexNumber, match[0]!.slice(2))
				else if ((match = /^0[oO][0-7](?:_?[0-7])*/.exec(code.slice(index))))
					yield createToken(TokenKind.OctalNumber, match[0]!.slice(2))
				else if ((match = /^0[bB][01](?:_?[01])*/.exec(code.slice(index))))
					yield createToken(TokenKind.BinaryNumber, match[0]!.slice(2))
				else if ((match = /^"(\\"|[^"]+)"/.exec(code.slice(index))))
					yield createToken(TokenKind.String, match[1])
				else if ((match = /^:/.exec(code.slice(index))))
					yield createToken(TokenKind.Colon)
				else if ((match = /^([a-zA-Z_$][$\w]*) *\(/.exec(code.slice(index))))
					yield createToken(TokenKind.Call, match[1])
				else if ((match = /^\(/.exec(code.slice(index))))
					yield createToken(TokenKind.OpenBracket)
				else if ((match = /^\)/.exec(code.slice(index))))
					yield createToken(TokenKind.CloseBracket)
				else if ((match = /^{/.exec(code.slice(index))))
					yield createToken(TokenKind.OpenSquiglyBracket)
				else if ((match = /^}/.exec(code.slice(index))))
					yield createToken(TokenKind.CloseSquiglyBracket)
				else if ((match = /^\[/.exec(code.slice(index))))
					yield createToken(TokenKind.OpenSquareBracket)
				else if ((match = /^]/.exec(code.slice(index))))
					yield createToken(TokenKind.CloseSquareBracket)
				else if ((match = /^,/.exec(code.slice(index))))
					yield createToken(TokenKind.Comma)
				else if ((match = /^\^/.exec(code.slice(index))))
					yield createToken(TokenKind.Xor)
				else if ((match = /^\+\+/.exec(code.slice(index))))
					yield createToken(TokenKind.Increment)
				else if ((match = /^--/.exec(code.slice(index))))
					yield createToken(TokenKind.Decrement)
				else if ((match = /^\+/.exec(code.slice(index))))
					yield createToken(TokenKind.Add)
				else if ((match = /^-/.exec(code.slice(index))))
					yield createToken(TokenKind.Minus)
				else if ((match = /^\//.exec(code.slice(index))))
					yield createToken(TokenKind.Divide)
				else if ((match = /^\*\*/.exec(code.slice(index))))
					yield createToken(TokenKind.Power)
				else if ((match = /^\*/.exec(code.slice(index))))
					yield createToken(TokenKind.Times)
				else if ((match = /^==/.exec(code.slice(index))))
					yield createToken(TokenKind.Equals)
				else if ((match = /^%/.exec(code.slice(index))))
					yield createToken(TokenKind.Modulo)
				else if ((match = /^&&/.exec(code.slice(index))))
					yield createToken(TokenKind.LogicalAnd)
				else if ((match = /^\|\|/.exec(code.slice(index))))
					yield createToken(TokenKind.LogicalOr)
				else if ((match = /^!/.exec(code.slice(index))))
					yield createToken(TokenKind.LogicalNot)
				else if ((match = /^\?\?/.exec(code.slice(index))))
					yield createToken(TokenKind.NullishCoalesce)
				else if ((match = /^&/.exec(code.slice(index))))
					yield createToken(TokenKind.BitwiseAnd)
				else if ((match = /^\|/.exec(code.slice(index))))
					yield createToken(TokenKind.Or)
				else if ((match = /^~/.exec(code.slice(index))))
					yield createToken(TokenKind.BitwiseNot)
				else if ((match = /^=/.exec(code.slice(index))))
					yield createToken(TokenKind.Assign)
				else if ((match = /^\?\./.exec(code.slice(index))))
					yield createToken(TokenKind.OptionalChain)
				else if ((match = /^<</.exec(code.slice(index))))
					yield createToken(TokenKind.LeftShift)
				else if ((match = /^>>/.exec(code.slice(index))))
					yield createToken(TokenKind.RightShift)
				else if ((match = /^[a-zA-Z_$][$\w]*/.exec(code.slice(index))))
					yield createToken(TokenKind.Identifier, match[0])
				else {
					yield createToken(TokenKind.Error, code[index])
					column++
					index++

					continue
				}
			}

			column += match[0]!.length
			index += match[0]!.length
		}
	}

	return undefined

	function createToken(kind: TokenKind, data?: string): Token {
		const token: Token = { kind, data, index, line, column }

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (DEBUG)
			console.log(`DEBUG tokenise()`, printToken(token))

		return token
	}
}

export default tokenise

export function printToken(token: Token) {
	if (token.data == undefined)
		return TokenKind[token.kind]

	return `${TokenKind[token.kind]} ${JSON.stringify(token.data)}`
}
