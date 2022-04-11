const DEBUG = false

export enum TokenType {
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
	Void
}

export type Token = { type: TokenType, data: string | undefined, index: number, line: number, column: number }

export function* tokenise(code: string): Generator<Token, void> {
	let index = 0
	let line = 1
	let column = 1
	let match

	while (index < code.length) {
		if ((match = /^(\n+)(\t*)/.exec(code.slice(index)))) {
			yield createToken(TokenType.Newline, match[2])
			line += match[1]!.length
			column = (match[2]!.length * 4) + 1
			index += match[0]!.length

			if (code[index] == ` `)
				throw new Error(`lines must not begin with whitespace`)
		} else {
			if (!(match = /^ +/.exec(code.slice(index)))) {
				if ((match = /^void(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.Void)
				else if ((match = /^null(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.Null)
				else if ((match = /^f16(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.Float16Type)
				else if ((match = /^f32(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.Float32Type)
				else if ((match = /^f64(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.Float64Type)
				else if ((match = /^f128(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.Float128Type)
				else if ((match = /^u([1-9]\d*)(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.UnsignedIntegerType, match[1])
				else if ((match = /^i([1-9]\d*)(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.SignedIntegerType, match[1])
				else if ((match = /^function *([a-zA-Z_$][$\w]*) *\(/.exec(code.slice(index))))
					yield createToken(TokenType.Function, match[1])
				else if ((match = /^as(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.As)
				else if ((match = /^to(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.To)
				else if ((match = /^type(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.TypeAlias)
				else if ((match = /^let(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.Let)
				else if ((match = /^const(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.Const)
				else if ((match = /^return(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.Return)
				else if ((match = /^if(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.If)
				else if ((match = /^until(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.Until)
				else if ((match = /^do(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.Do)
				else if ((match = /^with(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.With)
				else if ((match = /^else(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.Else)
				else if ((match = /^loop(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.Loop)
				else if ((match = /^import *"(\\"|[^"]+)"/.exec(code.slice(index))))
					yield createToken(TokenType.Import, match[1]!)
				else if ((match = /^break(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.Break, match[1]!)
				else if ((match = /^continue(?![$\w])/.exec(code.slice(index))))
					yield createToken(TokenType.Continue, match[1]!)
				else if ((match = /^\d(?:_?\d)*(?:\.\d(?:_?\d)*)?/.exec(code.slice(index))))
					yield createToken(TokenType.Number, match[0]!)
				else if ((match = /^0[xX][\da-fA-F](?:_?[\da-fA-F])*/.exec(code.slice(index))))
					yield createToken(TokenType.HexNumber, match[0]!.slice(2))
				else if ((match = /^0[oO][0-7](?:_?[0-7])*/.exec(code.slice(index))))
					yield createToken(TokenType.OctalNumber, match[0]!.slice(2))
				else if ((match = /^0[bB][01](?:_?[01])*/.exec(code.slice(index))))
					yield createToken(TokenType.BinaryNumber, match[0]!.slice(2))
				else if ((match = /^"(\\"|[^"]+)"/.exec(code.slice(index))))
					yield createToken(TokenType.String, match[1])
				else if ((match = /^:/.exec(code.slice(index))))
					yield createToken(TokenType.Colon)
				else if ((match = /^([a-zA-Z_$][$\w]*) *\(/.exec(code.slice(index))))
					yield createToken(TokenType.Call, match[1])
				else if ((match = /^\(/.exec(code.slice(index))))
					yield createToken(TokenType.OpenBracket)
				else if ((match = /^\)/.exec(code.slice(index))))
					yield createToken(TokenType.CloseBracket)
				else if ((match = /^{/.exec(code.slice(index))))
					yield createToken(TokenType.OpenSquiglyBracket)
				else if ((match = /^}/.exec(code.slice(index))))
					yield createToken(TokenType.CloseSquiglyBracket)
				else if ((match = /^\[/.exec(code.slice(index))))
					yield createToken(TokenType.OpenSquareBracket)
				else if ((match = /^]/.exec(code.slice(index))))
					yield createToken(TokenType.CloseSquareBracket)
				else if ((match = /^,/.exec(code.slice(index))))
					yield createToken(TokenType.Comma)
				else if ((match = /^\^/.exec(code.slice(index))))
					yield createToken(TokenType.Xor)
				else if ((match = /^\+\+/.exec(code.slice(index))))
					yield createToken(TokenType.Increment)
				else if ((match = /^--/.exec(code.slice(index))))
					yield createToken(TokenType.Decrement)
				else if ((match = /^\+/.exec(code.slice(index))))
					yield createToken(TokenType.Add)
				else if ((match = /^-/.exec(code.slice(index))))
					yield createToken(TokenType.Minus)
				else if ((match = /^\//.exec(code.slice(index))))
					yield createToken(TokenType.Divide)
				else if ((match = /^\*\*/.exec(code.slice(index))))
					yield createToken(TokenType.Power)
				else if ((match = /^\*/.exec(code.slice(index))))
					yield createToken(TokenType.Times)
				else if ((match = /^==/.exec(code.slice(index))))
					yield createToken(TokenType.Equals)
				else if ((match = /^%/.exec(code.slice(index))))
					yield createToken(TokenType.Modulo)
				else if ((match = /^&&/.exec(code.slice(index))))
					yield createToken(TokenType.LogicalAnd)
				else if ((match = /^\|\|/.exec(code.slice(index))))
					yield createToken(TokenType.LogicalOr)
				else if ((match = /^!/.exec(code.slice(index))))
					yield createToken(TokenType.LogicalNot)
				else if ((match = /^\?\?/.exec(code.slice(index))))
					yield createToken(TokenType.NullishCoalesce)
				else if ((match = /^&/.exec(code.slice(index))))
					yield createToken(TokenType.BitwiseAnd)
				else if ((match = /^\|/.exec(code.slice(index))))
					yield createToken(TokenType.Or)
				else if ((match = /^~/.exec(code.slice(index))))
					yield createToken(TokenType.BitwiseNot)
				else if ((match = /^=/.exec(code.slice(index))))
					yield createToken(TokenType.Assign)
				else if ((match = /^\?\./.exec(code.slice(index))))
					yield createToken(TokenType.OptionalChain)
				else if ((match = /^<</.exec(code.slice(index))))
					yield createToken(TokenType.LeftShift)
				else if ((match = /^>>/.exec(code.slice(index))))
					yield createToken(TokenType.RightShift)
				else if ((match = /^[a-zA-Z_$][$\w]*/.exec(code.slice(index))))
					yield createToken(TokenType.Identifier, match[0])
				else {
					yield createToken(TokenType.Error, code[index])
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

	function createToken(type: TokenType, data?: string): Token {
		const token: Token = { type, data, index, line, column }

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (DEBUG)
			console.log(`DEBUG tokenise()`, printToken(token))

		return token
	}
}

export default tokenise

export function printToken(token: Token) {
	if (token.data == undefined)
		return TokenType[token.type]

	return `${TokenType[token.type]} ${JSON.stringify(token.data)}`
}
