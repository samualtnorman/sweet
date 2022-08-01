import { assert } from "@samual/lib"
import { getIntegerLength } from "./shared"
import { printToken, Token, TokenKind } from "./tokenise"

// TODO complain when number literal too big or small for bits

const DEBUG = false

export enum ExpressionKind {
	Identifier = 1,
	Assignment,
	Call,
	Add,
	Let,
	Minus,
	IfStatement,
	If,
	Do,
	Function,
	Parameter,
	Return,
	SignedIntegerLiteral,
	UnsignedIntegerLiteral,
	Increment,
	SignedIntegerType,
	UnsignedIntegerType,
	Float16Type,
	Float32Type,
	Float64Type,
	Float128Type,
	Null,
	To,
	As,
	Or,
	Float16Literal,
	Float32Literal,
	Float64Literal,
	Float128Literal,
	Void,
	True,
	False,
	Boolean,
	ObjectType,
	FunctionType,
	Any,
	Times,
	MinusPrefix,
	Divide,
	While,
	WrappingAdd,
	Decrement,
	Equal,
	NotEqual,
	WrappingTimes,
	DeclaredImport,
	DeclaredImportMember,
	Array,
	Import,
	ImportDestructure,
	ImportDestructureMember,
	Destructure,
	GetMember,
	String,
	BitwiseNot,
	LogicalNot,
	Modulo,
	Power,
	WrappingMinus,
	WrappingDivide,
	WrappingPower,
	Is,
	SmallerThan,
	BiggerThan,
	SmallerThanEquals,
	BiggerThanEquals,
	Equals,
	NotEquals,
	ShiftLeft,
	ShiftRight,
	WrappingShiftLeft,
	BitwiseAnd,
	BitwiseOr,
	Xor,
	LogicalAnd,
	LogicalOr,
	NullishCoalesce,
	Union,
	Concatenate,
	Enum,
	Object
}

export type Expression = Expression.Function | Expression.Boolean | Expression.Object | Expression.String |
	Expression.Identifier | Expression.Call | Expression.If | Expression.Assignment | Expression.Let |
	Expression.Return | Expression.Increment | Expression.SignedIntegerType | Expression.UnsignedIntegerType |
	Expression.Float16Type | Expression.Float32Type | Expression.Float64Type | Expression.Float128Type |
	Expression.Null | Expression.Do | Expression.Void | Expression.FunctionType | Expression.Any |
	Expression.MinusPrefix | Expression.While | Expression.Decrement | Expression.DeclaredImport |
	Expression.Import | Expression.GetMember | Expression.Null | Expression.True | Expression.False |
	Expression.UnsignedIntegerLiteral | Expression.SignedIntegerLiteral | Expression.Float16Literal |
	Expression.Float32Literal | Expression.Float64Literal | Expression.Float128Literal | Expression.Array |
	Expression.BinaryOperation | Expression.Enum

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Expression {
	export type BinaryOperation = {
		kind: ExpressionKind.Add | ExpressionKind.Minus | ExpressionKind.Divide | ExpressionKind.Times |
		ExpressionKind.Modulo | ExpressionKind.Power | ExpressionKind.WrappingAdd | ExpressionKind.WrappingMinus |
		ExpressionKind.WrappingDivide | ExpressionKind.WrappingTimes | ExpressionKind.WrappingPower |
		ExpressionKind.Is | ExpressionKind.SmallerThan | ExpressionKind.BiggerThan | ExpressionKind.SmallerThanEquals |
		ExpressionKind.BiggerThanEquals | ExpressionKind.Equals | ExpressionKind.NotEquals | ExpressionKind.ShiftLeft |
		ExpressionKind.ShiftRight | ExpressionKind.WrappingShiftLeft | ExpressionKind.BitwiseAnd |
		ExpressionKind.BitwiseOr | ExpressionKind.Xor | ExpressionKind.LogicalAnd | ExpressionKind.LogicalOr |
		ExpressionKind.NullishCoalesce | ExpressionKind.Union | ExpressionKind.Concatenate | ExpressionKind.To |
		ExpressionKind.As

		left: Expression
		right: Expression
	}

	export type ImportDestructureMember = {
		kind: ExpressionKind.ImportDestructureMember
		name: string
		as: string | ImportDestructureMember[]
	}

	export type Let = {
		kind: ExpressionKind.Let
		binding: Identifier | Destructure
		type: Expression | undefined
		initialValue: Expression | undefined
	}

	export type Destructure = {
		kind: ExpressionKind.Destructure
		members: { name: string, as: Identifier | Destructure, defaultValue: Expression | undefined }[]
	}

	export type If = {
		kind: ExpressionKind.If
		condition: Expression
		truthyBranch: Expression
		falseyBranch: Expression | undefined
	}

	export type Function = {
		kind: ExpressionKind.Function
		name: string
		// eslint-disable-next-line @typescript-eslint/ban-types
		parameter: Identifier | Object
		parameterType: Expression | undefined
		returnType: Expression | undefined
		body: Expression[]
	}

	export type DeclaredImport = {
		kind: ExpressionKind.DeclaredImport
		module: string
		members: { name: string, as: string, type: Expression }[]
	}

	export type Assignment = {
		kind: ExpressionKind.Assignment
		binding: Identifier | GetMember | Destructure
		value: Expression
	}

	export type Object = {
		kind: ExpressionKind.Object

		entries:
			{ name: string, type: Expression | undefined, value: Expression }[] |
			{ name: string, type: Expression, value: undefined }[]
	}

	export type Enum = { kind: ExpressionKind.Enum, name: string, members: { name: string, type: Expression | undefined }[] }
	export type Import = { kind: ExpressionKind.Import, path: string, as: string | ImportDestructureMember[] | undefined }
	export type Array = { kind: ExpressionKind.Array, expressions: Expression[] }
	export type Call = { kind: ExpressionKind.Call, callable: Expression, argument: Expression }
	export type Return = { kind: ExpressionKind.Return, expression: Expression }
	export type SignedIntegerLiteral = { kind: ExpressionKind.SignedIntegerLiteral, value: bigint, bits: number }
	export type UnsignedIntegerLiteral = { kind: ExpressionKind.UnsignedIntegerLiteral, value: bigint, bits: number }
	export type Float16Literal = { kind: ExpressionKind.Float16Literal, value: number }
	export type Float32Literal = { kind: ExpressionKind.Float32Literal, value: number }
	export type Float64Literal = { kind: ExpressionKind.Float64Literal, value: number }
	export type Float128Literal = { kind: ExpressionKind.Float128Literal, value: number }
	export type Increment = { kind: ExpressionKind.Increment, binding: Identifier | GetMember }
	export type Decrement = { kind: ExpressionKind.Decrement, binding: Identifier | GetMember }
	export type SignedIntegerType = { kind: ExpressionKind.SignedIntegerType, bits: number }
	export type UnsignedIntegerType = { kind: ExpressionKind.UnsignedIntegerType, bits: number }
	export type Float16Type = { kind: ExpressionKind.Float16Type }
	export type Float32Type = { kind: ExpressionKind.Float32Type }
	export type Float64Type = { kind: ExpressionKind.Float64Type }
	export type Float128Type = { kind: ExpressionKind.Float128Type }
	export type Null = { kind: ExpressionKind.Null }
	export type Do = { kind: ExpressionKind.Do, body: Expression[] }
	export type Void = { kind: ExpressionKind.Void, expression: Expression }
	export type True = { kind: ExpressionKind.True }
	export type False = { kind: ExpressionKind.False }
	export type Boolean = { kind: ExpressionKind.Boolean }
	export type FunctionType = { kind: ExpressionKind.FunctionType, argumentType: Expression, returnType: Expression }
	export type Any = { kind: ExpressionKind.Any }
	export type MinusPrefix = { kind: ExpressionKind.MinusPrefix, expression: Expression }
	export type While = { kind: ExpressionKind.While, condition: Expression, body: Expression }
	export type Identifier = { kind: ExpressionKind.Identifier, name: string }
	export type GetMember = { kind: ExpressionKind.GetMember, expression: Expression, name: string }
	export type String = { kind: ExpressionKind.String, value: string }
	export type BitwiseNot = { kind: ExpressionKind.BitwiseNot, expression: Expression }
	export type LogicalNot = { kind: ExpressionKind.LogicalNot, expression: Expression }
}

export class ParseError extends Error {
	constructor(
		public readonly token: Token | undefined,
		public readonly expectedTypes?: TokenKind[]
	) {
		if (expectedTypes) {
			assert(expectedTypes.length, `expectedTypes array must not be empty`)

			if (token)
				super(`unexpected ${printToken(token)} at :${token.line}:${token.column}, expected ${getExpectedTypeNames(expectedTypes)}`)
			else
				super(`unexpected end, expected ${getExpectedTypeNames(expectedTypes)}`)
		} else if (token)
			super(`unexpected ${printToken(token)} at :${token.line}:${token.column}`)
		else
			super(`unexpected end`)
	}

	static {
		Object.defineProperty(this.prototype, `name`, { value: this.name })
	}
}

const getExpectedTypeNames = (expectedTypes: TokenKind[]) =>
	expectedTypes.map(expectedType => TokenKind[expectedType]).join(`, `)

export class WrongIndentLevelError extends ParseError {
	constructor(
		public override readonly token: Token,
		public readonly expected: number
	) {
		super(undefined, [ TokenKind.Newline ])
		this.message = `wrong indent level, expected ${expected} but got ${token.data!.length} at :${token.line + 1}:${1}`
	}

	static {
		Object.defineProperty(this.prototype, `name`, { value: this.name })
	}
}

export const parse = (tokens: Token[]) =>
	parseExpressions(tokens, 0, { cursor: tokens[0]?.kind == TokenKind.Newline ? 1 : 0 })

export default parse

export const BinaryOperatorTokensToExpressionKinds: { [Key in TokenKind]?: Expression.BinaryOperation[`kind`] } = {
	[TokenKind.Add]: ExpressionKind.Add,
	[TokenKind.Minus]: ExpressionKind.Minus,
	[TokenKind.Divide]: ExpressionKind.Divide,
	[TokenKind.Times]: ExpressionKind.Times,
	[TokenKind.Modulo]: ExpressionKind.Modulo,
	[TokenKind.Power]: ExpressionKind.Power,
	[TokenKind.WrappingAdd]: ExpressionKind.WrappingAdd,
	[TokenKind.WrappingMinus]: ExpressionKind.WrappingMinus,
	[TokenKind.WrappingDivide]: ExpressionKind.WrappingDivide,
	[TokenKind.WrappingTimes]: ExpressionKind.WrappingTimes,
	[TokenKind.WrappingPower]: ExpressionKind.WrappingPower,
	[TokenKind.Is]: ExpressionKind.Is,
	[TokenKind.SmallerThan]: ExpressionKind.SmallerThan,
	[TokenKind.BiggerThan]: ExpressionKind.BiggerThan,
	[TokenKind.SmallerThanEquals]: ExpressionKind.SmallerThanEquals,
	[TokenKind.BiggerThanEquals]: ExpressionKind.BiggerThanEquals,
	[TokenKind.Equals]: ExpressionKind.Equals,
	[TokenKind.NotEquals]: ExpressionKind.NotEquals,
	[TokenKind.ShiftLeft]: ExpressionKind.ShiftLeft,
	[TokenKind.ShiftRight]: ExpressionKind.ShiftRight,
	[TokenKind.WrappingShiftLeft]: ExpressionKind.WrappingShiftLeft,
	[TokenKind.BitwiseAnd]: ExpressionKind.BitwiseAnd,
	[TokenKind.BitwiseOr]: ExpressionKind.BitwiseOr,
	[TokenKind.Xor]: ExpressionKind.Xor,
	[TokenKind.LogicalAnd]: ExpressionKind.LogicalAnd,
	[TokenKind.LogicalOr]: ExpressionKind.LogicalOr,
	[TokenKind.NullishCoalesce]: ExpressionKind.NullishCoalesce,
	[TokenKind.Union]: ExpressionKind.Union,
	[TokenKind.Concatenate]: ExpressionKind.Concatenate,
	[TokenKind.To]: ExpressionKind.To,
	[TokenKind.As]: ExpressionKind.As
}

export const parseExpressions = function* (tokens: Token[], indentLevel: number, state: { cursor: number }): Generator<Expression, void> {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (DEBUG) {
		for (const token of tokens.slice(state.cursor))
			console.log(`DEBUG parseExpressions()`, printToken(token))

		console.log(`DEBUG parseExpressions() ---`)
	}

	const parseExpression = (): Expression => {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (DEBUG) {
			for (const token of tokens.slice(state.cursor))
				console.log(`DEBUG parseExpression()`, printToken(token))

			console.log(`DEBUG parseExpression() ---`)
		}

		let expression = parseElement()

		while (tokens.length > state.cursor) {
			const kind = BinaryOperatorTokensToExpressionKinds[tokens[state.cursor]!.kind]

			if (kind) {
				state.cursor++
				expression = { kind, left: expression, right: parseElement() }
			} else if (tokens[state.cursor]!.kind == TokenKind.Newline)
				break
			else
				expression = { kind: ExpressionKind.Call, callable: expression, argument: parseExpression() }
		}

		return expression
	}

	const parseElement = (): Expression => {
		if (tokens.length == state.cursor)
			throw new ParseError(undefined)

		state.cursor++

		// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
		switch (tokens[state.cursor - 1]!.kind) {
			case TokenKind.Null:
				return { kind: ExpressionKind.Null }

			case TokenKind.Void:
				return { kind: ExpressionKind.Void, expression: parseExpression() }

			case TokenKind.Return: {
				if (nextTokenIs(TokenKind.Newline))
					return { kind: ExpressionKind.Return, expression: { kind: ExpressionKind.Null } }

				return { kind: ExpressionKind.Return, expression: parseExpression() }
			}

			case TokenKind.Let: {
				const binding: Expression.Identifier = {
					kind: ExpressionKind.Identifier,
					name: expectToken(TokenKind.Identifier).data!
				}

				let type

				if (nextTokenIs(TokenKind.Colon)) {
					state.cursor++
					type = parseExpression()
				}

				let initialValue

				if (nextTokenIs(TokenKind.Assign)) {
					state.cursor++
					initialValue = parseExpression()
				}

				return { kind: ExpressionKind.Let, binding, type, initialValue }
			}

			case TokenKind.Identifier: {
				const name = tokens[state.cursor - 1]!.data!

				if (nextTokenIs(TokenKind.Assign)) {
					state.cursor++

					return {
						kind: ExpressionKind.Assignment,
						binding: { kind: ExpressionKind.Identifier, name },
						value: parseExpression()
					}
				}

				if (nextTokenIs(TokenKind.Increment)) {
					state.cursor++

					return {
						kind: ExpressionKind.Increment,
						binding: { kind: ExpressionKind.Identifier, name }
					}
				}

				if (nextTokenIs(TokenKind.Decrement)) {
					state.cursor++

					return {
						kind: ExpressionKind.Decrement,
						binding: { kind: ExpressionKind.Identifier, name }
					}
				}

				return { kind: ExpressionKind.Identifier, name }
			}

			case TokenKind.Number: {
				const numberString = tokens[state.cursor - 1]!.data!

				if (numberString.includes(`.`)) {
					if (nextTokenIs(TokenKind.Float16Type)) {
						state.cursor++

						return {
							kind: ExpressionKind.Float16Literal,
							value: Number(numberString)
						}
					}

					if (nextTokenIs(TokenKind.Float32Type)) {
						state.cursor++

						return {
							kind: ExpressionKind.Float32Literal,
							value: Number(numberString)
						}
					}

					if (nextTokenIs(TokenKind.Float64Type)) {
						state.cursor++

						return {
							kind: ExpressionKind.Float64Literal,
							value: Number(numberString)
						}
					}

					if (nextTokenIs(TokenKind.Float128Type)) {
						state.cursor++

						return {
							kind: ExpressionKind.Float128Literal,
							value: Number(numberString)
						}
					}

					return {
						kind: ExpressionKind.Float64Literal,
						value: Number(numberString)
					}
				}

				if (nextTokenIs(TokenKind.UnsignedIntegerType)) {
					const bits = Number(tokens[state.cursor]!.data)

					state.cursor++

					return {
						kind: ExpressionKind.UnsignedIntegerLiteral,
						value: BigInt(numberString),
						bits
					}
				}

				if (nextTokenIs(TokenKind.SignedIntegerType)) {
					const bits = Number(tokens[state.cursor]!.data)

					state.cursor++

					return {
						kind: ExpressionKind.SignedIntegerLiteral,
						value: BigInt(numberString),
						bits
					}
				}

				if (nextTokenIs(TokenKind.Float16Type)) {
					state.cursor++

					return {
						kind: ExpressionKind.Float16Literal,
						value: Number(numberString)
					}
				}

				if (nextTokenIs(TokenKind.Float32Type)) {
					state.cursor++

					return {
						kind: ExpressionKind.Float32Literal,
						value: Number(numberString)
					}
				}

				if (nextTokenIs(TokenKind.Float64Type)) {
					state.cursor++

					return {
						kind: ExpressionKind.Float64Literal,
						value: Number(numberString)
					}
				}

				if (nextTokenIs(TokenKind.Float128Type)) {
					state.cursor++

					return {
						kind: ExpressionKind.Float128Literal,
						value: Number(numberString)
					}
				}

				const value = BigInt(numberString)

				return {
					kind: ExpressionKind.UnsignedIntegerLiteral,
					value,
					bits: getIntegerLength(value)
				}
			}

			case TokenKind.Float16Type:
				return { kind: ExpressionKind.Float16Type }

			case TokenKind.Float32Type:
				return { kind: ExpressionKind.Float32Type }

			case TokenKind.Float64Type:
				return { kind: ExpressionKind.Float64Type }

			case TokenKind.Float128Type:
				return { kind: ExpressionKind.Float128Type }

			case TokenKind.UnsignedIntegerType:
				return { kind: ExpressionKind.UnsignedIntegerType, bits: Number(tokens[state.cursor - 1]!.data!) }

			case TokenKind.SignedIntegerType:
				return { kind: ExpressionKind.SignedIntegerType, bits: Number(tokens[state.cursor - 1]!.data!) }

			case TokenKind.Enum: {
				const enum_: Expression.Enum = {
					kind: ExpressionKind.Enum,
					name: expectToken(TokenKind.Identifier).data!,
					members: []
				}

				indentLevel++
				expectNewline()

				while (true) {
					const name = expectToken(TokenKind.Identifier).data!
					let type

					if (nextTokenIs(TokenKind.Colon)) {
						state.cursor++
						type = parseExpression()
					}

					enum_.members.push({ name, type })

					const newline = expectToken(TokenKind.Newline)

					if (newline.data!.length < indentLevel)
						break

					if (newline.data!.length != indentLevel)
						throw new WrongIndentLevelError(newline, indentLevel)
				}

				indentLevel--

				return enum_
			}
		}

		throw new ParseError(tokens[state.cursor - 1])
	}

	const expectNewline = () => {
		const newline = expectToken(TokenKind.Newline)

		if (newline.data!.length != indentLevel)
			throw new WrongIndentLevelError(newline, indentLevel)
	}

	const expectToken = (expectedType: TokenKind) => {
		if (tokens[state.cursor]?.kind != expectedType)
			throw new ParseError(tokens[state.cursor], [ expectedType ])

		const token = tokens[state.cursor]!

		state.cursor++

		return token
	}

	const nextTokenIs = (...types: TokenKind[]): boolean => {
		if (tokens.length - state.cursor < types.length)
			return false

		for (const [ typeIndex, type ] of types.entries()) {
			if (tokens[state.cursor + typeIndex]!.kind != type)
				return false
		}

		return true
	}

	while (true) {
		yield parseExpression()

		if (state.cursor >= tokens.length)
			return

		if (!nextTokenIs(TokenKind.Newline))
			throw new ParseError(tokens[state.cursor], [ TokenKind.Newline ])

		const newline = tokens[state.cursor]!

		if (newline.data!.length < indentLevel)
			return

		if (newline.data!.length != indentLevel)
			throw new WrongIndentLevelError(newline, indentLevel)

		state.cursor++

		if (state.cursor >= tokens.length)
			return
	}
}
