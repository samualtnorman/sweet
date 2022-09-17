import { assert } from "@samual/lib"
import { getIntegerLength } from "./shared"
import { DataToken, DataTokenKind, NonDataToken, printToken, Token, TokenKind } from "./tokenise"

// TODO complain when number literal too big or small for bits

const DEBUG = false

export type Expression = Expression.BinaryOperation | Expression.Assignment | Expression.Rement |
	Expression.KeywordPrimitive | Expression.Array | Expression.BitwiseNot | Expression.Call |
	Expression.DeclaredImport | Expression.Destructure | Expression.Do | Expression.Enum | Expression.Float16Literal |
	Expression.Float32Literal | Expression.Float64Literal | Expression.Float128Literal | Expression.Function |
	Expression.FunctionType | Expression.GetMember | Expression.Identifier | Expression.If | Expression.Import |
	Expression.Let | Expression.LogicalNot | Expression.Loop | Expression.MinusPrefix | Expression.Object |
	Expression.Return | Expression.SignedIntegerLiteral | Expression.SignedIntegerType | Expression.String |
	Expression.UnsignedIntegerLiteral | Expression.UnsignedIntegerType | Expression.Void | Expression.While

export type ImportDestructureMember = { name: string, as: string | ImportDestructureMember[] }

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Expression {
	export type BinaryOperation = {
		kind: ExpressionKind.Add | ExpressionKind.As | ExpressionKind.BiggerThan | ExpressionKind.BiggerThanEquals |
			ExpressionKind.BitwiseAnd | ExpressionKind.BitwiseOr | ExpressionKind.Concatenate | ExpressionKind.Divide |
			ExpressionKind.Equals | ExpressionKind.Is | ExpressionKind.LogicalAnd | ExpressionKind.LogicalOr |
			ExpressionKind.Minus | ExpressionKind.Modulo | ExpressionKind.NotEquals | ExpressionKind.NullishCoalesce |
			ExpressionKind.Power | ExpressionKind.Range | ExpressionKind.ShiftLeft | ExpressionKind.ShiftRight |
			ExpressionKind.SmallerThan | ExpressionKind.SmallerThanEquals | ExpressionKind.Times | ExpressionKind.To |
			ExpressionKind.Union | ExpressionKind.WrappingAdd | ExpressionKind.WrappingDivide |
			ExpressionKind.WrappingMinus | ExpressionKind.WrappingPower | ExpressionKind.WrappingShiftLeft |
			ExpressionKind.WrappingTimes | ExpressionKind.Xor
		left: Expression
		right: Expression
	}

	export type Assignment = {
		kind: ExpressionKind.BitwiseAndAssign | ExpressionKind.BitwiseOrAssign | ExpressionKind.ConcatenateAssign |
			ExpressionKind.LogicalAndAssign | ExpressionKind.LogicalOrAssign | ExpressionKind.NormalAssign |
			ExpressionKind.NullishCoalesceAssign | ExpressionKind.ShiftLeftAssign |
			ExpressionKind.ShiftRightAssign | ExpressionKind.WrappingShiftLeftAssign | ExpressionKind.XorAssign
		binding: Identifier | GetMember | Destructure
		value: Expression
	}

	export type Rement = {
		kind: ExpressionKind.Increment | ExpressionKind.Decrement | ExpressionKind.WrappingIncrement |
			ExpressionKind.WrappingDecrement
		binding: Identifier | GetMember
	}

	export type KeywordPrimitive = {
		kind: ExpressionKind.Any | ExpressionKind.Boolean | ExpressionKind.False | ExpressionKind.Float128Type |
			ExpressionKind.Float16Type | ExpressionKind.Float32Type | ExpressionKind.Float64Type | ExpressionKind.Null |
			ExpressionKind.ObjectType | ExpressionKind.True
	}

	export type DeclaredImport = {
		kind: ExpressionKind.DeclaredImport
		module: string
		members: { name: string, as: string, type: Expression }[]
	}

	export type Destructure = {
		kind: ExpressionKind.Destructure
		members: { name: string, as: Identifier | Destructure, defaultValue: Expression | undefined }[]
	}

	export type Enum =
		{ kind: ExpressionKind.Enum, name: string, members: { name: string, type: Expression | undefined }[] }

	export type Function = {
		kind: ExpressionKind.Function
		name: string
		// eslint-disable-next-line @typescript-eslint/ban-types
		parameter: Identifier | Object
		parameterType: Expression | undefined
		returnType: Expression | undefined
		body: Expression[]
	}

	export type If = {
		kind: ExpressionKind.If
		condition: Expression
		truthyBranch: Expression
		falseyBranch: Expression | undefined
	}

	export type Import =
		{ kind: ExpressionKind.Import, path: string, as: string | ImportDestructureMember[] | undefined }

	export type Let = {
		kind: ExpressionKind.Let
		binding: Identifier | Destructure
		type: Expression | undefined
		initialValue: Expression | undefined
	}

	export type Object = {
		kind: ExpressionKind.Object
		entries: { name: string, type: Expression | undefined, value: Expression | undefined }[]
	}

	export type Array = { kind: ExpressionKind.Array, expressions: Expression[] }
	export type BitwiseNot = { kind: ExpressionKind.BitwiseNot, expression: Expression }
	export type Call = { kind: ExpressionKind.Call, called: Expression, argument: Expression }
	export type Do = { kind: ExpressionKind.Do, body: Expression[] }
	export type Float16Literal = { kind: ExpressionKind.Float16Literal, value: number }
	export type Float32Literal = { kind: ExpressionKind.Float32Literal, value: number }
	export type Float64Literal = { kind: ExpressionKind.Float64Literal, value: number }
	export type Float128Literal = { kind: ExpressionKind.Float128Literal, value: number }
	export type FunctionType = { kind: ExpressionKind.FunctionType, argumentType: Expression, returnType: Expression }
	export type GetMember = { kind: ExpressionKind.GetMember, expression: Expression, name: string }
	export type Identifier = { kind: ExpressionKind.Identifier, name: string }
	export type LogicalNot = { kind: ExpressionKind.LogicalNot, expression: Expression }
	export type Loop = { kind: ExpressionKind.Loop, body: Expression[] }
	export type MinusPrefix = { kind: ExpressionKind.MinusPrefix, expression: Expression }
	export type Return = { kind: ExpressionKind.Return, expression: Expression | undefined }
	export type SignedIntegerType = { kind: ExpressionKind.SignedIntegerType, bits: number }
	export type SignedIntegerLiteral = { kind: ExpressionKind.SignedIntegerLiteral, value: bigint, bits: number }
	export type String = { kind: ExpressionKind.String, value: string }
	export type UnsignedIntegerType = { kind: ExpressionKind.UnsignedIntegerType, bits: number }
	export type UnsignedIntegerLiteral = { kind: ExpressionKind.UnsignedIntegerLiteral, value: bigint, bits: number }
	export type Void = { kind: ExpressionKind.Void, expression: Expression }
	export type While = { kind: ExpressionKind.While, condition: Expression, body: Expression[] }
}

export enum ExpressionKind {
	Add, Any, Array, As, BiggerThan, BiggerThanEquals, BitwiseAnd, BitwiseAndAssign, BitwiseNot, BitwiseOr,
	BitwiseOrAssign, Boolean, Call, Concatenate, ConcatenateAssign, DeclaredImport, Decrement, Destructure, Divide, Do,
	Enum, Equals, False, Float16Literal, Float16Type, Float32Literal, Float32Type, Float64Literal, Float64Type,
	Float128Literal, Float128Type, Function, FunctionType, GetMember, Identifier, If, Import, Increment, Is, Let,
	LogicalAnd, LogicalAndAssign, LogicalNot, LogicalOr, LogicalOrAssign, Loop, Minus, MinusPrefix, Modulo,
	NormalAssign, NotEquals, Null, NullishCoalesce, NullishCoalesceAssign, Object, ObjectType, Power, Range, Return,
	ShiftLeft, ShiftLeftAssign, ShiftRight, ShiftRightAssign, SignedIntegerLiteral, SignedIntegerType, SmallerThan,
	SmallerThanEquals, String, Times, To, True, Union, UnsignedIntegerLiteral, UnsignedIntegerType, Void, While,
	WrappingAdd, WrappingDecrement, WrappingDivide, WrappingIncrement, WrappingMinus, WrappingPower, WrappingShiftLeft,
	WrappingShiftLeftAssign, WrappingTimes, Xor, XorAssign
}

export class ParseError extends Error {
	static {
		Object.defineProperty(this.prototype, `name`, { value: this.name })
	}

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
}

const getExpectedTypeNames = (expectedTypes: TokenKind[]) =>
	expectedTypes.map(expectedType => TokenKind[expectedType]).join(`, `)

export class WrongIndentLevelError extends ParseError {
	static {
		Object.defineProperty(this.prototype, `name`, { value: this.name })
	}

	constructor(
		public override readonly token: DataToken,
		public readonly expected: number
	) {
		super(undefined, [ TokenKind.Newline ])

		this.message =
			`wrong indent level, expected ${expected} but got ${token.data.length} at :${token.line + 1}:${1}`
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
	[TokenKind.And]: ExpressionKind.LogicalAnd,
	[TokenKind.LogicalOr]: ExpressionKind.LogicalOr,
	[TokenKind.Or]: ExpressionKind.LogicalOr,
	[TokenKind.NullishCoalesce]: ExpressionKind.NullishCoalesce,
	[TokenKind.Union]: ExpressionKind.Union,
	[TokenKind.Concatenate]: ExpressionKind.Concatenate,
	[TokenKind.To]: ExpressionKind.To,
	[TokenKind.As]: ExpressionKind.As,
	[TokenKind.DotDotDot]: ExpressionKind.Range,
	[TokenKind.Union]: ExpressionKind.Union
}

export const parseExpressions = function* (tokens: Token[], indentLevel: number, state: { cursor: number }): Generator<Expression, void> {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (DEBUG) {
		for (const token of tokens.slice(state.cursor))
			console.log(`DEBUG parseExpressions()`, printToken(token))

		console.log(`DEBUG parseExpressions() ---`)
	}

	const parseExpression = (noParseAssign: boolean): Expression => {
		const expression = maybeParseExpression(noParseAssign)

		if (expression)
			return expression

		throw new ParseError(tokens[state.cursor])
	}

	const maybeParseExpression = (noParseAssign: boolean): Expression | undefined => {
		assert(state.cursor < tokens.length, HERE)

		const firstToken = tokens[state.cursor]!
		let expression: Expression

		switch (firstToken.kind) {
			case TokenKind.While: {
				state.cursor++

				const condition = parseExpression(false)

				indentLevel++
				expectNewline()

				expression = {
					kind: ExpressionKind.While,
					condition,
					body: [ ...parseExpressions(tokens, indentLevel, state) ]
				}

				indentLevel--
			} break

			case TokenKind.If: {
				state.cursor++

				const condition = parseExpression(false)
				let truthyBranch: Expression

				if (nextTokenIs(TokenKind.Then)) {
					state.cursor++
					truthyBranch = parseExpression(false)
				} else {
					indentLevel++
					expectNewline()
					truthyBranch = { kind: ExpressionKind.Do, body: [ ...parseExpressions(tokens, indentLevel, state) ] }
					indentLevel--
				}

				if (nextTokenIs(TokenKind.Newline, TokenKind.Else))
					expectNewline()

				let falseyBranch: Expression | undefined

				if (nextTokenIs(TokenKind.Else)) {
					state.cursor++

					if (nextTokenIs(TokenKind.Newline)) {
						indentLevel++
						expectNewline()
						falseyBranch = { kind: ExpressionKind.Do, body: [ ...parseExpressions(tokens, indentLevel, state) ] }
						indentLevel--
					} else
						falseyBranch = parseExpression(false)
				}

				expression = { kind: ExpressionKind.If, condition, truthyBranch, falseyBranch }
			} break

			case TokenKind.Do: {
				state.cursor++
				indentLevel++
				expectNewline()
				expression = { kind: ExpressionKind.Do, body: [ ...parseExpressions(tokens, indentLevel, state) ] }
				indentLevel--
			} break

			case TokenKind.OpenBracket: {
				state.cursor++
				expression = parseExpression(false)
				expectToken(TokenKind.CloseBracket)
			} break

			case TokenKind.Null: {
				state.cursor++
				expression = { kind: ExpressionKind.Null }
			} break

			case TokenKind.Void: {
				state.cursor++
				expression = { kind: ExpressionKind.Void, expression: parseExpression(noParseAssign) }
			} break

			case TokenKind.Return: {
				state.cursor++
				expression = { kind: ExpressionKind.Return, expression: maybeParseExpression(noParseAssign) }
			} break

			case TokenKind.Let: {
				state.cursor++

				const binding: Expression.Identifier = {
					kind: ExpressionKind.Identifier,
					name: expectToken(TokenKind.Identifier).data!
				}

				let type

				if (nextTokenIs(TokenKind.Colon)) {
					state.cursor++
					type = parseExpression(true)
				}

				let initialValue

				if (nextTokenIs(TokenKind.Assign)) {
					state.cursor++
					initialValue = parseExpression(noParseAssign)
				}

				expression = { kind: ExpressionKind.Let, binding, type, initialValue }
			} break

			case TokenKind.Identifier: {
				state.cursor++
				expression = { kind: ExpressionKind.Identifier, name: firstToken.data }

				const secondToken = tokens[state.cursor]

				if (secondToken) {
					// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
					switch (secondToken.kind) {
						case TokenKind.Assign: {
							if (noParseAssign)
								return expression

							state.cursor++

							expression = {
								kind: ExpressionKind.NormalAssign,
								binding: expression,
								value: parseExpression(noParseAssign)
							}
						} break

						case TokenKind.Increment: {
							state.cursor++
							expression = { kind: ExpressionKind.Increment, binding: expression }
						} break

						case TokenKind.Decrement: {
							state.cursor++
							expression = { kind: ExpressionKind.Decrement, binding: expression }
						} break

						case TokenKind.WrappingIncrement: {
							state.cursor++
							expression = { kind: ExpressionKind.WrappingIncrement, binding: expression }
						} break

						case TokenKind.WrappingDecrement: {
							state.cursor++
							expression = { kind: ExpressionKind.WrappingDecrement, binding: expression }
						}
					}
				}
			} break

			case TokenKind.Number: {
				state.cursor++

				const secondToken = tokens[state.cursor]

				if (firstToken.data.includes(`.`)) {
					switch (secondToken?.kind) {
						case TokenKind.Float16Type: {
							state.cursor++
							expression = { kind: ExpressionKind.Float16Literal, value: Number(firstToken.data) }
						} break

						case TokenKind.Float32Type: {
							state.cursor++
							expression = { kind: ExpressionKind.Float32Literal, value: Number(firstToken.data) }
						} break

						case TokenKind.Float64Type: {
							state.cursor++
							expression = { kind: ExpressionKind.Float64Literal, value: Number(firstToken.data) }
						} break

						case TokenKind.Float128Type: {
							state.cursor++
							expression = { kind: ExpressionKind.Float128Literal, value: Number(firstToken.data) }
						} break

						default:
							expression = { kind: ExpressionKind.Float64Literal, value: Number(firstToken.data) }
					}
				} else {
					switch (secondToken?.kind) {
						case TokenKind.UnsignedIntegerType: {
							const bits = Number(secondToken.data)

							state.cursor++

							expression = {
								kind: ExpressionKind.UnsignedIntegerLiteral,
								value: BigInt(firstToken.data),
								bits
							}
						} break

						case TokenKind.SignedIntegerType: {
							const bits = Number(secondToken.data)

							state.cursor++

							expression = {
								kind: ExpressionKind.SignedIntegerLiteral,
								value: BigInt(firstToken.data),
								bits
							}
						} break

						case TokenKind.Float16Type: {
							state.cursor++
							expression = { kind: ExpressionKind.Float16Literal, value: Number(firstToken.data) }
						} break

						case TokenKind.Float32Type: {
							state.cursor++
							expression = { kind: ExpressionKind.Float32Literal, value: Number(firstToken.data) }
						} break

						case TokenKind.Float64Type: {
							state.cursor++
							expression = { kind: ExpressionKind.Float64Literal, value: Number(firstToken.data) }
						} break

						case TokenKind.Float128Type: {
							state.cursor++
							expression = { kind: ExpressionKind.Float128Literal, value: Number(firstToken.data) }
						} break

						default: {
							const value = BigInt(firstToken.data)

							expression = {
								kind: ExpressionKind.UnsignedIntegerLiteral,
								value,
								bits: getIntegerLength(value)
							}
						}
					}
				}
			} break

			case TokenKind.Float16Type: {
				state.cursor++
				expression = { kind: ExpressionKind.Float16Type }
			} break

			case TokenKind.Float32Type: {
				state.cursor++
				expression = { kind: ExpressionKind.Float32Type }
			} break

			case TokenKind.Float64Type: {
				state.cursor++
				expression = { kind: ExpressionKind.Float64Type }
			} break

			case TokenKind.Float128Type: {
				state.cursor++
				expression = { kind: ExpressionKind.Float128Type }
			} break

			case TokenKind.UnsignedIntegerType: {
				state.cursor++
				expression = { kind: ExpressionKind.UnsignedIntegerType, bits: Number(firstToken.data) }
			} break

			case TokenKind.SignedIntegerType: {
				state.cursor++
				expression = { kind: ExpressionKind.SignedIntegerType, bits: Number(firstToken.data) }
			} break

			case TokenKind.Enum: {
				state.cursor++
				expression = { kind: ExpressionKind.Enum, name: expectToken(TokenKind.Identifier).data, members: [] }
				indentLevel++
				expectNewline()

				while (true) {
					const name = expectToken(TokenKind.Identifier).data
					let type

					if (nextTokenIs(TokenKind.Colon)) {
						state.cursor++
						type = parseExpression(noParseAssign)
					}

					expression.members.push({ name, type })

					const newline = tokens[state.cursor]

					if (newline?.kind != TokenKind.Newline)
						throw new ParseError(newline, [ TokenKind.Newline ])

					if (newline.data.length < indentLevel)
						break

					if (newline.data.length != indentLevel)
						throw new WrongIndentLevelError(newline, indentLevel)

					state.cursor++
				}

				indentLevel--
			} break

			case TokenKind.Function: {
				state.cursor++

				const name = expectToken(TokenKind.Identifier).data
				const parameterName = expectToken(TokenKind.Identifier).data
				let parameterType

				if (nextTokenIs(TokenKind.Colon)) {
					state.cursor++
					parameterType = parseExpression(noParseAssign)
				}

				let returnType

				if (nextTokenIs(TokenKind.Arrow)) {
					state.cursor++
					returnType = parseExpression(noParseAssign)
				}

				indentLevel++
				expectNewline()

				expression = {
					kind: ExpressionKind.Function,
					name,
					parameter: { kind: ExpressionKind.Identifier, name: parameterName },
					parameterType,
					returnType,
					body: [ ...parseExpressions(tokens, indentLevel, state) ]
				}

				indentLevel--
			} break

			case TokenKind.OpenSquiglyBracket: {
				state.cursor++
				expression = { kind: ExpressionKind.Object, entries: [] }

				if (nextTokenIs(TokenKind.CloseSquiglyBracket)) {
					state.cursor++

					break
				}

				while (true) {
					const name = expectToken(TokenKind.Identifier).data
					let type

					if (nextTokenIs(TokenKind.Colon)) {
						state.cursor++
						type = parseExpression(true)
					}

					let value

					if (nextTokenIs(TokenKind.Assign)) {
						state.cursor++
						value = parseExpression(noParseAssign)
					}

					expression.entries.push({ name, type, value })

					if (nextTokenIs(TokenKind.CloseSquiglyBracket)) {
						state.cursor++

						break
					}

					expectToken(TokenKind.Comma)
				}
			} break

			default:
				return undefined
		}

		while (state.cursor < tokens.length) {
			if (nextTokenIs(TokenKind.Newline))
				return expression

			const kind = BinaryOperatorTokensToExpressionKinds[tokens[state.cursor]!.kind]

			if (!kind) {
				const argument = maybeParseExpression(noParseAssign)

				if (argument)
					return { kind: ExpressionKind.Call, called: expression, argument }

				return expression
			}

			state.cursor++
			expression = { kind, left: expression, right: parseExpression(noParseAssign) }
		}

		return expression
	}

	const expectNewline = () => {
		const newline = expectToken(TokenKind.Newline)

		if (newline.data.length != indentLevel)
			throw new WrongIndentLevelError(newline, indentLevel)
	}

	const expectToken = <K extends TokenKind>(expectedKind: K): K extends DataTokenKind ? DataToken : NonDataToken => {
		const token = tokens[state.cursor]

		if (token?.kind != expectedKind)
			throw new ParseError(token, [ expectedKind ])

		state.cursor++

		return token as any
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

	while (state.cursor < tokens.length) {
		yield parseExpression(false)

		const newline = tokens[state.cursor]

		if (newline?.kind != TokenKind.Newline)
			throw new ParseError(newline, [ TokenKind.Newline ])

		if (newline.data.length < indentLevel)
			return

		if (newline.data.length != indentLevel)
			throw new WrongIndentLevelError(newline, indentLevel)

		state.cursor++
	}
}
