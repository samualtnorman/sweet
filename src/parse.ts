import { assert } from "@samual/lib/assert"
import { error, getIntegerLength, type Location } from "./shared"
import { printToken, TokenTag, type DataToken, type DataTokenKind, type NonDataToken, type Token } from "./tokenise"

const DEBUG = false as boolean

export enum ExpressionTag {
	Add = 1, Any, Array, As, BiggerThan, BiggerThanEquals, BitwiseAnd, BitwiseAndAssign, BitwiseNot, BitwiseOr,
	BitwiseOrAssign, Boolean, Call, Concatenate, ConcatenateAssign, DeclaredImport, Decrement, Destructure, Divide, Do,
	Enum, ErrorEnum, ErrorTag, Equals, False, Float16Literal, Float16Type, Float32Literal, Float32Type, Float64Literal,
	Float64Type, Float128Literal, Float128Type, Function, FunctionType, GetMember, Identifier, If, Import,
	Increment, Is, Let, LogicalAnd, LogicalAndAssign, LogicalNot, LogicalOr, LogicalOrAssign, Loop, Minus, MinusPrefix,
	Modulo, NormalAssign, NotEquals, Null, NullishCoalesce, NullishCoalesceAssign, Object, ObjectType, Power, Range,
	Return, ShiftLeft, ShiftLeftAssign, ShiftRight, ShiftRightAssign, SignedIntegerLiteral, SignedIntegerType,
	SmallerThan, SmallerThanEquals, String, Times, To, True, Union, UnsignedIntegerLiteral, UnsignedIntegerType, Void,
	While, WrappingAdd, WrappingDecrement, WrappingDivide, WrappingIncrement, WrappingMinus, WrappingPower,
	WrappingShiftLeft, WrappingShiftLeftAssign, WrappingTimes, Xor, XorAssign
}

export const BinaryOperatorTokensToExpressionTags: { [Key in TokenTag]?: Expression.BinaryOperation[`tag`] } = {
	[TokenTag.Add]: ExpressionTag.Add,
	[TokenTag.Minus]: ExpressionTag.Minus,
	[TokenTag.Divide]: ExpressionTag.Divide,
	[TokenTag.Times]: ExpressionTag.Times,
	[TokenTag.Modulo]: ExpressionTag.Modulo,
	[TokenTag.Power]: ExpressionTag.Power,
	[TokenTag.WrappingAdd]: ExpressionTag.WrappingAdd,
	[TokenTag.WrappingMinus]: ExpressionTag.WrappingMinus,
	[TokenTag.WrappingDivide]: ExpressionTag.WrappingDivide,
	[TokenTag.WrappingTimes]: ExpressionTag.WrappingTimes,
	[TokenTag.WrappingPower]: ExpressionTag.WrappingPower,
	[TokenTag.Is]: ExpressionTag.Is,
	[TokenTag.SmallerThan]: ExpressionTag.SmallerThan,
	[TokenTag.BiggerThan]: ExpressionTag.BiggerThan,
	[TokenTag.SmallerThanEquals]: ExpressionTag.SmallerThanEquals,
	[TokenTag.BiggerThanEquals]: ExpressionTag.BiggerThanEquals,
	[TokenTag.Equals]: ExpressionTag.Equals,
	[TokenTag.NotEquals]: ExpressionTag.NotEquals,
	[TokenTag.ShiftLeft]: ExpressionTag.ShiftLeft,
	[TokenTag.ShiftRight]: ExpressionTag.ShiftRight,
	[TokenTag.WrappingShiftLeft]: ExpressionTag.WrappingShiftLeft,
	[TokenTag.BitwiseAnd]: ExpressionTag.BitwiseAnd,
	[TokenTag.BitwiseOr]: ExpressionTag.BitwiseOr,
	[TokenTag.Xor]: ExpressionTag.Xor,
	[TokenTag.LogicalAnd]: ExpressionTag.LogicalAnd,
	[TokenTag.And]: ExpressionTag.LogicalAnd,
	[TokenTag.LogicalOr]: ExpressionTag.LogicalOr,
	[TokenTag.Or]: ExpressionTag.LogicalOr,
	[TokenTag.NullishCoalesce]: ExpressionTag.NullishCoalesce,
	[TokenTag.Union]: ExpressionTag.Union,
	[TokenTag.Concatenate]: ExpressionTag.Concatenate,
	[TokenTag.To]: ExpressionTag.To,
	[TokenTag.As]: ExpressionTag.As,
	[TokenTag.DotDotDot]: ExpressionTag.Range
}

export const TypeTokenKindsToTypeExpressionKinds: { [Key in TokenTag]?: ExpressionTag } = {
	[TokenTag.UnsignedIntegerType]: ExpressionTag.UnsignedIntegerType,
	[TokenTag.SignedIntegerType]: ExpressionTag.SignedIntegerType,
	[TokenTag.Float16Type]: ExpressionTag.Float16Type,
	[TokenTag.Float32Type]: ExpressionTag.Float32Type,
	[TokenTag.Float64Type]: ExpressionTag.Float64Type,
	[TokenTag.Float128Type]: ExpressionTag.Float128Type
}

export function parse(tokens: Token[], fileName: string) {
	return parseExpressions(tokens, 0, { cursor: tokens[0]?.kind == TokenTag.Newline ? 1 : 0 }, fileName)
}

export default parse

export function* parseExpressions(
	tokens: Token[],
	indentLevel: number,
	state: { cursor: number },
	fileName: string
): Generator<Expression, void> {
	if (DEBUG) {
		for (const token of tokens.slice(state.cursor))
			console.log(`DEBUG parseExpressions()`, printToken(token))

		console.log(`DEBUG parseExpressions() ---`)
	}

	while (state.cursor < tokens.length) {
		yield parseExpression(false)

		const newline = tokens[state.cursor]

		if (newline?.kind != TokenTag.Newline)
			errorUnexpectedToken(newline, [ TokenTag.Newline ])

		if (newline.data.length < indentLevel)
			return

		if (newline.data.length != indentLevel)
			errorWrongIndentLevel(newline, indentLevel, tokens[state.cursor + 1])

		state.cursor++
	}

	function parseExpression(noParseAssign: boolean): Expression {
		const expression = maybeParseExpression(noParseAssign)

		if (expression)
			return expression

		errorUnexpectedToken(tokens[state.cursor])
	}

	function errorUnexpectedToken(token: Token | undefined, expectedKinds?: TokenTag[]): never {
		if (expectedKinds) {
			assert(expectedKinds.length, `expectedKinds must not be empty`)

			if (token) {
				error(
					`unexpected ${printToken(token)}, expected ${getExpectedTokenKindNames(expectedKinds)}`,
					fileName,
					token
				)
			}

			error(`unexpected end, expected ${getExpectedTokenKindNames(expectedKinds)}`, fileName)
		}

		if (token)
			error(`unexpected ${printToken(token)}`, fileName, token)

		error(`unexpected end`, fileName)
	}

	function errorWrongIndentLevel(token: DataToken, expected: number, tokenAfter?: Token): never {
		error(`wrong indent level of ${token.data.length}, expected ${expected}`, fileName, tokenAfter)
	}

	function maybeParseExpression(noParseAssign: boolean): Expression | undefined {
		assert(state.cursor < tokens.length, HERE)

		const firstToken = tokens[state.cursor]!
		let expression!: Expression

		const location: Location = { index: firstToken.index, line: firstToken.line, column: firstToken.column }

		switch (firstToken.kind) {
			case TokenTag.While: {
				state.cursor++

				const condition = parseExpression(false)

				indentLevel++
				expectNewline()

				expression = {
					tag: ExpressionTag.While,
					condition,
					body: [ ...parseExpressions(tokens, indentLevel, state, fileName) ],
					...location
				}

				indentLevel--
			} break

			case TokenTag.If: {
				state.cursor++

				const condition = parseExpression(false)
				let truthyBranch: Expression

				if (nextTokenIs(TokenTag.Then)) {
					state.cursor++
					truthyBranch = parseExpression(false)
				} else {
					indentLevel++
					expectNewline()

					truthyBranch = {
						tag: ExpressionTag.Do,
						body: [ ...parseExpressions(tokens, indentLevel, state, fileName) ],
						...location
					}

					indentLevel--
				}

				if (nextTokenIs(TokenTag.Newline, TokenTag.Else))
					expectNewline()

				let falseyBranch: Expression | undefined

				if (nextTokenIs(TokenTag.Else)) {
					state.cursor++

					if (nextTokenIs(TokenTag.Newline)) {
						indentLevel++
						expectNewline()

						falseyBranch = {
							tag: ExpressionTag.Do,
							body: [ ...parseExpressions(tokens, indentLevel, state, fileName) ],
							...location
						}

						indentLevel--
					} else
						falseyBranch = parseExpression(false)
				}

				expression = { tag: ExpressionTag.If, condition, truthyBranch, falseyBranch, ...location }
			} break

			case TokenTag.Do: {
				state.cursor++
				indentLevel++
				expectNewline()

				expression = {
					tag: ExpressionTag.Do,
					body: [ ...parseExpressions(tokens, indentLevel, state, fileName) ],
					...location
				}

				indentLevel--
			} break

			case TokenTag.OpenBracket: {
				state.cursor++
				expression = parseExpression(false)
				expectToken(TokenTag.CloseBracket)
			} break

			case TokenTag.Null: {
				state.cursor++
				expression = { tag: ExpressionTag.Null, ...location }
			} break

			case TokenTag.Void: {
				state.cursor++

				expression =
					{ tag: ExpressionTag.Void, expression: parseExpression(noParseAssign), ...location }
			} break

			case TokenTag.Return: {
				state.cursor++

				expression =
					{ tag: ExpressionTag.Return, expression: maybeParseExpression(noParseAssign), ...location }
			} break

			case TokenTag.Let: {
				state.cursor++

				const binding = parseIdentifier(expectToken(TokenTag.Identifier))
				let type

				if (nextTokenIs(TokenTag.Colon)) {
					state.cursor++
					type = parseExpression(true)
				}

				let initialValue

				if (nextTokenIs(TokenTag.Assign)) {
					state.cursor++
					initialValue = parseExpression(noParseAssign)
				}

				expression = { tag: ExpressionTag.Let, binding, type, initialValue, ...location }
			} break

			case TokenTag.Identifier: {
				state.cursor++
				expression = parseIdentifier(firstToken)

				const secondToken = tokens[state.cursor]

				if (secondToken) {
					// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
					switch (secondToken.kind) {
						case TokenTag.Assign: {
							if (noParseAssign)
								return expression

							state.cursor++

							expression = {
								tag: ExpressionTag.NormalAssign,
								binding: expression,
								value: parseExpression(noParseAssign),
								...location
							}
						} break

						case TokenTag.Increment: {
							state.cursor++
							expression = { tag: ExpressionTag.Increment, binding: expression, ...location }
						} break

						case TokenTag.Decrement: {
							state.cursor++
							expression = { tag: ExpressionTag.Decrement, binding: expression, ...location }
						} break

						case TokenTag.WrappingIncrement: {
							state.cursor++

							expression =
								{ tag: ExpressionTag.WrappingIncrement, binding: expression, ...location }
						} break

						case TokenTag.WrappingDecrement: {
							state.cursor++

							expression =
								{ tag: ExpressionTag.WrappingDecrement, binding: expression, ...location }
						}
					}
				}
			} break

			case TokenTag.Number: {
				state.cursor++

				const type = tokens[state.cursor]

				if (firstToken.data.includes(`.`)) {
					switch (type?.kind) {
						case TokenTag.Float16Type: {
							state.cursor++

							expression = {
								tag: ExpressionTag.Float16Literal,
								value: Number(firstToken.data),
								...location
							}
						} break

						case TokenTag.Float32Type: {
							state.cursor++

							expression = {
								tag: ExpressionTag.Float32Literal,
								value: Number(firstToken.data),
								...location
							}
						} break

						case TokenTag.Float64Type: {
							state.cursor++

							expression = {
								tag: ExpressionTag.Float64Literal,
								value: Number(firstToken.data),
								...location
							}
						} break

						case TokenTag.Float128Type: {
							state.cursor++

							expression = {
								tag: ExpressionTag.Float128Literal,
								value: Number(firstToken.data),
								...location
							}
						} break

						// TODO handle and complain about incompatble types like `i32` here

						default: {
							expression = {
								// TODO this should probably be the native bit one e.g. 32 bit on 32 bit systems
								// instead of giving parse() the bit size, a place holder ExpressionKind should be set
								tag: ExpressionTag.Float64Literal,
								value: Number(firstToken.data),
								...location
							}
						}
					}
				} else {
					// TODO complain when integer is too large for bits

					switch (type?.kind) {
						case TokenTag.UnsignedIntegerType: {
							state.cursor++

							expression = {
								tag: ExpressionTag.UnsignedIntegerLiteral,
								value: BigInt(firstToken.data),
								bits: Number(type.data),
								...location
							}
						} break

						case TokenTag.SignedIntegerType: {
							state.cursor++

							expression = {
								tag: ExpressionTag.SignedIntegerLiteral,
								value: BigInt(firstToken.data),
								bits: Number(type.data),
								...location
							}
						} break

						case TokenTag.Float16Type: {
							state.cursor++

							expression = {
								tag: ExpressionTag.Float16Literal,
								value: Number(firstToken.data),
								...location
							}
						} break

						case TokenTag.Float32Type: {
							state.cursor++

							expression = {
								tag: ExpressionTag.Float32Literal,
								value: Number(firstToken.data),
								...location
							}
						} break

						case TokenTag.Float64Type: {
							state.cursor++

							expression = {
								tag: ExpressionTag.Float64Literal,
								value: Number(firstToken.data),
								...location
							}
						} break

						case TokenTag.Float128Type: {
							state.cursor++

							expression = {
								tag: ExpressionTag.Float128Literal,
								value: Number(firstToken.data),
								...location
							}
						} break

						default: {
							const value = BigInt(firstToken.data)

							expression = {
								tag: ExpressionTag.UnsignedIntegerLiteral,
								value,
								bits: getIntegerLength(value),
								...location
							}
						}
					}
				}
			} break

			case TokenTag.Float16Type: {
				state.cursor++
				expression = { tag: ExpressionTag.Float16Type, ...location }
			} break

			case TokenTag.Float32Type: {
				state.cursor++
				expression = { tag: ExpressionTag.Float32Type, ...location }
			} break

			case TokenTag.Float64Type: {
				state.cursor++
				expression = { tag: ExpressionTag.Float64Type, ...location }
			} break

			case TokenTag.Float128Type: {
				state.cursor++
				expression = { tag: ExpressionTag.Float128Type, ...location }
			} break

			case TokenTag.UnsignedIntegerType: {
				state.cursor++

				expression = {
					tag: ExpressionTag.UnsignedIntegerType,
					bits: firstToken.data ? Number(firstToken.data) : undefined,
					...location
				}
			} break

			case TokenTag.SignedIntegerType: {
				state.cursor++

				expression = {
					tag: ExpressionTag.SignedIntegerType,
					bits: firstToken.data ? Number(firstToken.data) : undefined,
					...location
				}
			} break

			case TokenTag.Enum: {
				state.cursor++

				expression = {
					tag: ExpressionTag.Enum,
					name: expectToken(TokenTag.Identifier).data,
					members: [],
					...location
				}

				indentLevel++
				expectNewline()

				while (true) {
					const name = expectToken(TokenTag.Identifier).data
					let type

					if (nextTokenIs(TokenTag.Colon)) {
						state.cursor++
						type = parseExpression(noParseAssign)
					}

					expression.members.push({ name, type })

					const newline = tokens[state.cursor]

					if (newline?.kind != TokenTag.Newline)
						errorUnexpectedToken(newline, [ TokenTag.Newline ])

					if (newline.data.length < indentLevel)
						break

					if (newline.data.length != indentLevel)
						errorWrongIndentLevel(newline, indentLevel, tokens[state.cursor + 1])

					state.cursor++
				}

				indentLevel--
			} break

			case TokenTag.Function: {
				state.cursor++

				const name = expectToken(TokenTag.Identifier).data

				const parameter = nextTokenIs(TokenTag.OpenSquiglyBracket)
					? parseObject(expectToken(TokenTag.OpenSquiglyBracket))
					: parseIdentifier(expectToken(TokenTag.Identifier))

				let parameterType

				if (nextTokenIs(TokenTag.Colon)) {
					state.cursor++
					parameterType = parseExpression(noParseAssign)
				}

				let returnType

				if (nextTokenIs(TokenTag.Arrow)) {
					state.cursor++
					returnType = parseExpression(noParseAssign)
				}

				indentLevel++
				expectNewline()

				expression = {
					tag: ExpressionTag.Function,
					name,
					parameter,
					parameterType,
					returnType,
					body: [ ...parseExpressions(tokens, indentLevel, state, fileName) ],
					...location
				}

				indentLevel--
			} break

			case TokenTag.OpenSquiglyBracket: {
				state.cursor++
				expression = parseObject(firstToken)
			} break

			case TokenTag.ErrorKeyword: {
				state.cursor++

				// const identifier = expectToken(TokenTag.Identifier)

				if (nextTokenIs(TokenTag.Identifier)) {
					expression = {
						tag: ExpressionTag.ErrorEnum,
						name: expectToken(TokenTag.Identifier).data,
						members: [],
						...location
					}

					indentLevel++
					expectNewline()

					while (true) {
						const name = expectToken(TokenTag.Identifier).data
						let type

						if (nextTokenIs(TokenTag.Colon)) {
							state.cursor++
							type = parseExpression(noParseAssign)
						}

						expression.members.push({ name, type })

						const newline = tokens[state.cursor]

						if (newline?.kind != TokenTag.Newline)
							errorUnexpectedToken(newline, [ TokenTag.Newline ])

						if (newline.data.length < indentLevel)
							break

						if (newline.data.length != indentLevel)
							errorWrongIndentLevel(newline, indentLevel, tokens[state.cursor + 1])

						state.cursor++
					}

					indentLevel--
				}
			} break

			case TokenTag.Loop: {
				state.cursor++
				indentLevel++
				expectNewline()

				expression = {
					tag: ExpressionTag.Loop,
					body: [ ...parseExpressions(tokens, indentLevel, state, fileName) ],
					...location
				}

				indentLevel--
			} break

			case TokenTag.Minus: {
				state.cursor++

				if (nextTokenIs(TokenTag.Number)) {
					const number = expectToken(TokenTag.Number)
					const type = tokens[state.cursor]

					if (number.data.includes(`.`)) {
						switch (type?.kind) {
							case TokenTag.Float16Type: {
								state.cursor++

								expression = {
									tag: ExpressionTag.Float16Literal,
									value: -Number(number.data),
									...location
								}
							} break

							case TokenTag.Float32Type: {
								state.cursor++

								expression = {
									tag: ExpressionTag.Float32Literal,
									value: -Number(number.data),
									...location
								}
							} break

							case TokenTag.Float64Type: {
								state.cursor++

								expression = {
									tag: ExpressionTag.Float64Literal,
									value: -Number(number.data),
									...location
								}
							} break

							case TokenTag.Float128Type: {
								state.cursor++

								expression = {
									tag: ExpressionTag.Float128Literal,
									value: -Number(number.data),
									...location
								}
							} break

							// TODO handle and complain about incompatble types like `i32` here

							default: {
								expression = {
									// TODO this should probably be the native bit one e.g. 32 bit on 32 bit systems
									// instead of giving parse() the bit size, a place holder ExpressionKind should be set
									tag: ExpressionTag.Float64Literal,
									value: -Number(number.data),
									...location
								}
							}
						}
					} else {
						// TODO complain when integer is too large for bits

						switch (type?.kind) {
							case TokenTag.UnsignedIntegerType:
								error(`u${type.data} does not support negative integers`, fileName, type)

							case TokenTag.SignedIntegerType: {
								state.cursor++

								expression = {
									tag: ExpressionTag.SignedIntegerLiteral,
									value: -BigInt(number.data),
									bits: Number(type.data),
									...location
								}
							} break

							case TokenTag.Float16Type: {
								state.cursor++

								expression = {
									tag: ExpressionTag.Float16Literal,
									value: -Number(number.data),
									...location
								}
							} break

							case TokenTag.Float32Type: {
								state.cursor++

								expression = {
									tag: ExpressionTag.Float32Literal,
									value: -Number(number.data),
									...location
								}
							} break

							case TokenTag.Float64Type: {
								state.cursor++

								expression = {
									tag: ExpressionTag.Float64Literal,
									value: -Number(number.data),
									...location
								}
							} break

							case TokenTag.Float128Type: {
								state.cursor++

								expression = {
									tag: ExpressionTag.Float128Literal,
									value: -Number(number.data),
									...location
								}
							} break

							default: {
								const value = -BigInt(number.data)

								expression = {
									tag: ExpressionTag.SignedIntegerLiteral,
									value,
									bits: getIntegerLength(value) + 1,
									...location
								}
							}
						}
					}
				} else {
					expression = {
						tag: ExpressionTag.MinusPrefix,
						expression: parseExpression(noParseAssign),
						...location
					}
				}
			} break

			case TokenTag.Declare: {
				state.cursor++
				expectToken(TokenTag.Import)

				expression = {
					tag: ExpressionTag.DeclaredImport,
					module: expectToken(TokenTag.String).data,
					members: [],
					...location
				}

				expectToken(TokenTag.OpenSquiglyBracket)
				indentLevel++

				while (true) {
					const name = expectToken(TokenTag.Identifier).data
					const as = maybeEatOneOf(TokenTag.As) ? expectToken(TokenTag.Identifier).data : undefined

					expectToken(TokenTag.Colon)
					expression.members.push({ name, as: as ?? name, type: parseExpression(true) })

					if (maybeEatOneOf(TokenTag.CloseSquiglyBracket))
						break

					eatOneOf(TokenTag.Newline, TokenTag.Comma)
				}
			} break

			default:
				return
		}

		while (state.cursor < tokens.length) {
			if (nextTokenIs(TokenTag.Newline))
				return expression

			const kind = BinaryOperatorTokensToExpressionTags[tokens[state.cursor]!.kind]

			if (!kind) {
				const argument = maybeParseExpression(noParseAssign)

				if (argument)
					return { tag: ExpressionTag.Call, called: expression, argument, ...location }

				return expression
			}

			state.cursor++
			expression = { tag: kind, left: expression, right: parseExpression(noParseAssign), ...location }
		}

		return expression

		function parseObject(firstToken: NonDataToken) {
			const object: Expression.Object & Location = {
				tag: ExpressionTag.Object,
				entries: [],
				index: firstToken.index,
				line: firstToken.line,
				column: firstToken.column
			}

			if (nextTokenIs(TokenTag.CloseSquiglyBracket)) {
				state.cursor++

				return object
			}

			while (true) {
				const name = expectToken(TokenTag.Identifier).data
				let type

				if (nextTokenIs(TokenTag.Colon)) {
					state.cursor++
					type = parseExpression(true)
				}

				let value

				if (nextTokenIs(TokenTag.Assign)) {
					state.cursor++
					value = parseExpression(noParseAssign)
				}

				object.entries.push({ name, type, value })

				if (nextTokenIs(TokenTag.CloseSquiglyBracket)) {
					state.cursor++

					break
				}

				expectToken(TokenTag.Comma)
			}

			return object
		}
	}

	function expectNewline() {
		const newline = expectToken(TokenTag.Newline)

		if (newline.data.length != indentLevel)
			errorWrongIndentLevel(newline, indentLevel, tokens[state.cursor])
	}

	function nextTokenIs(...kinds: TokenTag[]): boolean {
		if (tokens.length - state.cursor < kinds.length)
			return false

		for (const [ index, kind ] of kinds.entries()) {
			const token = tokens[state.cursor + index]!

			if (token.kind != kind)
				return false

			if (token.kind == TokenTag.Newline && token.data.length != indentLevel)
				errorWrongIndentLevel(token, indentLevel, tokens[state.cursor])
		}

		return true
	}

	function expectToken<K extends TokenTag>(expectedKind: K): K extends DataTokenKind ? DataToken : NonDataToken {
		const token = tokens[state.cursor]

		if (token?.kind != expectedKind)
			errorUnexpectedToken(token, [ expectedKind ])

		state.cursor++

		return token as any
	}

	function maybeEatOneOf(...kinds: TokenTag[]): boolean {
		for (const kind of kinds) {
			if (nextTokenIs(kind)) {
				state.cursor++

				return true
			}
		}

		return false
	}

	function eatOneOf(...kinds: TokenTag[]): void {
		if (!maybeEatOneOf(...kinds))
			errorUnexpectedToken(tokens[state.cursor], kinds)
	}
}

export function getExpectedTokenKindNames(expectedKinds: TokenTag[]) {
	return expectedKinds.map(expectedType => TokenTag[expectedType]).join(`, `)
}

export function parseIdentifier(identifier: DataToken): Expression.Identifier & Location {
	return {
		tag: ExpressionTag.Identifier,
		name: identifier.data,
		index: identifier.index,
		line: identifier.line,
		column: identifier.column
	}
}

export type Expression = (
	Expression.BinaryOperation | Expression.Assignment | Expression.Rement | Expression.KeywordPrimitive |
	Expression.Array | Expression.BitwiseNot | Expression.Call | Expression.DeclaredImport | Expression.Destructure |
	Expression.Do | Expression.Enum | Expression.ErrorEnum | Expression.Float16Literal | Expression.Float32Literal |
	Expression.Float64Literal | Expression.Float128Literal | Expression.Function | Expression.FunctionType |
	Expression.GetMember | Expression.Identifier | Expression.If | Expression.Import | Expression.Let |
	Expression.LogicalNot | Expression.Loop | Expression.MinusPrefix | Expression.Object | Expression.Return |
	Expression.SignedIntegerLiteral | Expression.SignedIntegerType | Expression.String |
	Expression.UnsignedIntegerLiteral | Expression.UnsignedIntegerType | Expression.Void | Expression.While
) & Location

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Expression {
	export type BinaryOperation = {
		tag: ExpressionTag.Add | ExpressionTag.As | ExpressionTag.BiggerThan | ExpressionTag.BiggerThanEquals |
			ExpressionTag.BitwiseAnd | ExpressionTag.BitwiseOr | ExpressionTag.Concatenate | ExpressionTag.Divide |
			ExpressionTag.Equals | ExpressionTag.Is | ExpressionTag.LogicalAnd | ExpressionTag.LogicalOr |
			ExpressionTag.Minus | ExpressionTag.Modulo | ExpressionTag.NotEquals | ExpressionTag.NullishCoalesce |
			ExpressionTag.Power | ExpressionTag.Range | ExpressionTag.ShiftLeft | ExpressionTag.ShiftRight |
			ExpressionTag.SmallerThan | ExpressionTag.SmallerThanEquals | ExpressionTag.Times | ExpressionTag.To |
			ExpressionTag.Union | ExpressionTag.WrappingAdd | ExpressionTag.WrappingDivide |
			ExpressionTag.WrappingMinus | ExpressionTag.WrappingPower | ExpressionTag.WrappingShiftLeft |
			ExpressionTag.WrappingTimes | ExpressionTag.Xor
		left: Expression
		right: Expression
	}

	export type Assignment = {
		tag: ExpressionTag.BitwiseAndAssign | ExpressionTag.BitwiseOrAssign | ExpressionTag.ConcatenateAssign |
			ExpressionTag.LogicalAndAssign | ExpressionTag.LogicalOrAssign | ExpressionTag.NormalAssign |
			ExpressionTag.NullishCoalesceAssign | ExpressionTag.ShiftLeftAssign |
			ExpressionTag.ShiftRightAssign | ExpressionTag.WrappingShiftLeftAssign | ExpressionTag.XorAssign
		binding: Identifier | GetMember | Destructure
		value: Expression
	}

	export type Rement = {
		tag: ExpressionTag.Increment | ExpressionTag.Decrement | ExpressionTag.WrappingIncrement |
			ExpressionTag.WrappingDecrement
		binding: Identifier | GetMember
	}

	export type KeywordPrimitive = {
		tag: ExpressionTag.Any | ExpressionTag.Boolean | ExpressionTag.False | ExpressionTag.Float128Type |
			ExpressionTag.Float16Type | ExpressionTag.Float32Type | ExpressionTag.Float64Type | ExpressionTag.Null |
			ExpressionTag.ObjectType | ExpressionTag.True
	}

	export type DeclaredImport = {
		tag: ExpressionTag.DeclaredImport
		module: string
		members: { name: string, as: string, type: Expression }[]
	}

	export type Destructure = {
		tag: ExpressionTag.Destructure
		members: { name: string, as: Identifier | Destructure, defaultValue: Expression | undefined }[]
	}

	export type Enum = Location &
		{ tag: ExpressionTag.Enum, name: string, members: { name: string, type: Expression | undefined }[] }

	export type ErrorEnum = Location &
		{ tag: ExpressionTag.ErrorEnum, name: string, members: { name: string, type: Expression | undefined }[] }

	export type Function = {
		tag: ExpressionTag.Function
		name: string
		// eslint-disable-next-line @typescript-eslint/ban-types
		parameter: Identifier | Object
		parameterType: Expression | undefined
		returnType: Expression | undefined
		body: Expression[]
	}

	export type FunctionType = Location &
		{ tag: ExpressionTag.FunctionType, argumentType: Expression, returnType: Expression }

	export type If = {
		tag: ExpressionTag.If
		condition: Expression
		truthyBranch: Expression
		falseyBranch: Expression | undefined
	}

	export type Import = Location &
		{ tag: ExpressionTag.Import, path: string, as: string | ImportDestructureMember[] | undefined }

	export type Let = {
		tag: ExpressionTag.Let
		binding: Identifier | Destructure
		type: Expression | undefined
		initialValue: Expression | undefined
	}

	export type Object = {
		tag: ExpressionTag.Object
		entries: { name: string, type: Expression | undefined, value: Expression | undefined }[]
	}

	export type SignedIntegerLiteral = Location &
		{ tag: ExpressionTag.SignedIntegerLiteral, value: bigint, bits: number }

	export type SignedIntegerType = Location &
		{ tag: ExpressionTag.SignedIntegerType, bits: number | undefined }

	export type UnsignedIntegerLiteral = Location &
		{ tag: ExpressionTag.UnsignedIntegerLiteral, value: bigint, bits: number }

	export type UnsignedIntegerType = Location &
		{ tag: ExpressionTag.UnsignedIntegerType, bits: number | undefined }

	export type Array = { tag: ExpressionTag.Array, expressions: Expression[] }
	export type BitwiseNot = { tag: ExpressionTag.BitwiseNot, expression: Expression }
	export type Call = { tag: ExpressionTag.Call, called: Expression, argument: Expression }
	export type Do = { tag: ExpressionTag.Do, body: Expression[] }
	export type Float16Literal = { tag: ExpressionTag.Float16Literal, value: number }
	export type Float32Literal = { tag: ExpressionTag.Float32Literal, value: number }
	export type Float64Literal = { tag: ExpressionTag.Float64Literal, value: number }
	export type Float128Literal = { tag: ExpressionTag.Float128Literal, value: number }
	export type GetMember = { tag: ExpressionTag.GetMember, expression: Expression, name: string }
	export type Identifier = { tag: ExpressionTag.Identifier, name: string }
	export type LogicalNot = { tag: ExpressionTag.LogicalNot, expression: Expression }
	export type Loop = { tag: ExpressionTag.Loop, body: Expression[] }
	export type MinusPrefix = { tag: ExpressionTag.MinusPrefix, expression: Expression }
	export type Return = { tag: ExpressionTag.Return, expression: Expression | undefined }
	export type String = { tag: ExpressionTag.String, value: string }
	export type Void = { tag: ExpressionTag.Void, expression: Expression }
	export type While = { tag: ExpressionTag.While, condition: Expression, body: Expression[] }
	export type ErrorTag = { tag: ExpressionTag.ErrorTag, name: string, type: Expression | undefined }
}

export type ImportDestructureMember = { name: string, as: string | ImportDestructureMember[] }
