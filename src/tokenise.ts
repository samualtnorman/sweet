/* eslint-disable prefer-named-capture-group */
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
	BitwiseOr,
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
	While,
	DeclareFunction,
	WrappingTimes,
	DeclareModule,
	Module,
	Declare,
	Dot,
	Arrow,
	BiggerThan,
	SmallerThan,
	For,
	Tag,
	Enum,
	ThickArrow,
	Private,
	Internal
}

export type Token = { kind: TokenKind, data: string | undefined, index: number, line: number, column: number }

const tokenRegexes: { regex: RegExp, tokenKind: TokenKind }[] = [
	{ regex: /^while(?![$\w])/, tokenKind: TokenKind.While },
	{ regex: /^boolean(?![$\w])/, tokenKind: TokenKind.Boolean },
	{ regex: /^false(?![$\w])/, tokenKind: TokenKind.False },
	{ regex: /^true(?![$\w])/, tokenKind: TokenKind.True },
	{ regex: /^void(?![$\w])/, tokenKind: TokenKind.Void },
	{ regex: /^null(?![$\w])/, tokenKind: TokenKind.Null },
	{ regex: /^f16(?![$\w])/, tokenKind: TokenKind.Float16Type },
	{ regex: /^f32(?![$\w])/, tokenKind: TokenKind.Float32Type },
	{ regex: /^f64(?![$\w])/, tokenKind: TokenKind.Float64Type },
	{ regex: /^f128(?![$\w])/, tokenKind: TokenKind.Float128Type },
	{ regex: /^function(?![$\w])/, tokenKind: TokenKind.Function },
	{ regex: /^as(?![$\w])/, tokenKind: TokenKind.As },
	{ regex: /^to(?![$\w])/, tokenKind: TokenKind.To },
	{ regex: /^type(?![$\w])/, tokenKind: TokenKind.TypeAlias },
	{ regex: /^let(?![$\w])/, tokenKind: TokenKind.Let },
	{ regex: /^const(?![$\w])/, tokenKind: TokenKind.Const },
	{ regex: /^return(?![$\w])/, tokenKind: TokenKind.Return },
	{ regex: /^if(?![$\w])/, tokenKind: TokenKind.If },
	{ regex: /^until(?![$\w])/, tokenKind: TokenKind.Until },
	{ regex: /^do(?![$\w])/, tokenKind: TokenKind.Do },
	{ regex: /^with(?![$\w])/, tokenKind: TokenKind.With },
	{ regex: /^else(?![$\w])/, tokenKind: TokenKind.Else },
	{ regex: /^loop(?![$\w])/, tokenKind: TokenKind.Loop },
	{ regex: /^import(?![$\w])/, tokenKind: TokenKind.Import },
	{ regex: /^break(?![$\w])/, tokenKind: TokenKind.Break },
	{ regex: /^continue(?![$\w])/, tokenKind: TokenKind.Continue },
	{ regex: /^declare(?![$\w])/, tokenKind: TokenKind.Declare },
	{ regex: /^function(?![$\w])/, tokenKind: TokenKind.Function },
	{ regex: /^module(?![$\w])/, tokenKind: TokenKind.Module },
	{ regex: /^for(?![$\w])/, tokenKind: TokenKind.For },
	{ regex: /^tag(?![$\w])/, tokenKind: TokenKind.Tag },
	{ regex: /^enum(?![$\w])/, tokenKind: TokenKind.Enum },
	{ regex: /^private(?![$\w])/, tokenKind: TokenKind.Private },
	{ regex: /^internal(?![$\w])/, tokenKind: TokenKind.Internal },
	{ regex: /^>/, tokenKind: TokenKind.BiggerThan },
	{ regex: /^</, tokenKind: TokenKind.SmallerThan },
	{ regex: /^\./, tokenKind: TokenKind.Dot },
	{ regex: /^->/, tokenKind: TokenKind.Arrow },
	{ regex: /^=>/, tokenKind: TokenKind.ThickArrow },
	{ regex: /^:/, tokenKind: TokenKind.Colon },
	{ regex: /^\(/, tokenKind: TokenKind.OpenBracket },
	{ regex: /^\)/, tokenKind: TokenKind.CloseBracket },
	{ regex: /^\{/, tokenKind: TokenKind.OpenSquiglyBracket },
	{ regex: /^\}/, tokenKind: TokenKind.CloseSquiglyBracket },
	{ regex: /^\[/, tokenKind: TokenKind.OpenSquareBracket },
	{ regex: /^\]/, tokenKind: TokenKind.CloseSquareBracket },
	{ regex: /^,/, tokenKind: TokenKind.Comma },
	{ regex: /^\^/, tokenKind: TokenKind.Xor },
	{ regex: /^\+\+/, tokenKind: TokenKind.Increment },
	{ regex: /^--/, tokenKind: TokenKind.Decrement },
	{ regex: /^\+/, tokenKind: TokenKind.Add },
	{ regex: /^-/, tokenKind: TokenKind.Minus },
	{ regex: /^\//, tokenKind: TokenKind.Divide },
	{ regex: /^\*\*/, tokenKind: TokenKind.Power },
	{ regex: /^\*%/, tokenKind: TokenKind.WrappingTimes },
	{ regex: /^\*/, tokenKind: TokenKind.Times },
	{ regex: /^==/, tokenKind: TokenKind.Equals },
	{ regex: /^%/, tokenKind: TokenKind.Modulo },
	{ regex: /^&&/, tokenKind: TokenKind.LogicalAnd },
	{ regex: /^\|\|/, tokenKind: TokenKind.LogicalOr },
	{ regex: /^!/, tokenKind: TokenKind.LogicalNot },
	{ regex: /^&/, tokenKind: TokenKind.BitwiseAnd },
	{ regex: /^\|/, tokenKind: TokenKind.BitwiseOr },
	{ regex: /^~/, tokenKind: TokenKind.BitwiseNot },
	{ regex: /^=/, tokenKind: TokenKind.Assign },
	{ regex: /^\?\./, tokenKind: TokenKind.OptionalChain },
	{ regex: /^<</, tokenKind: TokenKind.LeftShift },
	{ regex: /^>>/, tokenKind: TokenKind.RightShift },
	{ regex: /^u([1-9]\d*)(?![$\w])/, tokenKind: TokenKind.UnsignedIntegerType },
	{ regex: /^i([1-9]\d*)(?![$\w])/, tokenKind: TokenKind.SignedIntegerType },
	{ regex: /^0b[01](?:_?[01])*/, tokenKind: TokenKind.BinaryNumber },
	{ regex: /^0x[\da-fA-F](?:_?[\da-fA-F])*/, tokenKind: TokenKind.HexNumber },
	{ regex: /^0o[0-7](?:_?[0-7])*/, tokenKind: TokenKind.OctalNumber },
	{ regex: /^\d(?:_?\d)*(?:\.\d(?:_?\d)*)?/, tokenKind: TokenKind.Number },
	{ regex: /^"(\\"|[^"]+)"/, tokenKind: TokenKind.String },
	{ regex: /^'(\\'|[^']+)'/, tokenKind: TokenKind.String },
	{ regex: /^([a-zA-Z_$][$\w]*) *\(/, tokenKind: TokenKind.Call },
	{ regex: /^([a-zA-Z_$][$\w]*)/, tokenKind: TokenKind.Identifier }
]

export const tokenise = function* (code: string): Generator<Token, void> {
	let index = 0
	let line = 1
	let column = 1
	let match

	const createToken = (kind: TokenKind, data?: string): Token => {
		const token: Token = { kind, data, index, line, column }

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (DEBUG)
			console.log(`DEBUG tokenise()`, printToken(token))

		return token
	}

	while (index < code.length) {
		if ((match = /^((?:(?:\/\/.*)?\r?\n)+)(\t*)/.exec(code.slice(index)))) {
			yield createToken(TokenKind.Newline, match[2])
			line += match[1]!.split(``).filter(character => character == `\n`).length
			column = (match[2]!.length * 4) + 1
			index += match[0]!.length

			if (code[index] == ` `)
				throw new Error(`lines must not begin with whitespace`)
		} else {
			checkSpace:
			if (!(match = /^ +/.exec(code.slice(index)))) {
				for (const { regex, tokenKind } of tokenRegexes) {
					if ((match = regex.exec(code.slice(index)))) {
						yield createToken(tokenKind, match[1])

						break checkSpace
					}
				}

				yield createToken(TokenKind.Error, code[index])
				column++
				index++

				continue
			}

			column += match[0]!.length
			index += match[0]!.length
		}
	}

	return undefined
}

export default tokenise

export const printToken = (token: Token) => {
	if (token.data == undefined)
		return TokenKind[token.kind]

	return `${TokenKind[token.kind]} ${JSON.stringify(token.data)}`
}
