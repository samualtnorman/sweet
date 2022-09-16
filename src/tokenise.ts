/* eslint-disable prefer-named-capture-group */
const DEBUG = false

export enum TokenKind {
	Identifier, Newline, Function, As, To, Type, Let, Constant, Return, If, Until, Do, With, Else, Loop, String, Colon,
	OpenBracket, OpenSquiglyBracket, CloseSquiglyBracket, OpenSquareBracket, CloseSquareBracket, Comma, CloseBracket,
	Xor, Increment, Decrement, Add, Minus, Divide, Power, Times, Equals, Modulo, LogicalAnd, LogicalOr, LogicalNot,
	NullishCoalesce, BitwiseAnd, BitwiseOr, BitwiseNot, Assign, OptionalChain, ShiftLeft, ShiftRight, Error, HexNumber,
	Number, OctalNumber, BinaryNumber, Import, Break, Continue, SignedIntegerType, UnsignedIntegerType, Float16Type,
	Float32Type, Float64Type, Float128Type, Null, Void, True, False, Boolean, While, DeclareFunction, WrappingTimes,
	DeclareModule, Module, Declare, Dot, Arrow, BiggerThan, SmallerThan, For, Tag, Enum, ThickArrow, Private, Internal,
	Match, When, Block, Readonly, Mutable, Abstract, Arguments, Await, Character, Class, Debugger, Default, Delete,
	Double, Evaluate, Export, Extends, Final, Finally, Float, Goto, Implements, In, Instanceof, Integer, Interface,
	Long, Native, New, Package, Protected, Public, Short, Static, Super, Switch, Synchronized, This, Throw, Throws,
	Transient, Try, Typeof, Typeis, Variable, Volatile, Yield, External, Reference, Catch, Self, SelfType, Trait,
	Traits, Methods, Method, Unsafe, Where, Use, Structure, Become, Box, Boxed, Macro, Override, Unsized, Sizeof, Size,
	Virtual, UnionKeyword, Dynamic, Async, Of, Define, Namespace, Comptime, From, Test, Tests, Unless, Any, Unknown,
	Unique, Symbol, Runtime, Opaque, WrappingAdd, WrappingMinus, WrappingDivide, WrappingPower, Is, SmallerThanEquals,
	BiggerThanEquals, NotEquals, WrappingShiftLeft, AddAssign, MinusAssign, DivideAssign, TimesAssign, ModuloAssign,
	PowerAssign, WrappingAddAssign, WrappingMinusAssign, WrappingDivideAssign, WrappingTimesAssign, WrappingPowerAssign,
	ShiftLeftAssign, ShiftRightAssign, WrappingShiftLeftAssign, BitwiseAndAssign, BitwiseOrAssign, XorAssign,
	LogicalAndAssign, LogicalOrAssign, NullishCoalesceAssign, Concatenate, ConcatenateAssign, Union, WrappingIncrement,
	WrappingDecrement, NotKeyword, Walrus, Or, And, Then, Assert, NumberKeyword, Unsigned, Defer, Unreachable, Never,
	NoReturn, ErrorDefer, Clean, ErrorClean, NoClean, Primitive, Spaceship, DotDotDot
}

export type DataTokenKinds = TokenKind.UnsignedIntegerType | TokenKind.SignedIntegerType | TokenKind.BinaryNumber |
	TokenKind.HexNumber | TokenKind.OctalNumber | TokenKind.Number | TokenKind.String | TokenKind.Identifier |
	TokenKind.Newline | TokenKind.Error

export type NonDataToken = {
	kind: Exclude<TokenKind, DataTokenKinds>
	data: undefined
	index: number
	line: number
	column: number
}

export type DataToken = { kind: DataTokenKinds, data: string, index: number, line: number, column: number }
export type Token = NonDataToken | DataToken

export const NonDataTokenDefinitions: { regex: RegExp, tokenKind: Exclude<TokenKind, DataTokenKinds> }[] = [
	{ regex: /^while\b/, tokenKind: TokenKind.While },
	{ regex: /^boolean\b/, tokenKind: TokenKind.Boolean },
	{ regex: /^false\b/, tokenKind: TokenKind.False },
	{ regex: /^true\b/, tokenKind: TokenKind.True },
	{ regex: /^void\b/, tokenKind: TokenKind.Void },
	{ regex: /^null\b/, tokenKind: TokenKind.Null },
	{ regex: /^f16\b/, tokenKind: TokenKind.Float16Type },
	{ regex: /^f32\b/, tokenKind: TokenKind.Float32Type },
	{ regex: /^f64\b/, tokenKind: TokenKind.Float64Type },
	{ regex: /^f128\b/, tokenKind: TokenKind.Float128Type },
	{ regex: /^function\b/, tokenKind: TokenKind.Function },
	{ regex: /^as\b/, tokenKind: TokenKind.As },
	{ regex: /^to\b/, tokenKind: TokenKind.To },
	{ regex: /^type\b/, tokenKind: TokenKind.Type },
	{ regex: /^let\b/, tokenKind: TokenKind.Let },
	{ regex: /^const(?:ant)?\b/, tokenKind: TokenKind.Constant },
	{ regex: /^return\b/, tokenKind: TokenKind.Return },
	{ regex: /^if\b/, tokenKind: TokenKind.If },
	{ regex: /^until\b/, tokenKind: TokenKind.Until },
	{ regex: /^do\b/, tokenKind: TokenKind.Do },
	{ regex: /^with\b/, tokenKind: TokenKind.With },
	{ regex: /^else\b/, tokenKind: TokenKind.Else },
	{ regex: /^loop\b/, tokenKind: TokenKind.Loop },
	{ regex: /^import\b/, tokenKind: TokenKind.Import },
	{ regex: /^break\b/, tokenKind: TokenKind.Break },
	{ regex: /^continue\b/, tokenKind: TokenKind.Continue },
	{ regex: /^declare\b/, tokenKind: TokenKind.Declare },
	{ regex: /^function\b/, tokenKind: TokenKind.Function },
	{ regex: /^mod(?:ule)?\b/, tokenKind: TokenKind.Module },
	{ regex: /^for\b/, tokenKind: TokenKind.For },
	{ regex: /^tag\b/, tokenKind: TokenKind.Tag },
	{ regex: /^enum(?:eration)?\b/, tokenKind: TokenKind.Enum },
	{ regex: /^priv(?:ate)?\b/, tokenKind: TokenKind.Private },
	{ regex: /^internal\b/, tokenKind: TokenKind.Internal },
	{ regex: /^match\b/, tokenKind: TokenKind.Match },
	{ regex: /^when\b/, tokenKind: TokenKind.When },
	{ regex: /^do\b/, tokenKind: TokenKind.Do },
	{ regex: /^block\b/, tokenKind: TokenKind.Block },
	{ regex: /^readonly\b/, tokenKind: TokenKind.Readonly },
	{ regex: /^mut(?:able)?\b/, tokenKind: TokenKind.Mutable },
	{ regex: /^abstract\b/, tokenKind: TokenKind.Abstract },
	{ regex: /^arguments\b/, tokenKind: TokenKind.Arguments },
	{ regex: /^await\b/, tokenKind: TokenKind.Await },
	{ regex: /^async\b/, tokenKind: TokenKind.Async },
	{ regex: /^char(?:acter)?\b/, tokenKind: TokenKind.Character },
	{ regex: /^class\b/, tokenKind: TokenKind.Class },
	{ regex: /^debug(?:ger)?\b/, tokenKind: TokenKind.Debugger },
	{ regex: /^default\b/, tokenKind: TokenKind.Default },
	{ regex: /^delete\b/, tokenKind: TokenKind.Delete },
	{ regex: /^double\b/, tokenKind: TokenKind.Double },
	{ regex: /^eval(?:uate)?\b/, tokenKind: TokenKind.Evaluate },
	{ regex: /^export\b/, tokenKind: TokenKind.Export },
	{ regex: /^extends\b/, tokenKind: TokenKind.Extends },
	{ regex: /^final\b/, tokenKind: TokenKind.Final },
	{ regex: /^finally\b/, tokenKind: TokenKind.Finally },
	{ regex: /^float\b/, tokenKind: TokenKind.Float },
	{ regex: /^goto\b/, tokenKind: TokenKind.Goto },
	{ regex: /^impl(?:ements)?\b/, tokenKind: TokenKind.Implements },
	{ regex: /^in\b/, tokenKind: TokenKind.In },
	{ regex: /^instanceof\b/, tokenKind: TokenKind.Instanceof },
	{ regex: /^int(?:eger)?\b/, tokenKind: TokenKind.Integer },
	{ regex: /^interface\b/, tokenKind: TokenKind.Interface },
	{ regex: /^long\b/, tokenKind: TokenKind.Long },
	{ regex: /^native\b/, tokenKind: TokenKind.Native },
	{ regex: /^new\b/, tokenKind: TokenKind.New },
	{ regex: /^package\b/, tokenKind: TokenKind.Package },
	{ regex: /^protected\b/, tokenKind: TokenKind.Protected },
	{ regex: /^pub(?:lic)?\b/, tokenKind: TokenKind.Public },
	{ regex: /^short\b/, tokenKind: TokenKind.Short },
	{ regex: /^static\b/, tokenKind: TokenKind.Static },
	{ regex: /^super\b/, tokenKind: TokenKind.Super },
	{ regex: /^switch\b/, tokenKind: TokenKind.Switch },
	{ regex: /^syncronized\b/, tokenKind: TokenKind.Synchronized },
	{ regex: /^this\b/, tokenKind: TokenKind.This },
	{ regex: /^throw\b/, tokenKind: TokenKind.Throw },
	{ regex: /^throws\b/, tokenKind: TokenKind.Throws },
	{ regex: /^transient\b/, tokenKind: TokenKind.Transient },
	{ regex: /^try\b/, tokenKind: TokenKind.Try },
	{ regex: /^typeof\b/, tokenKind: TokenKind.Typeof },
	{ regex: /^typeis\b/, tokenKind: TokenKind.Typeis },
	{ regex: /^var(?:iable)?\b/, tokenKind: TokenKind.Variable },
	{ regex: /^volatile\b/, tokenKind: TokenKind.Volatile },
	{ regex: /^yield\b/, tokenKind: TokenKind.Yield },
	{ regex: /^extern(?:al)?\b/, tokenKind: TokenKind.External },
	{ regex: /^ref(?:erence)?\b/, tokenKind: TokenKind.Reference },
	{ regex: /^catch\b/, tokenKind: TokenKind.Catch },
	{ regex: /^self\b/, tokenKind: TokenKind.Self },
	{ regex: /^Self\b/, tokenKind: TokenKind.SelfType },
	{ regex: /^trait\b/, tokenKind: TokenKind.Trait },
	{ regex: /^traits\b/, tokenKind: TokenKind.Traits },
	{ regex: /^methods\b/, tokenKind: TokenKind.Methods },
	{ regex: /^method\b/, tokenKind: TokenKind.Method },
	{ regex: /^unsafe\b/, tokenKind: TokenKind.Unsafe },
	{ regex: /^where\b/, tokenKind: TokenKind.Where },
	{ regex: /^use\b/, tokenKind: TokenKind.Use },
	{ regex: /^struct(?:ure)?\b/, tokenKind: TokenKind.Structure },
	{ regex: /^become\b/, tokenKind: TokenKind.Become },
	{ regex: /^box\b/, tokenKind: TokenKind.Box },
	{ regex: /^boxed\b/, tokenKind: TokenKind.Boxed },
	{ regex: /^macro\b/, tokenKind: TokenKind.Macro },
	{ regex: /^override\b/, tokenKind: TokenKind.Override },
	{ regex: /^unsized\b/, tokenKind: TokenKind.Unsized },
	{ regex: /^sizeof\b/, tokenKind: TokenKind.Sizeof },
	{ regex: /^size\b/, tokenKind: TokenKind.Size },
	{ regex: /^virtual\b/, tokenKind: TokenKind.Virtual },
	{ regex: /^union\b/, tokenKind: TokenKind.UnionKeyword },
	{ regex: /^dyn(?:amic)?\b/, tokenKind: TokenKind.Dynamic },
	{ regex: /^async\b/, tokenKind: TokenKind.Async },
	{ regex: /^of\b/, tokenKind: TokenKind.Of },
	{ regex: /^def(?:ine)?\b/, tokenKind: TokenKind.Define },
	{ regex: /^namespace\b/, tokenKind: TokenKind.Namespace },
	{ regex: /^comptime\b/, tokenKind: TokenKind.Comptime },
	{ regex: /^from\b/, tokenKind: TokenKind.From },
	{ regex: /^test\b/, tokenKind: TokenKind.Test },
	{ regex: /^tests\b/, tokenKind: TokenKind.Tests },
	{ regex: /^unless\b/, tokenKind: TokenKind.Unless },
	{ regex: /^any\b/, tokenKind: TokenKind.Any },
	{ regex: /^unknown\b/, tokenKind: TokenKind.Unknown },
	{ regex: /^unique\b/, tokenKind: TokenKind.Unique },
	{ regex: /^symbol\b/, tokenKind: TokenKind.Symbol },
	{ regex: /^runtime\b/, tokenKind: TokenKind.Runtime },
	{ regex: /^opaque\b/, tokenKind: TokenKind.Opaque },
	{ regex: /^is\b/, tokenKind: TokenKind.Is },
	{ regex: /^or\b/, tokenKind: TokenKind.Or },
	{ regex: /^and\b/, tokenKind: TokenKind.And },
	{ regex: /^then\b/, tokenKind: TokenKind.Then },
	{ regex: /^assert\b/, tokenKind: TokenKind.Assert },
	{ regex: /^number\b/, tokenKind: TokenKind.NumberKeyword },
	{ regex: /^unsigned\b/, tokenKind: TokenKind.Unsigned },
	{ regex: /^defer\b/, tokenKind: TokenKind.Defer },
	{ regex: /^unreachable\b/, tokenKind: TokenKind.Unreachable },
	{ regex: /^never\b/, tokenKind: TokenKind.Never },
	{ regex: /^noreturn\b/, tokenKind: TokenKind.NoReturn },
	{ regex: /^err(?:or)?defer\b/, tokenKind: TokenKind.ErrorDefer },
	{ regex: /^clean\b/, tokenKind: TokenKind.Clean },
	{ regex: /^err(?:or)?clean\b/, tokenKind: TokenKind.ErrorClean },
	{ regex: /^noclean\b/, tokenKind: TokenKind.NoClean },
	{ regex: /^primtive\b/, tokenKind: TokenKind.Primitive },
	{ regex: /^not/, tokenKind: TokenKind.NotKeyword },
	{ regex: /^<=>/, tokenKind: TokenKind.Spaceship },
	{ regex: /^\.\.\./, tokenKind: TokenKind.DotDotDot },
	{ regex: /^\+%/, tokenKind: TokenKind.WrappingAdd },
	{ regex: /^-%/, tokenKind: TokenKind.WrappingMinus },
	{ regex: /^\/%/, tokenKind: TokenKind.WrappingDivide },
	{ regex: /^\*\*%/, tokenKind: TokenKind.WrappingPower },
	{ regex: /^<=/, tokenKind: TokenKind.SmallerThanEquals },
	{ regex: /^>=/, tokenKind: TokenKind.BiggerThanEquals },
	{ regex: /^!=/, tokenKind: TokenKind.NotEquals },
	{ regex: /^<<%/, tokenKind: TokenKind.WrappingShiftLeft },
	{ regex: /^\+=/, tokenKind: TokenKind.AddAssign },
	{ regex: /^\/=/, tokenKind: TokenKind.WrappingDivide },
	{ regex: /^\*=/, tokenKind: TokenKind.TimesAssign },
	{ regex: /^%=/, tokenKind: TokenKind.ModuloAssign },
	{ regex: /^\*\*=/, tokenKind: TokenKind.PowerAssign },
	{ regex: /^\+%=/, tokenKind: TokenKind.WrappingAddAssign },
	{ regex: /^-%=/, tokenKind: TokenKind.WrappingMinusAssign },
	{ regex: /^\/%=/, tokenKind: TokenKind.WrappingDivideAssign },
	{ regex: /^\*%=/, tokenKind: TokenKind.WrappingTimesAssign },
	{ regex: /^\*\*%=/, tokenKind: TokenKind.WrappingPowerAssign },
	{ regex: /^<<=/, tokenKind: TokenKind.ShiftLeftAssign },
	{ regex: /^>>=/, tokenKind: TokenKind.ShiftRightAssign },
	{ regex: /^<<%=/, tokenKind: TokenKind.WrappingShiftLeftAssign },
	{ regex: /^&=/, tokenKind: TokenKind.BitwiseAndAssign },
	{ regex: /^\|=/, tokenKind: TokenKind.BitwiseOrAssign },
	{ regex: /^\^=/, tokenKind: TokenKind.XorAssign },
	{ regex: /^&&=/, tokenKind: TokenKind.LogicalAndAssign },
	{ regex: /^\|\|=/, tokenKind: TokenKind.LogicalOrAssign },
	{ regex: /^\?\?=/, tokenKind: TokenKind.NullishCoalesceAssign },
	{ regex: /^\.\./, tokenKind: TokenKind.Concatenate },
	{ regex: /^\.\.=/, tokenKind: TokenKind.ConcatenateAssign },
	{ regex: /^\?/, tokenKind: TokenKind.Union },
	{ regex: /^\+\+%/, tokenKind: TokenKind.WrappingIncrement },
	{ regex: /^--%/, tokenKind: TokenKind.WrappingDecrement },
	{ regex: /^:=/, tokenKind: TokenKind.Walrus },
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
	{ regex: /^<</, tokenKind: TokenKind.ShiftLeft },
	{ regex: /^>>/, tokenKind: TokenKind.ShiftRight }
]

export const DataTokenDefinitions: { regex: RegExp, tokenKind: DataTokenKinds }[] = [
	{ regex: /^u([1-9]\d*)\b/, tokenKind: TokenKind.UnsignedIntegerType },
	{ regex: /^i([1-9]\d*)\b/, tokenKind: TokenKind.SignedIntegerType },
	{ regex: /^0b[01](?:_?[01])*/, tokenKind: TokenKind.BinaryNumber },
	{ regex: /^0x[\da-fA-F](?:_?[\da-fA-F])*/, tokenKind: TokenKind.HexNumber },
	{ regex: /^0o[0-7](?:_?[0-7])*/, tokenKind: TokenKind.OctalNumber },
	{ regex: /^(\d(?:_?\d)*(?:\.\d(?:_?\d)*)?)/, tokenKind: TokenKind.Number },
	{ regex: /^"((?:\\"|[^"])+)"/, tokenKind: TokenKind.String },
	{ regex: /^([a-zA-Z_]\w*)/, tokenKind: TokenKind.Identifier }
]

export const tokenise = function* (code: string): Generator<Token, void> {
	let index = 0
	let line = 1
	let column = 1
	let match

	const createToken = (kind: TokenKind, data?: string): Token => {
		const token = { kind, data, index, line, column } as Token

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (DEBUG)
			console.log(`DEBUG tokenise()`, printToken(token))

		return token
	}

	while (index < code.length) {
		if ((match = /^((?:(?:\/\/.*)?\r?\n)+)(\t*)/.exec(code.slice(index)))) {
			yield createToken(TokenKind.Newline, match[2]!)
			line += match[1]!.split(``).filter(character => character == `\n`).length
			column = (match[2]!.length * 4) + 1
			index += match[0]!.length

			if (code[index] == ` `)
				throw new Error(`lines must not begin with whitespace`)
		} else {
			checkSpace:
			if (!(match = /^ +/.exec(code.slice(index)))) {
				for (const { regex, tokenKind } of NonDataTokenDefinitions) {
					if ((match = regex.exec(code.slice(index)))) {
						yield createToken(tokenKind)

						break checkSpace
					}
				}

				for (const { regex, tokenKind } of DataTokenDefinitions) {
					if ((match = regex.exec(code.slice(index)))) {
						yield createToken(tokenKind, match[1]!)

						break checkSpace
					}
				}

				yield createToken(TokenKind.Error, code[index]!)
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
