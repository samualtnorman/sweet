/* eslint-disable prefer-named-capture-group */
const DEBUG = false

export type Token = NonDataToken | DataToken

export type NonDataToken =
	{ kind: Exclude<TokenKind, DataTokenKind>, data: undefined, index: number, line: number, column: number }

export type DataToken = { kind: DataTokenKind, data: string, index: number, line: number, column: number }

export type DataTokenKind = TokenKind.BinaryNumber | TokenKind.Error | TokenKind.HexNumber | TokenKind.Identifier |
	TokenKind.Newline | TokenKind.Number | TokenKind.OctalNumber | TokenKind.SignedIntegerType | TokenKind.String |
	TokenKind.UnsignedIntegerType

export enum TokenKind {
	Abstract = 1, Add, AddAssign, And, Any, Arguments, Arrow, As, Assert, Assign, Async, Await, Become, BiggerThan,
	BiggerThanEquals, BinaryNumber, BitwiseAnd, BitwiseAndAssign, BitwiseNot, BitwiseOr, BitwiseOrAssign, Block,
	Boolean, Box, Boxed, Break, Catch, Character, Class, Clean, CloseBracket, CloseSquareBracket, CloseSquiglyBracket,
	Colon, Comma, Comptime, Concatenate, ConcatenateAssign, Constant, Continue, Debugger, Declare, DeclareFunction,
	DeclareModule, Decrement, Default, Defer, Define, Delete, Divide, DivideAssign, Do, Dot, DotDotDot, Double, Dynamic,
	Else, Enum, Equals, Error, ErrorClean, ErrorDefer, Evaluate, Export, Extends, External, False, Final, Finally,
	Float, Float128Type, Float16Type, Float32Type, Float64Type, For, From, Function, Goto, HexNumber, Identifier, If,
	Implements, Import, In, Increment, Instanceof, Integer, Interface, Internal, Is, Let, LogicalAnd, LogicalAndAssign,
	LogicalNot, LogicalOr, LogicalOrAssign, Long, Loop, Macro, Match, Method, Methods, Minus, MinusAssign, Module,
	Modulo, ModuloAssign, Mutable, Namespace, Native, Never, New, Newline, NoClean, NoReturn, NotEquals, NotKeyword,
	Null, NullishCoalesce, NullishCoalesceAssign, Number, NumberKeyword, Object, OctalNumber, Of, Opaque, OpenBracket,
	OpenSquareBracket, OpenSquiglyBracket, OptionalChain, Or, Override, Package, Power, PowerAssign, Primitive, Private,
	Protected, Public, Readonly, Reference, Return, Runtime, Self, SelfType, ShiftLeft, ShiftLeftAssign, ShiftRight,
	ShiftRightAssign, Short, SignedIntegerType, Size, Sizeof, SmallerThan, SmallerThanEquals, Spaceship, Static, String,
	Structure, Super, Switch, Symbol, Synchronized, Tag, Test, Tests, Then, ThickArrow, This, Throw, Throws, Times,
	TimesAssign, To, Trait, Traits, Transient, True, Try, Type, Typeis, Typeof, Union, UnionKeyword, Unique, Unknown,
	Unless, Unreachable, Unsafe, Unsigned, UnsignedIntegerType, Unsized, Until, Use, Variable, Virtual, Void, Volatile,
	Walrus, When, Where, While, With, WrappingAdd, WrappingAddAssign, WrappingDecrement, WrappingDivide,
	WrappingDivideAssign, WrappingIncrement, WrappingMinus, WrappingMinusAssign, WrappingPower, WrappingPowerAssign,
	WrappingShiftLeft, WrappingShiftLeftAssign, WrappingTimes, WrappingTimesAssign, Xor, XorAssign, Yield
}

export const NonDataTokenDefinitions: { regex: RegExp, tokenKind: Exclude<TokenKind, DataTokenKind> }[] = [
	{ regex: /^yield\b/, tokenKind: TokenKind.Yield },
	{ regex: /^with\b/, tokenKind: TokenKind.With },
	{ regex: /^while\b/, tokenKind: TokenKind.While },
	{ regex: /^where\b/, tokenKind: TokenKind.Where },
	{ regex: /^when\b/, tokenKind: TokenKind.When },
	{ regex: /^volatile\b/, tokenKind: TokenKind.Volatile },
	{ regex: /^void\b/, tokenKind: TokenKind.Void },
	{ regex: /^virtual\b/, tokenKind: TokenKind.Virtual },
	{ regex: /^var(?:iable)?\b/, tokenKind: TokenKind.Variable },
	{ regex: /^use\b/, tokenKind: TokenKind.Use },
	{ regex: /^until\b/, tokenKind: TokenKind.Until },
	{ regex: /^unsized\b/, tokenKind: TokenKind.Unsized },
	{ regex: /^unsigned\b/, tokenKind: TokenKind.Unsigned },
	{ regex: /^unsafe\b/, tokenKind: TokenKind.Unsafe },
	{ regex: /^unreachable\b/, tokenKind: TokenKind.Unreachable },
	{ regex: /^unless\b/, tokenKind: TokenKind.Unless },
	{ regex: /^unknown\b/, tokenKind: TokenKind.Unknown },
	{ regex: /^unique\b/, tokenKind: TokenKind.Unique },
	{ regex: /^union\b/, tokenKind: TokenKind.UnionKeyword },
	{ regex: /^typeof\b/, tokenKind: TokenKind.Typeof },
	{ regex: /^typeis\b/, tokenKind: TokenKind.Typeis },
	{ regex: /^type\b/, tokenKind: TokenKind.Type },
	{ regex: /^try\b/, tokenKind: TokenKind.Try },
	{ regex: /^true\b/, tokenKind: TokenKind.True },
	{ regex: /^transient\b/, tokenKind: TokenKind.Transient },
	{ regex: /^traits\b/, tokenKind: TokenKind.Traits },
	{ regex: /^trait\b/, tokenKind: TokenKind.Trait },
	{ regex: /^to\b/, tokenKind: TokenKind.To },
	{ regex: /^throws\b/, tokenKind: TokenKind.Throws },
	{ regex: /^throw\b/, tokenKind: TokenKind.Throw },
	{ regex: /^this\b/, tokenKind: TokenKind.This },
	{ regex: /^then\b/, tokenKind: TokenKind.Then },
	{ regex: /^tests\b/, tokenKind: TokenKind.Tests },
	{ regex: /^test\b/, tokenKind: TokenKind.Test },
	{ regex: /^tag\b/, tokenKind: TokenKind.Tag },
	{ regex: /^syncronized\b/, tokenKind: TokenKind.Synchronized },
	{ regex: /^symbol\b/, tokenKind: TokenKind.Symbol },
	{ regex: /^switch\b/, tokenKind: TokenKind.Switch },
	{ regex: /^super\b/, tokenKind: TokenKind.Super },
	{ regex: /^struct(?:ure)?\b/, tokenKind: TokenKind.Structure },
	{ regex: /^static\b/, tokenKind: TokenKind.Static },
	{ regex: /^sizeof\b/, tokenKind: TokenKind.Sizeof },
	{ regex: /^size\b/, tokenKind: TokenKind.Size },
	{ regex: /^short\b/, tokenKind: TokenKind.Short },
	{ regex: /^self\b/, tokenKind: TokenKind.Self },
	{ regex: /^Self\b/, tokenKind: TokenKind.SelfType },
	{ regex: /^runtime\b/, tokenKind: TokenKind.Runtime },
	{ regex: /^return\b/, tokenKind: TokenKind.Return },
	{ regex: /^ref(?:erence)?\b/, tokenKind: TokenKind.Reference },
	{ regex: /^readonly\b/, tokenKind: TokenKind.Readonly },
	{ regex: /^pub(?:lic)?\b/, tokenKind: TokenKind.Public },
	{ regex: /^protected\b/, tokenKind: TokenKind.Protected },
	{ regex: /^priv(?:ate)?\b/, tokenKind: TokenKind.Private },
	{ regex: /^primtive\b/, tokenKind: TokenKind.Primitive },
	{ regex: /^package\b/, tokenKind: TokenKind.Package },
	{ regex: /^override\b/, tokenKind: TokenKind.Override },
	{ regex: /^or\b/, tokenKind: TokenKind.Or },
	{ regex: /^opaque\b/, tokenKind: TokenKind.Opaque },
	{ regex: /^of\b/, tokenKind: TokenKind.Of },
	{ regex: /^object\b/, tokenKind: TokenKind.Object },
	{ regex: /^number\b/, tokenKind: TokenKind.NumberKeyword },
	{ regex: /^null\b/, tokenKind: TokenKind.Null },
	{ regex: /^not/, tokenKind: TokenKind.NotKeyword },
	{ regex: /^noreturn\b/, tokenKind: TokenKind.NoReturn },
	{ regex: /^noclean\b/, tokenKind: TokenKind.NoClean },
	{ regex: /^new\b/, tokenKind: TokenKind.New },
	{ regex: /^never\b/, tokenKind: TokenKind.Never },
	{ regex: /^native\b/, tokenKind: TokenKind.Native },
	{ regex: /^namespace\b/, tokenKind: TokenKind.Namespace },
	{ regex: /^mut(?:able)?\b/, tokenKind: TokenKind.Mutable },
	{ regex: /^mod(?:ule)?\b/, tokenKind: TokenKind.Module },
	{ regex: /^methods\b/, tokenKind: TokenKind.Methods },
	{ regex: /^method\b/, tokenKind: TokenKind.Method },
	{ regex: /^match\b/, tokenKind: TokenKind.Match },
	{ regex: /^macro\b/, tokenKind: TokenKind.Macro },
	{ regex: /^loop\b/, tokenKind: TokenKind.Loop },
	{ regex: /^long\b/, tokenKind: TokenKind.Long },
	{ regex: /^let\b/, tokenKind: TokenKind.Let },
	{ regex: /^is\b/, tokenKind: TokenKind.Is },
	{ regex: /^internal\b/, tokenKind: TokenKind.Internal },
	{ regex: /^interface\b/, tokenKind: TokenKind.Interface },
	{ regex: /^int(?:eger)?\b/, tokenKind: TokenKind.Integer },
	{ regex: /^instanceof\b/, tokenKind: TokenKind.Instanceof },
	{ regex: /^in\b/, tokenKind: TokenKind.In },
	{ regex: /^import\b/, tokenKind: TokenKind.Import },
	{ regex: /^impl(?:ements)?\b/, tokenKind: TokenKind.Implements },
	{ regex: /^if\b/, tokenKind: TokenKind.If },
	{ regex: /^goto\b/, tokenKind: TokenKind.Goto },
	{ regex: /^function\b/, tokenKind: TokenKind.Function },
	{ regex: /^from\b/, tokenKind: TokenKind.From },
	{ regex: /^for\b/, tokenKind: TokenKind.For },
	{ regex: /^float\b/, tokenKind: TokenKind.Float },
	{ regex: /^finally\b/, tokenKind: TokenKind.Finally },
	{ regex: /^final\b/, tokenKind: TokenKind.Final },
	{ regex: /^false\b/, tokenKind: TokenKind.False },
	{ regex: /^f64\b/, tokenKind: TokenKind.Float64Type },
	{ regex: /^f32\b/, tokenKind: TokenKind.Float32Type },
	{ regex: /^f16\b/, tokenKind: TokenKind.Float16Type },
	{ regex: /^f128\b/, tokenKind: TokenKind.Float128Type },
	{ regex: /^extern(?:al)?\b/, tokenKind: TokenKind.External },
	{ regex: /^extends\b/, tokenKind: TokenKind.Extends },
	{ regex: /^export\b/, tokenKind: TokenKind.Export },
	{ regex: /^eval(?:uate)?\b/, tokenKind: TokenKind.Evaluate },
	{ regex: /^err(?:or)?defer\b/, tokenKind: TokenKind.ErrorDefer },
	{ regex: /^err(?:or)?clean\b/, tokenKind: TokenKind.ErrorClean },
	{ regex: /^enum(?:eration)?\b/, tokenKind: TokenKind.Enum },
	{ regex: /^else\b/, tokenKind: TokenKind.Else },
	{ regex: /^dyn(?:amic)?\b/, tokenKind: TokenKind.Dynamic },
	{ regex: /^double\b/, tokenKind: TokenKind.Double },
	{ regex: /^do\b/, tokenKind: TokenKind.Do },
	{ regex: /^delete\b/, tokenKind: TokenKind.Delete },
	{ regex: /^defer\b/, tokenKind: TokenKind.Defer },
	{ regex: /^default\b/, tokenKind: TokenKind.Default },
	{ regex: /^def(?:ine)?\b/, tokenKind: TokenKind.Define },
	{ regex: /^declare\b/, tokenKind: TokenKind.Declare },
	{ regex: /^debug(?:ger)?\b/, tokenKind: TokenKind.Debugger },
	{ regex: /^continue\b/, tokenKind: TokenKind.Continue },
	{ regex: /^const(?:ant)?\b/, tokenKind: TokenKind.Constant },
	{ regex: /^comptime\b/, tokenKind: TokenKind.Comptime },
	{ regex: /^clean\b/, tokenKind: TokenKind.Clean },
	{ regex: /^class\b/, tokenKind: TokenKind.Class },
	{ regex: /^char(?:acter)?\b/, tokenKind: TokenKind.Character },
	{ regex: /^catch\b/, tokenKind: TokenKind.Catch },
	{ regex: /^break\b/, tokenKind: TokenKind.Break },
	{ regex: /^boxed\b/, tokenKind: TokenKind.Boxed },
	{ regex: /^box\b/, tokenKind: TokenKind.Box },
	{ regex: /^boolean\b/, tokenKind: TokenKind.Boolean },
	{ regex: /^block\b/, tokenKind: TokenKind.Block },
	{ regex: /^become\b/, tokenKind: TokenKind.Become },
	{ regex: /^await\b/, tokenKind: TokenKind.Await },
	{ regex: /^async\b/, tokenKind: TokenKind.Async },
	{ regex: /^assert\b/, tokenKind: TokenKind.Assert },
	{ regex: /^as\b/, tokenKind: TokenKind.As },
	{ regex: /^arguments\b/, tokenKind: TokenKind.Arguments },
	{ regex: /^any\b/, tokenKind: TokenKind.Any },
	{ regex: /^and\b/, tokenKind: TokenKind.And },
	{ regex: /^abstract\b/, tokenKind: TokenKind.Abstract },
	{ regex: /^~/, tokenKind: TokenKind.BitwiseNot },
	{ regex: /^\}/, tokenKind: TokenKind.CloseSquiglyBracket },
	{ regex: /^\|\|=/, tokenKind: TokenKind.LogicalOrAssign },
	{ regex: /^\|\|/, tokenKind: TokenKind.LogicalOr },
	{ regex: /^\|=/, tokenKind: TokenKind.BitwiseOrAssign },
	{ regex: /^\|/, tokenKind: TokenKind.BitwiseOr },
	{ regex: /^\{/, tokenKind: TokenKind.OpenSquiglyBracket },
	{ regex: /^\^=/, tokenKind: TokenKind.XorAssign },
	{ regex: /^\^/, tokenKind: TokenKind.Xor },
	{ regex: /^\]/, tokenKind: TokenKind.CloseSquareBracket },
	{ regex: /^\[/, tokenKind: TokenKind.OpenSquareBracket },
	{ regex: /^\?\?=/, tokenKind: TokenKind.NullishCoalesceAssign },
	{ regex: /^\?\?/, tokenKind: TokenKind.NullishCoalesce },
	{ regex: /^\?\./, tokenKind: TokenKind.OptionalChain },
	{ regex: /^\?/, tokenKind: TokenKind.Union },
	{ regex: /^\/=/, tokenKind: TokenKind.DivideAssign },
	{ regex: /^\/%=/, tokenKind: TokenKind.WrappingDivideAssign },
	{ regex: /^\/%/, tokenKind: TokenKind.WrappingDivide },
	{ regex: /^\//, tokenKind: TokenKind.Divide },
	{ regex: /^\.\.\./, tokenKind: TokenKind.DotDotDot },
	{ regex: /^\.\.=/, tokenKind: TokenKind.ConcatenateAssign },
	{ regex: /^\.\./, tokenKind: TokenKind.Concatenate },
	{ regex: /^\./, tokenKind: TokenKind.Dot },
	{ regex: /^\+\+%/, tokenKind: TokenKind.WrappingIncrement },
	{ regex: /^\+\+/, tokenKind: TokenKind.Increment },
	{ regex: /^\+=/, tokenKind: TokenKind.AddAssign },
	{ regex: /^\+%=/, tokenKind: TokenKind.WrappingAddAssign },
	{ regex: /^\+%/, tokenKind: TokenKind.WrappingAdd },
	{ regex: /^\+/, tokenKind: TokenKind.Add },
	{ regex: /^\*\*=/, tokenKind: TokenKind.PowerAssign },
	{ regex: /^\*\*%=/, tokenKind: TokenKind.WrappingPowerAssign },
	{ regex: /^\*\*%/, tokenKind: TokenKind.WrappingPower },
	{ regex: /^\*\*/, tokenKind: TokenKind.Power },
	{ regex: /^\*=/, tokenKind: TokenKind.TimesAssign },
	{ regex: /^\*%=/, tokenKind: TokenKind.WrappingTimesAssign },
	{ regex: /^\*%/, tokenKind: TokenKind.WrappingTimes },
	{ regex: /^\*/, tokenKind: TokenKind.Times },
	{ regex: /^\)/, tokenKind: TokenKind.CloseBracket },
	{ regex: /^\(/, tokenKind: TokenKind.OpenBracket },
	{ regex: /^>>=/, tokenKind: TokenKind.ShiftRightAssign },
	{ regex: /^>>/, tokenKind: TokenKind.ShiftRight },
	{ regex: /^>=/, tokenKind: TokenKind.BiggerThanEquals },
	{ regex: /^>/, tokenKind: TokenKind.BiggerThan },
	{ regex: /^=>/, tokenKind: TokenKind.ThickArrow },
	{ regex: /^==/, tokenKind: TokenKind.Equals },
	{ regex: /^=/, tokenKind: TokenKind.Assign },
	{ regex: /^<=>/, tokenKind: TokenKind.Spaceship },
	{ regex: /^<=/, tokenKind: TokenKind.SmallerThanEquals },
	{ regex: /^<<=/, tokenKind: TokenKind.ShiftLeftAssign },
	{ regex: /^<<%=/, tokenKind: TokenKind.WrappingShiftLeftAssign },
	{ regex: /^<<%/, tokenKind: TokenKind.WrappingShiftLeft },
	{ regex: /^<</, tokenKind: TokenKind.ShiftLeft },
	{ regex: /^</, tokenKind: TokenKind.SmallerThan },
	{ regex: /^:=/, tokenKind: TokenKind.Walrus },
	{ regex: /^:/, tokenKind: TokenKind.Colon },
	{ regex: /^->/, tokenKind: TokenKind.Arrow },
	{ regex: /^--%/, tokenKind: TokenKind.WrappingDecrement },
	{ regex: /^--/, tokenKind: TokenKind.Decrement },
	{ regex: /^-%=/, tokenKind: TokenKind.WrappingMinusAssign },
	{ regex: /^-%/, tokenKind: TokenKind.WrappingMinus },
	{ regex: /^-/, tokenKind: TokenKind.Minus },
	{ regex: /^,/, tokenKind: TokenKind.Comma },
	{ regex: /^&=/, tokenKind: TokenKind.BitwiseAndAssign },
	{ regex: /^&&=/, tokenKind: TokenKind.LogicalAndAssign },
	{ regex: /^&&/, tokenKind: TokenKind.LogicalAnd },
	{ regex: /^&/, tokenKind: TokenKind.BitwiseAnd },
	{ regex: /^%=/, tokenKind: TokenKind.ModuloAssign },
	{ regex: /^%/, tokenKind: TokenKind.Modulo },
	{ regex: /^!=/, tokenKind: TokenKind.NotEquals },
	{ regex: /^!/, tokenKind: TokenKind.LogicalNot }
]

export const DataTokenDefinitions: { regex: RegExp, tokenKind: DataTokenKind }[] = [
	{ regex: /^u([1-9]\d*)?\b/, tokenKind: TokenKind.UnsignedIntegerType },
	{ regex: /^i([1-9]\d*)?\b/, tokenKind: TokenKind.SignedIntegerType },
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
			column = match[2]!.length + 1
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
