import { Location } from "./shared"

/* eslint-disable prefer-named-capture-group */
const DEBUG = false as boolean

export enum TokenTag {
	Abstract = 1, Add, AddAssign, AddKeyword, And, Alias, Any, Arguments, Arrow, As, Ascending, Assert, Assign, Async,
	Await, Base, Become, BiggerThan, BiggerThanEquals, BinaryNumber, BitwiseAnd, BitwiseAndAssign, BitwiseNot,
	BitwiseOr, BitwiseOrAssign, Block, Boolean, Box, Boxed, Break, By, Byte, Case, Catch, Character, Checked, Class,
	Clean, CloseBracket, CloseSquareBracket, CloseSquiglyBracket, Colon, Comma, Comptime, Concatenate,
	ConcatenateAssign, Constant, Continue, Debugger, Decimal, Declare, DeclareFunction, DeclareModule, Decrement,
	Default, Defer, Define, Delegate, Delete, Descending, Divide, DivideAssign, Do, Dot, DotDotDot, Double, Dynamic,
	Effect, Else, Enum, Equals, EqualsKeyword, Error, ErrorClean, ErrorDefer, ErrorKeyword, Evaluate, Event, Explicit,
	Export, Extends, External, False, File, Final, Finally, Fixed, Float, Float128Type, Float16Type, Float32Type,
	Float64Type, For, Foreach, From, Function, Get, Global, Goto, Group, HexNumber, Identifier, If, Implements,
	Implicit, Import, In, Increment, Initiate, Inline, Instanceof, Integer, Interface, Internal, Into, Is, Join, Let, Lock,
	LogicalAnd, LogicalAndAssign, LogicalNot, LogicalOr, LogicalOrAssign, Long, Loop, Macro, Managed, Match, Method,
	Methods, Minus, MinusAssign, Module, Modulo, ModuloAssign, Mutable, Nameof, Namespace, Native, Never, New, Newline,
	NoClean, Noreturn, Not, NotEquals, NotKeyword, Notnull, Null, NullishCoalesce, NullishCoalesceAssign, Number,
	NumberKeyword, Object, OctalNumber, Of, On, Opaque, OpenBracket, OpenSquareBracket, OpenSquiglyBracket, Operator,
	OptionalChain, Or, Orderby, Out, Override, Package, Parameters, Partial, Power, PowerAssign, Primitive, Private,
	Protected, Public, Pure, Readonly, Record, Reference, Remove, Required, Return, Runtime, Satisfies, Scoped, Sealed,
	Select, Self, SelfType, Set, ShiftLeft, ShiftLeftAssign, ShiftRight, ShiftRightAssign, Short, Signal,
	SignedIntegerType, Size, Sizeof, SmallerThan, SmallerThanEquals, Spaceship, Stackallocate, Static, String,
	StringKeyword, Structure, Super, Switch, Symbol, Synchronized, Tag, Test, Tests, Then, ThickArrow, This, Throw,
	Throws, Times, TimesAssign, To, Trait, Traits, Transient, True, Try, Type, Typeis, Typeof, Unchecked, Union,
	UnionKeyword, Unique, Unknown, Unless, Unmanaged, Unreachable, Unsafe, Unsigned, UnsignedIntegerType, Unsized,
	Until, Use, Using, Value, Variable, Virtual, Void, Volatile, Walrus, When, Where, While, With, WrappingAdd,
	WrappingAddAssign, WrappingDecrement, WrappingDivide, WrappingDivideAssign, WrappingIncrement, WrappingMinus,
	WrappingMinusAssign, WrappingPower, WrappingPowerAssign, WrappingShiftLeft, WrappingShiftLeftAssign, WrappingTimes,
	WrappingTimesAssign, Xor, XorAssign, Yield
}

export const NonDataTokenDefinitions: { regex: RegExp, tokenTag: Exclude<TokenTag, DataTokenKind> }[] = [
	{ regex: /^yield\b/, tokenTag: TokenTag.Yield },
	{ regex: /^with\b/, tokenTag: TokenTag.With },
	{ regex: /^while\b/, tokenTag: TokenTag.While },
	{ regex: /^where\b/, tokenTag: TokenTag.Where },
	{ regex: /^when\b/, tokenTag: TokenTag.When },
	{ regex: /^volatile\b/, tokenTag: TokenTag.Volatile },
	{ regex: /^void\b/, tokenTag: TokenTag.Void },
	{ regex: /^virtual\b/, tokenTag: TokenTag.Virtual },
	{ regex: /^var(?:iable)?\b/, tokenTag: TokenTag.Variable },
	{ regex: /^value?\b/, tokenTag: TokenTag.Value },
	{ regex: /^using\b/, tokenTag: TokenTag.Using },
	{ regex: /^use\b/, tokenTag: TokenTag.Use },
	{ regex: /^until\b/, tokenTag: TokenTag.Until },
	{ regex: /^unsized\b/, tokenTag: TokenTag.Unsized },
	{ regex: /^unsigned\b/, tokenTag: TokenTag.Unsigned },
	{ regex: /^unsafe\b/, tokenTag: TokenTag.Unsafe },
	{ regex: /^unreachable\b/, tokenTag: TokenTag.Unreachable },
	{ regex: /^unmanaged\b/, tokenTag: TokenTag.Unmanaged },
	{ regex: /^unless\b/, tokenTag: TokenTag.Unless },
	{ regex: /^unknown\b/, tokenTag: TokenTag.Unknown },
	{ regex: /^unique\b/, tokenTag: TokenTag.Unique },
	{ regex: /^union\b/, tokenTag: TokenTag.UnionKeyword },
	{ regex: /^unchecked\b/, tokenTag: TokenTag.Unchecked },
	{ regex: /^typeof\b/, tokenTag: TokenTag.Typeof },
	{ regex: /^typeis\b/, tokenTag: TokenTag.Typeis },
	{ regex: /^type\b/, tokenTag: TokenTag.Type },
	{ regex: /^try\b/, tokenTag: TokenTag.Try },
	{ regex: /^true\b/, tokenTag: TokenTag.True },
	{ regex: /^transient\b/, tokenTag: TokenTag.Transient },
	{ regex: /^traits\b/, tokenTag: TokenTag.Traits },
	{ regex: /^trait\b/, tokenTag: TokenTag.Trait },
	{ regex: /^to\b/, tokenTag: TokenTag.To },
	{ regex: /^throws\b/, tokenTag: TokenTag.Throws },
	{ regex: /^throw\b/, tokenTag: TokenTag.Throw },
	{ regex: /^this\b/, tokenTag: TokenTag.This },
	{ regex: /^then\b/, tokenTag: TokenTag.Then },
	{ regex: /^tests\b/, tokenTag: TokenTag.Tests },
	{ regex: /^test\b/, tokenTag: TokenTag.Test },
	{ regex: /^tag\b/, tokenTag: TokenTag.Tag },
	{ regex: /^sync(?:ronized)?\b/, tokenTag: TokenTag.Synchronized },
	{ regex: /^symbol\b/, tokenTag: TokenTag.Symbol },
	{ regex: /^switch\b/, tokenTag: TokenTag.Switch },
	{ regex: /^super\b/, tokenTag: TokenTag.Super },
	{ regex: /^struct(?:ure)?\b/, tokenTag: TokenTag.Structure },
	{ regex: /^string\b/, tokenTag: TokenTag.StringKeyword },
	{ regex: /^static\b/, tokenTag: TokenTag.Static },
	{ regex: /^stackalloc(?:ate)?\b/, tokenTag: TokenTag.Stackallocate },
	{ regex: /^sizeof\b/, tokenTag: TokenTag.Sizeof },
	{ regex: /^size\b/, tokenTag: TokenTag.Size },
	{ regex: /^signal\b/, tokenTag: TokenTag.Signal },
	{ regex: /^short\b/, tokenTag: TokenTag.Short },
	{ regex: /^set\b/, tokenTag: TokenTag.Set },
	{ regex: /^self\b/, tokenTag: TokenTag.Self },
	{ regex: /^Self\b/, tokenTag: TokenTag.SelfType },
	{ regex: /^select\b/, tokenTag: TokenTag.Select },
	{ regex: /^sealed\b/, tokenTag: TokenTag.Sealed },
	{ regex: /^scoped\b/, tokenTag: TokenTag.Scoped },
	{ regex: /^satisfies\b/, tokenTag: TokenTag.Satisfies },
	{ regex: /^runtime\b/, tokenTag: TokenTag.Runtime },
	{ regex: /^return\b/, tokenTag: TokenTag.Return },
	{ regex: /^required\b/, tokenTag: TokenTag.Required },
	{ regex: /^remove\b/, tokenTag: TokenTag.Remove },
	{ regex: /^ref(?:erence)?\b/, tokenTag: TokenTag.Reference },
	{ regex: /^record\b/, tokenTag: TokenTag.Record },
	{ regex: /^readonly\b/, tokenTag: TokenTag.Readonly },
	{ regex: /^pure\b/, tokenTag: TokenTag.Pure },
	{ regex: /^pub(?:lic)?\b/, tokenTag: TokenTag.Public },
	{ regex: /^protected\b/, tokenTag: TokenTag.Protected },
	{ regex: /^priv(?:ate)?\b/, tokenTag: TokenTag.Private },
	{ regex: /^primtive\b/, tokenTag: TokenTag.Primitive },
	{ regex: /^partial\b/, tokenTag: TokenTag.Partial },
	{ regex: /^param(?:eter)?s\b/, tokenTag: TokenTag.Parameters },
	{ regex: /^package\b/, tokenTag: TokenTag.Package },
	{ regex: /^override\b/, tokenTag: TokenTag.Override },
	{ regex: /^out\b/, tokenTag: TokenTag.Out },
	{ regex: /^orderby\b/, tokenTag: TokenTag.Orderby },
	{ regex: /^or\b/, tokenTag: TokenTag.Or },
	{ regex: /^operator\b/, tokenTag: TokenTag.Operator },
	{ regex: /^opaque\b/, tokenTag: TokenTag.Opaque },
	{ regex: /^on\b/, tokenTag: TokenTag.On },
	{ regex: /^of\b/, tokenTag: TokenTag.Of },
	{ regex: /^object\b/, tokenTag: TokenTag.Object },
	{ regex: /^number\b/, tokenTag: TokenTag.NumberKeyword },
	{ regex: /^null\b/, tokenTag: TokenTag.Null },
	{ regex: /^notnull\b/, tokenTag: TokenTag.Notnull },
	{ regex: /^not/, tokenTag: TokenTag.NotKeyword },
	{ regex: /^not\b/, tokenTag: TokenTag.Not },
	{ regex: /^noreturn\b/, tokenTag: TokenTag.Noreturn },
	{ regex: /^noclean\b/, tokenTag: TokenTag.NoClean },
	{ regex: /^new\b/, tokenTag: TokenTag.New },
	{ regex: /^never\b/, tokenTag: TokenTag.Never },
	{ regex: /^native\b/, tokenTag: TokenTag.Native },
	{ regex: /^namespace\b/, tokenTag: TokenTag.Namespace },
	{ regex: /^nameof\b/, tokenTag: TokenTag.Nameof },
	{ regex: /^mut(?:able)?\b/, tokenTag: TokenTag.Mutable },
	{ regex: /^mod(?:ule)?\b/, tokenTag: TokenTag.Module },
	{ regex: /^methods\b/, tokenTag: TokenTag.Methods },
	{ regex: /^method\b/, tokenTag: TokenTag.Method },
	{ regex: /^match\b/, tokenTag: TokenTag.Match },
	{ regex: /^managed\b/, tokenTag: TokenTag.Managed },
	{ regex: /^macro\b/, tokenTag: TokenTag.Macro },
	{ regex: /^loop\b/, tokenTag: TokenTag.Loop },
	{ regex: /^long\b/, tokenTag: TokenTag.Long },
	{ regex: /^lock\b/, tokenTag: TokenTag.Lock },
	{ regex: /^let\b/, tokenTag: TokenTag.Let },
	{ regex: /^join\b/, tokenTag: TokenTag.Join },
	{ regex: /^is\b/, tokenTag: TokenTag.Is },
	{ regex: /^into\b/, tokenTag: TokenTag.Into },
	{ regex: /^internal\b/, tokenTag: TokenTag.Internal },
	{ regex: /^interface\b/, tokenTag: TokenTag.Interface },
	{ regex: /^int(?:eger)?\b/, tokenTag: TokenTag.Integer },
	{ regex: /^instanceof\b/, tokenTag: TokenTag.Instanceof },
	{ regex: /^inline\b/, tokenTag: TokenTag.Inline },
	{ regex: /^init(?:iate)?\b/, tokenTag: TokenTag.Initiate },
	{ regex: /^in\b/, tokenTag: TokenTag.In },
	{ regex: /^import\b/, tokenTag: TokenTag.Import },
	{ regex: /^implicit\b/, tokenTag: TokenTag.Implicit },
	{ regex: /^impl(?:ements)?\b/, tokenTag: TokenTag.Implements },
	{ regex: /^if\b/, tokenTag: TokenTag.If },
	{ regex: /^group\b/, tokenTag: TokenTag.Group },
	{ regex: /^goto\b/, tokenTag: TokenTag.Goto },
	{ regex: /^global\b/, tokenTag: TokenTag.Global },
	{ regex: /^get\b/, tokenTag: TokenTag.Get },
	{ regex: /^function\b/, tokenTag: TokenTag.Function },
	{ regex: /^from\b/, tokenTag: TokenTag.From },
	{ regex: /^foreach\b/, tokenTag: TokenTag.Foreach },
	{ regex: /^for\b/, tokenTag: TokenTag.For },
	{ regex: /^float\b/, tokenTag: TokenTag.Float },
	{ regex: /^fixed\b/, tokenTag: TokenTag.Fixed },
	{ regex: /^finally\b/, tokenTag: TokenTag.Finally },
	{ regex: /^final\b/, tokenTag: TokenTag.Final },
	{ regex: /^file\b/, tokenTag: TokenTag.File },
	{ regex: /^false\b/, tokenTag: TokenTag.False },
	{ regex: /^f64\b/, tokenTag: TokenTag.Float64Type },
	{ regex: /^f32\b/, tokenTag: TokenTag.Float32Type },
	{ regex: /^f16\b/, tokenTag: TokenTag.Float16Type },
	{ regex: /^f128\b/, tokenTag: TokenTag.Float128Type },
	{ regex: /^extern(?:al)?\b/, tokenTag: TokenTag.External },
	{ regex: /^extends\b/, tokenTag: TokenTag.Extends },
	{ regex: /^export\b/, tokenTag: TokenTag.Export },
	{ regex: /^explicit\b/, tokenTag: TokenTag.Explicit },
	{ regex: /^event\b/, tokenTag: TokenTag.Event },
	{ regex: /^eval(?:uate)?\b/, tokenTag: TokenTag.Evaluate },
	{ regex: /^err(?:or)?defer\b/, tokenTag: TokenTag.ErrorDefer },
	{ regex: /^err(?:or)?clean\b/, tokenTag: TokenTag.ErrorClean },
	{ regex: /^error\b/, tokenTag: TokenTag.ErrorKeyword },
	{ regex: /^equals\b/, tokenTag: TokenTag.Equals },
	{ regex: /^enum(?:eration)?\b/, tokenTag: TokenTag.Enum },
	{ regex: /^else\b/, tokenTag: TokenTag.Else },
	{ regex: /^effect\b/, tokenTag: TokenTag.Effect },
	{ regex: /^dyn(?:amic)?\b/, tokenTag: TokenTag.Dynamic },
	{ regex: /^double\b/, tokenTag: TokenTag.Double },
	{ regex: /^do\b/, tokenTag: TokenTag.Do },
	{ regex: /^descending\b/, tokenTag: TokenTag.Descending },
	{ regex: /^delete\b/, tokenTag: TokenTag.Delete },
	{ regex: /^defer\b/, tokenTag: TokenTag.Defer },
	{ regex: /^default\b/, tokenTag: TokenTag.Default },
	{ regex: /^delegate\b/, tokenTag: TokenTag.Delegate },
	{ regex: /^def(?:ine)?\b/, tokenTag: TokenTag.Define },
	{ regex: /^declare\b/, tokenTag: TokenTag.Declare },
	{ regex: /^decimal?\b/, tokenTag: TokenTag.Decimal },
	{ regex: /^debug(?:ger)?\b/, tokenTag: TokenTag.Debugger },
	{ regex: /^continue\b/, tokenTag: TokenTag.Continue },
	{ regex: /^const(?:ant)?\b/, tokenTag: TokenTag.Constant },
	{ regex: /^comptime\b/, tokenTag: TokenTag.Comptime },
	{ regex: /^clean\b/, tokenTag: TokenTag.Clean },
	{ regex: /^class\b/, tokenTag: TokenTag.Class },
	{ regex: /^checked/, tokenTag: TokenTag.Checked },
	{ regex: /^char(?:acter)?\b/, tokenTag: TokenTag.Character },
	{ regex: /^catch\b/, tokenTag: TokenTag.Catch },
	{ regex: /^byte\b/, tokenTag: TokenTag.Byte },
	{ regex: /^by\b/, tokenTag: TokenTag.By },
	{ regex: /^break\b/, tokenTag: TokenTag.Break },
	{ regex: /^boxed\b/, tokenTag: TokenTag.Boxed },
	{ regex: /^box\b/, tokenTag: TokenTag.Box },
	{ regex: /^bool(?:ean)?\b/, tokenTag: TokenTag.Boolean },
	{ regex: /^block\b/, tokenTag: TokenTag.Block },
	{ regex: /^become\b/, tokenTag: TokenTag.Become },
	{ regex: /^base\b/, tokenTag: TokenTag.Base },
	{ regex: /^await\b/, tokenTag: TokenTag.Await },
	{ regex: /^async\b/, tokenTag: TokenTag.Async },
	{ regex: /^assert\b/, tokenTag: TokenTag.Assert },
	{ regex: /^ascending\b/, tokenTag: TokenTag.Ascending },
	{ regex: /^as\b/, tokenTag: TokenTag.As },
	{ regex: /^arg(?:ument)?s\b/, tokenTag: TokenTag.Arguments },
	{ regex: /^any\b/, tokenTag: TokenTag.Any },
	{ regex: /^alias\b/, tokenTag: TokenTag.Alias },
	{ regex: /^and\b/, tokenTag: TokenTag.And },
	{ regex: /^add\b/, tokenTag: TokenTag.AddKeyword },
	{ regex: /^abstract\b/, tokenTag: TokenTag.Abstract },
	{ regex: /^~/, tokenTag: TokenTag.BitwiseNot },
	{ regex: /^}/, tokenTag: TokenTag.CloseSquiglyBracket },
	{ regex: /^\|\|=/, tokenTag: TokenTag.LogicalOrAssign },
	{ regex: /^\|\|/, tokenTag: TokenTag.LogicalOr },
	{ regex: /^\|=/, tokenTag: TokenTag.BitwiseOrAssign },
	{ regex: /^\|/, tokenTag: TokenTag.BitwiseOr },
	{ regex: /^\{/, tokenTag: TokenTag.OpenSquiglyBracket },
	{ regex: /^\^=/, tokenTag: TokenTag.XorAssign },
	{ regex: /^\^/, tokenTag: TokenTag.Xor },
	{ regex: /^]/, tokenTag: TokenTag.CloseSquareBracket },
	{ regex: /^\[/, tokenTag: TokenTag.OpenSquareBracket },
	{ regex: /^\?\?=/, tokenTag: TokenTag.NullishCoalesceAssign },
	{ regex: /^\?\?/, tokenTag: TokenTag.NullishCoalesce },
	{ regex: /^\?\./, tokenTag: TokenTag.OptionalChain },
	{ regex: /^\?/, tokenTag: TokenTag.Union },
	{ regex: /^\/=/, tokenTag: TokenTag.DivideAssign },
	{ regex: /^\/%=/, tokenTag: TokenTag.WrappingDivideAssign },
	{ regex: /^\/%/, tokenTag: TokenTag.WrappingDivide },
	{ regex: /^\//, tokenTag: TokenTag.Divide },
	{ regex: /^\.{3}/, tokenTag: TokenTag.DotDotDot },
	{ regex: /^\.\.=/, tokenTag: TokenTag.ConcatenateAssign },
	{ regex: /^\.\./, tokenTag: TokenTag.Concatenate },
	{ regex: /^\./, tokenTag: TokenTag.Dot },
	{ regex: /^\+\+%/, tokenTag: TokenTag.WrappingIncrement },
	{ regex: /^\+\+/, tokenTag: TokenTag.Increment },
	{ regex: /^\+=/, tokenTag: TokenTag.AddAssign },
	{ regex: /^\+%=/, tokenTag: TokenTag.WrappingAddAssign },
	{ regex: /^\+%/, tokenTag: TokenTag.WrappingAdd },
	{ regex: /^\+/, tokenTag: TokenTag.Add },
	{ regex: /^\*\*=/, tokenTag: TokenTag.PowerAssign },
	{ regex: /^\*\*%=/, tokenTag: TokenTag.WrappingPowerAssign },
	{ regex: /^\*\*%/, tokenTag: TokenTag.WrappingPower },
	{ regex: /^\*\*/, tokenTag: TokenTag.Power },
	{ regex: /^\*=/, tokenTag: TokenTag.TimesAssign },
	{ regex: /^\*%=/, tokenTag: TokenTag.WrappingTimesAssign },
	{ regex: /^\*%/, tokenTag: TokenTag.WrappingTimes },
	{ regex: /^\*/, tokenTag: TokenTag.Times },
	{ regex: /^\)/, tokenTag: TokenTag.CloseBracket },
	{ regex: /^\(/, tokenTag: TokenTag.OpenBracket },
	{ regex: /^>>=/, tokenTag: TokenTag.ShiftRightAssign },
	{ regex: /^>>/, tokenTag: TokenTag.ShiftRight },
	{ regex: /^>=/, tokenTag: TokenTag.BiggerThanEquals },
	{ regex: /^>/, tokenTag: TokenTag.BiggerThan },
	{ regex: /^=>/, tokenTag: TokenTag.ThickArrow },
	{ regex: /^==/, tokenTag: TokenTag.Equals },
	{ regex: /^=/, tokenTag: TokenTag.Assign },
	{ regex: /^<=>/, tokenTag: TokenTag.Spaceship },
	{ regex: /^<=/, tokenTag: TokenTag.SmallerThanEquals },
	{ regex: /^<<=/, tokenTag: TokenTag.ShiftLeftAssign },
	{ regex: /^<<%=/, tokenTag: TokenTag.WrappingShiftLeftAssign },
	{ regex: /^<<%/, tokenTag: TokenTag.WrappingShiftLeft },
	{ regex: /^<</, tokenTag: TokenTag.ShiftLeft },
	{ regex: /^</, tokenTag: TokenTag.SmallerThan },
	{ regex: /^:=/, tokenTag: TokenTag.Walrus },
	{ regex: /^:/, tokenTag: TokenTag.Colon },
	{ regex: /^->/, tokenTag: TokenTag.Arrow },
	{ regex: /^--%/, tokenTag: TokenTag.WrappingDecrement },
	{ regex: /^--/, tokenTag: TokenTag.Decrement },
	{ regex: /^-%=/, tokenTag: TokenTag.WrappingMinusAssign },
	{ regex: /^-%/, tokenTag: TokenTag.WrappingMinus },
	{ regex: /^-/, tokenTag: TokenTag.Minus },
	{ regex: /^,/, tokenTag: TokenTag.Comma },
	{ regex: /^&=/, tokenTag: TokenTag.BitwiseAndAssign },
	{ regex: /^&&=/, tokenTag: TokenTag.LogicalAndAssign },
	{ regex: /^&&/, tokenTag: TokenTag.LogicalAnd },
	{ regex: /^&/, tokenTag: TokenTag.BitwiseAnd },
	{ regex: /^%=/, tokenTag: TokenTag.ModuloAssign },
	{ regex: /^%/, tokenTag: TokenTag.Modulo },
	{ regex: /^!=/, tokenTag: TokenTag.NotEquals },
	{ regex: /^!/, tokenTag: TokenTag.LogicalNot }
]

export const DataTokenDefinitions: { regex: RegExp, tokenTag: DataTokenKind }[] = [
	// eslint-disable-next-line regexp/no-empty-alternative
	{ regex: /^u([1-9]\d*|)\b/, tokenTag: TokenTag.UnsignedIntegerType },
	// eslint-disable-next-line regexp/no-empty-alternative
	{ regex: /^i([1-9]\d*|)\b/, tokenTag: TokenTag.SignedIntegerType },
	{ regex: /^0b[01](?:_?[01])*/, tokenTag: TokenTag.BinaryNumber },
	{ regex: /^0x[\da-fA-F](?:_?[\da-fA-F])*/, tokenTag: TokenTag.HexNumber },
	{ regex: /^0o[0-7](?:_?[0-7])*/, tokenTag: TokenTag.OctalNumber },
	{ regex: /^(\d(?:_?\d)*(?:\.\d(?:_?\d)*)?)/, tokenTag: TokenTag.Number },
	{ regex: /^"((?:\\"|[^"])+)"/, tokenTag: TokenTag.String },
	{ regex: /^([a-zA-Z_]\w*)/, tokenTag: TokenTag.Identifier }
]

export function* tokenise(code: string): Generator<Token, void> {
	let index = 0
	let line = 1
	let column = 1
	let match

	while (index < code.length) {
		if ((match = /^((?:(?:\/\/.*)?\r?\n)+)(\t*)/.exec(code.slice(index)))) {
			yield createToken(TokenTag.Newline, match[2])
			line += match[1]!.split(``).filter(character => character == `\n`).length
			column = match[2]!.length + 1
			index += match[0]!.length

			if (code[index] == ` `)
				yield createToken(TokenTag.Error, code[index])
		} else {
			checkSpace: if (!(match = /^ +/.exec(code.slice(index)))) {
				for (const { regex, tokenTag: tokenKind } of NonDataTokenDefinitions) {
					if ((match = regex.exec(code.slice(index)))) {
						yield createToken(tokenKind)

						break checkSpace
					}
				}

				for (const { regex, tokenTag: tokenKind } of DataTokenDefinitions) {
					if ((match = regex.exec(code.slice(index)))) {
						yield createToken(tokenKind, match[1])

						break checkSpace
					}
				}

				yield createToken(TokenTag.Error, code[index])
				column++
				index++

				continue
			}

			column += match[0]!.length
			index += match[0]!.length
		}
	}

	function createToken(kind: TokenTag, data?: string): Token {
		const token = { kind, data, index, line, column } as Token

		if (DEBUG)
			console.log(`DEBUG tokenise()`, printToken(token))

		return token
	}
}

export default tokenise

export function printToken(token: Token) {
	if (token.data == undefined)
		return TokenTag[token.kind]

	return `${TokenTag[token.kind]} ${JSON.stringify(token.data)}`
}

export type Token = NonDataToken | DataToken
export type NonDataToken = Location & { kind: Exclude<TokenTag, DataTokenKind>, data: undefined }
export type DataToken = Location & { kind: DataTokenKind, data: string }

export type DataTokenKind = TokenTag.BinaryNumber | TokenTag.Error | TokenTag.HexNumber | TokenTag.Identifier |
	TokenTag.Newline | TokenTag.Number | TokenTag.OctalNumber | TokenTag.SignedIntegerType | TokenTag.String |
	TokenTag.UnsignedIntegerType
