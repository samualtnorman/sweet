import { assert } from "@samual/lib/assert"
import { error, getIntegerLength, Location } from "./shared"
import { DataToken, DataTokenKind, NonDataToken, printToken, Token, TokenKind } from "./tokenise"

const DEBUG = false as boolean

export enum ExpressionKind {
	Add = 1, Any, Array, As, BiggerThan, BiggerThanEquals, BitwiseAnd, BitwiseAndAssign, BitwiseNot, BitwiseOr,
	BitwiseOrAssign, Boolean, Call, Concatenate, ConcatenateAssign, DeclaredImport, Decrement, Destructure, Divide, Do,
	Enum, ErrorEnum, Equals, False, Float16Literal, Float16Type, Float32Literal, Float32Type, Float64Literal,
	Float64Type, Float128Literal, Float128Type, Function, FunctionType, GetMember, GlobalError, Identifier, If, Import,
	Increment, Is, Let, LogicalAnd, LogicalAndAssign, LogicalNot, LogicalOr, LogicalOrAssign, Loop, Minus, MinusPrefix,
	Modulo, NormalAssign, NotEquals, Null, NullishCoalesce, NullishCoalesceAssign, Object, ObjectType, Power, Range,
	Return, ShiftLeft, ShiftLeftAssign, ShiftRight, ShiftRightAssign, SignedIntegerLiteral, SignedIntegerType,
	SmallerThan, SmallerThanEquals, String, Times, To, True, Union, UnsignedIntegerLiteral, UnsignedIntegerType, Void,
	While, WrappingAdd, WrappingDecrement, WrappingDivide, WrappingIncrement, WrappingMinus, WrappingPower,
	WrappingShiftLeft, WrappingShiftLeftAssign, WrappingTimes, Xor, XorAssign
}

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
	[TokenKind.DotDotDot]: ExpressionKind.Range
}

export const TypeTokenKindsToTypeExpressionKinds: { [Key in TokenKind]?: ExpressionKind } = {
	[TokenKind.UnsignedIntegerType]: ExpressionKind.UnsignedIntegerType,
	[TokenKind.SignedIntegerType]: ExpressionKind.SignedIntegerType,
	[TokenKind.Float16Type]: ExpressionKind.Float16Type,
	[TokenKind.Float32Type]: ExpressionKind.Float32Type,
	[TokenKind.Float64Type]: ExpressionKind.Float64Type,
	[TokenKind.Float128Type]: ExpressionKind.Float128Type
}

export function parse(tokens: Token[], fileName: string) {
	return parseExpressions(tokens, 0, { cursor: tokens[0]?.kind == TokenKind.Newline ? 1 : 0 }, fileName)
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

		if (newline?.kind != TokenKind.Newline)
			errorUnexpectedToken(newline, [ TokenKind.Newline ])

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

	function errorUnexpectedToken(token: Token | undefined, expectedKinds?: TokenKind[]): never {
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
		let expression: Expression

		const location: Location = { index: firstToken.index, line: firstToken.line, column: firstToken.column }

		switch (firstToken.kind) {
			case TokenKind.While: {
				state.cursor++

				const condition = parseExpression(false)

				indentLevel++
				expectNewline()

				expression = {
					kind: ExpressionKind.While,
					condition,
					body: [ ...parseExpressions(tokens, indentLevel, state, fileName) ],
					...location
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

					truthyBranch = {
						kind: ExpressionKind.Do,
						body: [ ...parseExpressions(tokens, indentLevel, state, fileName) ],
						...location
					}

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

						falseyBranch = {
							kind: ExpressionKind.Do,
							body: [ ...parseExpressions(tokens, indentLevel, state, fileName) ],
							...location
						}

						indentLevel--
					} else
						falseyBranch = parseExpression(false)
				}

				expression = { kind: ExpressionKind.If, condition, truthyBranch, falseyBranch, ...location }
			} break

			case TokenKind.Do: {
				state.cursor++
				indentLevel++
				expectNewline()

				expression = {
					kind: ExpressionKind.Do,
					body: [ ...parseExpressions(tokens, indentLevel, state, fileName) ],
					...location
				}

				indentLevel--
			} break

			case TokenKind.OpenBracket: {
				state.cursor++
				expression = parseExpression(false)
				expectToken(TokenKind.CloseBracket)
			} break

			case TokenKind.Null: {
				state.cursor++
				expression = { kind: ExpressionKind.Null, ...location }
			} break

			case TokenKind.Void: {
				state.cursor++

				expression =
					{ kind: ExpressionKind.Void, expression: parseExpression(noParseAssign), ...location }
			} break

			case TokenKind.Return: {
				state.cursor++

				expression =
					{ kind: ExpressionKind.Return, expression: maybeParseExpression(noParseAssign), ...location }
			} break

			case TokenKind.Let: {
				state.cursor++

				const binding = parseIdentifier(expectToken(TokenKind.Identifier))
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

				expression = { kind: ExpressionKind.Let, binding, type, initialValue, ...location }
			} break

			case TokenKind.Identifier: {
				state.cursor++
				expression = parseIdentifier(firstToken)

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
								value: parseExpression(noParseAssign),
								...location
							}
						} break

						case TokenKind.Increment: {
							state.cursor++
							expression = { kind: ExpressionKind.Increment, binding: expression, ...location }
						} break

						case TokenKind.Decrement: {
							state.cursor++
							expression = { kind: ExpressionKind.Decrement, binding: expression, ...location }
						} break

						case TokenKind.WrappingIncrement: {
							state.cursor++

							expression =
								{ kind: ExpressionKind.WrappingIncrement, binding: expression, ...location }
						} break

						case TokenKind.WrappingDecrement: {
							state.cursor++

							expression =
								{ kind: ExpressionKind.WrappingDecrement, binding: expression, ...location }
						}
					}
				}
			} break

			case TokenKind.Number: {
				state.cursor++

				const type = tokens[state.cursor]

				if (firstToken.data.includes(`.`)) {
					switch (type?.kind) {
						case TokenKind.Float16Type: {
							state.cursor++

							expression = {
								kind: ExpressionKind.Float16Literal,
								value: Number(firstToken.data),
								...location
							}
						} break

						case TokenKind.Float32Type: {
							state.cursor++

							expression = {
								kind: ExpressionKind.Float32Literal,
								value: Number(firstToken.data),
								...location
							}
						} break

						case TokenKind.Float64Type: {
							state.cursor++

							expression = {
								kind: ExpressionKind.Float64Literal,
								value: Number(firstToken.data),
								...location
							}
						} break

						case TokenKind.Float128Type: {
							state.cursor++

							expression = {
								kind: ExpressionKind.Float128Literal,
								value: Number(firstToken.data),
								...location
							}
						} break

						// TODO handle and complain about incompatble types like `i32` here

						default: {
							expression = {
								// TODO this should probably be the native bit one e.g. 32 bit on 32 bit systems
								// instead of giving parse() the bit size, a place holder ExpressionKind should be set
								kind: ExpressionKind.Float64Literal,
								value: Number(firstToken.data),
								...location
							}
						}
					}
				} else {
					// TODO complain when integer is too large for bits

					switch (type?.kind) {
						case TokenKind.UnsignedIntegerType: {
							state.cursor++

							expression = {
								kind: ExpressionKind.UnsignedIntegerLiteral,
								value: BigInt(firstToken.data),
								bits: Number(type.data),
								...location
							}
						} break

						case TokenKind.SignedIntegerType: {
							state.cursor++

							expression = {
								kind: ExpressionKind.SignedIntegerLiteral,
								value: BigInt(firstToken.data),
								bits: Number(type.data),
								...location
							}
						} break

						case TokenKind.Float16Type: {
							state.cursor++

							expression = {
								kind: ExpressionKind.Float16Literal,
								value: Number(firstToken.data),
								...location
							}
						} break

						case TokenKind.Float32Type: {
							state.cursor++

							expression = {
								kind: ExpressionKind.Float32Literal,
								value: Number(firstToken.data),
								...location
							}
						} break

						case TokenKind.Float64Type: {
							state.cursor++

							expression = {
								kind: ExpressionKind.Float64Literal,
								value: Number(firstToken.data),
								...location
							}
						} break

						case TokenKind.Float128Type: {
							state.cursor++

							expression = {
								kind: ExpressionKind.Float128Literal,
								value: Number(firstToken.data),
								...location
							}
						} break

						default: {
							const value = BigInt(firstToken.data)

							expression = {
								kind: ExpressionKind.UnsignedIntegerLiteral,
								value,
								bits: getIntegerLength(value),
								...location
							}
						}
					}
				}
			} break

			case TokenKind.Float16Type: {
				state.cursor++
				expression = { kind: ExpressionKind.Float16Type, ...location }
			} break

			case TokenKind.Float32Type: {
				state.cursor++
				expression = { kind: ExpressionKind.Float32Type, ...location }
			} break

			case TokenKind.Float64Type: {
				state.cursor++
				expression = { kind: ExpressionKind.Float64Type, ...location }
			} break

			case TokenKind.Float128Type: {
				state.cursor++
				expression = { kind: ExpressionKind.Float128Type, ...location }
			} break

			case TokenKind.UnsignedIntegerType: {
				state.cursor++

				expression = {
					kind: ExpressionKind.UnsignedIntegerType,
					bits: firstToken.data ? Number(firstToken.data) : undefined,
					...location
				}
			} break

			case TokenKind.SignedIntegerType: {
				state.cursor++

				expression = {
					kind: ExpressionKind.SignedIntegerType,
					bits: firstToken.data ? Number(firstToken.data) : undefined,
					...location
				}
			} break

			case TokenKind.Enum: {
				state.cursor++

				expression = {
					kind: ExpressionKind.Enum,
					name: expectToken(TokenKind.Identifier).data,
					members: [],
					...location
				}

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
						errorUnexpectedToken(newline, [ TokenKind.Newline ])

					if (newline.data.length < indentLevel)
						break

					if (newline.data.length != indentLevel)
						errorWrongIndentLevel(newline, indentLevel, tokens[state.cursor + 1])

					state.cursor++
				}

				indentLevel--
			} break

			case TokenKind.Function: {
				state.cursor++

				const name = expectToken(TokenKind.Identifier).data

				const parameter = nextTokenIs(TokenKind.OpenSquiglyBracket) ?
					parseObject(expectToken(TokenKind.OpenSquiglyBracket)) :
					parseIdentifier(expectToken(TokenKind.Identifier))

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
					parameter,
					parameterType,
					returnType,
					body: [ ...parseExpressions(tokens, indentLevel, state, fileName) ],
					...location
				}

				indentLevel--
			} break

			case TokenKind.OpenSquiglyBracket: {
				state.cursor++
				expression = parseObject(firstToken)
			} break

			case TokenKind.ErrorKeyword: {
				state.cursor++

				if (nextTokenIs(TokenKind.Identifier)) {
					expression = {
						kind: ExpressionKind.ErrorEnum,
						name: expectToken(TokenKind.Identifier).data,
						members: [],
						...location
					}

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
							errorUnexpectedToken(newline, [ TokenKind.Newline ])

						if (newline.data.length < indentLevel)
							break

						if (newline.data.length != indentLevel)
							errorWrongIndentLevel(newline, indentLevel, tokens[state.cursor + 1])

						state.cursor++
					}

					indentLevel--
				} else {
					expectToken(TokenKind.Dot)

					return {
						kind: ExpressionKind.GlobalError,
						name: expectToken(TokenKind.Identifier).data,
						...location
					}
				}
			} break

			case TokenKind.Loop: {
				state.cursor++
				indentLevel++
				expectNewline()

				expression = {
					kind: ExpressionKind.Loop,
					body: [ ...parseExpressions(tokens, indentLevel, state, fileName) ],
					...location
				}

				indentLevel--
			} break

			case TokenKind.Minus: {
				state.cursor++

				if (nextTokenIs(TokenKind.Number)) {
					const number = expectToken(TokenKind.Number)
					const type = tokens[state.cursor]

					if (number.data.includes(`.`)) {
						switch (type?.kind) {
							case TokenKind.Float16Type: {
								state.cursor++

								expression = {
									kind: ExpressionKind.Float16Literal,
									value: -Number(number.data),
									...location
								}
							} break

							case TokenKind.Float32Type: {
								state.cursor++

								expression = {
									kind: ExpressionKind.Float32Literal,
									value: -Number(number.data),
									...location
								}
							} break

							case TokenKind.Float64Type: {
								state.cursor++

								expression = {
									kind: ExpressionKind.Float64Literal,
									value: -Number(number.data),
									...location
								}
							} break

							case TokenKind.Float128Type: {
								state.cursor++

								expression = {
									kind: ExpressionKind.Float128Literal,
									value: -Number(number.data),
									...location
								}
							} break

							// TODO handle and complain about incompatble types like `i32` here

							default: {
								expression = {
									// TODO this should probably be the native bit one e.g. 32 bit on 32 bit systems
									// instead of giving parse() the bit size, a place holder ExpressionKind should be set
									kind: ExpressionKind.Float64Literal,
									value: -Number(number.data),
									...location
								}
							}
						}
					} else {
						// TODO complain when integer is too large for bits

						switch (type?.kind) {
							case TokenKind.UnsignedIntegerType:
								error(`u${type.data} does not support negative integers`, fileName, type)

							case TokenKind.SignedIntegerType: {
								state.cursor++

								expression = {
									kind: ExpressionKind.SignedIntegerLiteral,
									value: -BigInt(number.data),
									bits: Number(type.data),
									...location
								}
							} break

							case TokenKind.Float16Type: {
								state.cursor++

								expression = {
									kind: ExpressionKind.Float16Literal,
									value: -Number(number.data),
									...location
								}
							} break

							case TokenKind.Float32Type: {
								state.cursor++

								expression = {
									kind: ExpressionKind.Float32Literal,
									value: -Number(number.data),
									...location
								}
							} break

							case TokenKind.Float64Type: {
								state.cursor++

								expression = {
									kind: ExpressionKind.Float64Literal,
									value: -Number(number.data),
									...location
								}
							} break

							case TokenKind.Float128Type: {
								state.cursor++

								expression = {
									kind: ExpressionKind.Float128Literal,
									value: -Number(number.data),
									...location
								}
							} break

							default: {
								const value = -BigInt(number.data)

								expression = {
									kind: ExpressionKind.SignedIntegerLiteral,
									value,
									bits: getIntegerLength(value) + 1,
									...location
								}
							}
						}
					}
				} else {
					expression = {
						kind: ExpressionKind.MinusPrefix,
						expression: parseExpression(noParseAssign),
						...location
					}
				}
			} break

			case TokenKind.Declare: {
				state.cursor++
				expectToken(TokenKind.Import)

				expression = {
					kind: ExpressionKind.DeclaredImport,
					module: expectToken(TokenKind.String).data,
					members: [],
					...location
				}

				expectToken(TokenKind.OpenSquiglyBracket)
				indentLevel++

				while (true) {
					const name = expectToken(TokenKind.Identifier).data
					const as = maybeEatOneOf(TokenKind.As) ? expectToken(TokenKind.Identifier).data : undefined

					expectToken(TokenKind.Colon)
					expression.members.push({ name, as: as ?? name, type: parseExpression(true) })

					if (maybeEatOneOf(TokenKind.CloseSquiglyBracket))
						break

					eatOneOf(TokenKind.Newline, TokenKind.Comma)
				}
			} break

			default:
				return
		}

		while (state.cursor < tokens.length) {
			if (nextTokenIs(TokenKind.Newline))
				return expression

			const kind = BinaryOperatorTokensToExpressionKinds[tokens[state.cursor]!.kind]

			if (!kind) {
				const argument = maybeParseExpression(noParseAssign)

				if (argument)
					return { kind: ExpressionKind.Call, called: expression, argument, ...location }

				return expression
			}

			state.cursor++
			expression = { kind, left: expression, right: parseExpression(noParseAssign), ...location }
		}

		return expression

		function parseObject(firstToken: NonDataToken) {
			const object: Expression.Object = {
				kind: ExpressionKind.Object,
				entries: [],
				index: firstToken.index,
				line: firstToken.line,
				column: firstToken.column
			}

			if (nextTokenIs(TokenKind.CloseSquiglyBracket)) {
				state.cursor++

				return object
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

				object.entries.push({ name, type, value })

				if (nextTokenIs(TokenKind.CloseSquiglyBracket)) {
					state.cursor++

					break
				}

				expectToken(TokenKind.Comma)
			}

			return object
		}
	}

	function expectNewline() {
		const newline = expectToken(TokenKind.Newline)

		if (newline.data.length != indentLevel)
			errorWrongIndentLevel(newline, indentLevel, tokens[state.cursor])
	}

	function nextTokenIs(...kinds: TokenKind[]): boolean {
		if (tokens.length - state.cursor < kinds.length)
			return false

		for (const [ index, kind ] of kinds.entries()) {
			const token = tokens[state.cursor + index]!

			if (token.kind != kind)
				return false

			if (token.kind == TokenKind.Newline && token.data.length != indentLevel)
				errorWrongIndentLevel(token, indentLevel, tokens[state.cursor])
		}

		return true
	}

	function expectToken<K extends TokenKind>(expectedKind: K): K extends DataTokenKind ? DataToken : NonDataToken {
		const token = tokens[state.cursor]

		if (token?.kind != expectedKind)
			errorUnexpectedToken(token, [ expectedKind ])

		state.cursor++

		return token as any
	}

	function maybeEatOneOf(...kinds: TokenKind[]): boolean {
		for (const kind of kinds) {
			if (nextTokenIs(kind)) {
				state.cursor++

				return true
			}
		}

		return false
	}

	function eatOneOf(...kinds: TokenKind[]): void {
		if (!maybeEatOneOf(...kinds))
			errorUnexpectedToken(tokens[state.cursor], kinds)
	}
}

export function getExpectedTokenKindNames(expectedKinds: TokenKind[]) {
	return expectedKinds.map(expectedType => TokenKind[expectedType]).join(`, `)
}

export function parseIdentifier(identifier: DataToken): Expression.Identifier {
	return {
		kind: ExpressionKind.Identifier,
		name: identifier.data,
		index: identifier.index,
		line: identifier.line,
		column: identifier.column
	}
}

export type Expression = Expression.BinaryOperation | Expression.Assignment | Expression.Rement |
	Expression.KeywordPrimitive | Expression.Array | Expression.BitwiseNot | Expression.Call |
	Expression.DeclaredImport | Expression.Destructure | Expression.Do | Expression.Enum | Expression.ErrorEnum |
	Expression.Float16Literal | Expression.Float32Literal | Expression.Float64Literal | Expression.Float128Literal |
	Expression.Function | Expression.FunctionType | Expression.GetMember | Expression.GlobalError |
	Expression.Identifier | Expression.If | Expression.Import | Expression.Let | Expression.LogicalNot |
	Expression.Loop | Expression.MinusPrefix | Expression.Object | Expression.Return |
	Expression.SignedIntegerLiteral | Expression.SignedIntegerType | Expression.String |
	Expression.UnsignedIntegerLiteral | Expression.UnsignedIntegerType | Expression.Void | Expression.While

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Expression {
	export type BinaryOperation = Location & {
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

	export type Assignment = Location & {
		kind: ExpressionKind.BitwiseAndAssign | ExpressionKind.BitwiseOrAssign | ExpressionKind.ConcatenateAssign |
			ExpressionKind.LogicalAndAssign | ExpressionKind.LogicalOrAssign | ExpressionKind.NormalAssign |
			ExpressionKind.NullishCoalesceAssign | ExpressionKind.ShiftLeftAssign |
			ExpressionKind.ShiftRightAssign | ExpressionKind.WrappingShiftLeftAssign | ExpressionKind.XorAssign
		binding: Identifier | GetMember | Destructure
		value: Expression
	}

	export type Rement = Location & {
		kind: ExpressionKind.Increment | ExpressionKind.Decrement | ExpressionKind.WrappingIncrement |
			ExpressionKind.WrappingDecrement
		binding: Identifier | GetMember
	}

	export type KeywordPrimitive = Location & {
		kind: ExpressionKind.Any | ExpressionKind.Boolean | ExpressionKind.False | ExpressionKind.Float128Type |
			ExpressionKind.Float16Type | ExpressionKind.Float32Type | ExpressionKind.Float64Type | ExpressionKind.Null |
			ExpressionKind.ObjectType | ExpressionKind.True
	}

	export type DeclaredImport = Location & {
		kind: ExpressionKind.DeclaredImport
		module: string
		members: { name: string, as: string, type: Expression }[]
	}

	export type Destructure = Location & {
		kind: ExpressionKind.Destructure
		members: { name: string, as: Identifier | Destructure, defaultValue: Expression | undefined }[]
	}

	export type Enum = Location &
		{ kind: ExpressionKind.Enum, name: string, members: { name: string, type: Expression | undefined }[] }

	export type ErrorEnum = Location &
		{ kind: ExpressionKind.ErrorEnum, name: string, members: { name: string, type: Expression | undefined }[] }

	export type Function = Location & {
		kind: ExpressionKind.Function
		name: string
		// eslint-disable-next-line @typescript-eslint/ban-types
		parameter: Identifier | Object
		parameterType: Expression | undefined
		returnType: Expression | undefined
		body: Expression[]
	}

	export type FunctionType = Location &
		{ kind: ExpressionKind.FunctionType, argumentType: Expression, returnType: Expression }

	export type If = Location & {
		kind: ExpressionKind.If
		condition: Expression
		truthyBranch: Expression
		falseyBranch: Expression | undefined
	}

	export type Import = Location &
		{ kind: ExpressionKind.Import, path: string, as: string | ImportDestructureMember[] | undefined }

	export type Let = Location & {
		kind: ExpressionKind.Let
		binding: Identifier | Destructure
		type: Expression | undefined
		initialValue: Expression | undefined
	}

	export type Object = Location & {
		kind: ExpressionKind.Object
		entries: { name: string, type: Expression | undefined, value: Expression | undefined }[]
	}

	export type SignedIntegerLiteral = Location &
		{ kind: ExpressionKind.SignedIntegerLiteral, value: bigint, bits: number }

	export type SignedIntegerType = Location &
		{ kind: ExpressionKind.SignedIntegerType, bits: number | undefined }

	export type UnsignedIntegerLiteral = Location &
		{ kind: ExpressionKind.UnsignedIntegerLiteral, value: bigint, bits: number }

	export type UnsignedIntegerType = Location &
		{ kind: ExpressionKind.UnsignedIntegerType, bits: number | undefined }

	export type Array = Location & { kind: ExpressionKind.Array, expressions: Expression[] }
	export type BitwiseNot = Location & { kind: ExpressionKind.BitwiseNot, expression: Expression }
	export type Call = Location & { kind: ExpressionKind.Call, called: Expression, argument: Expression }
	export type Do = Location & { kind: ExpressionKind.Do, body: Expression[] }
	export type Float16Literal = Location & { kind: ExpressionKind.Float16Literal, value: number }
	export type Float32Literal = Location & { kind: ExpressionKind.Float32Literal, value: number }
	export type Float64Literal = Location & { kind: ExpressionKind.Float64Literal, value: number }
	export type Float128Literal = Location & { kind: ExpressionKind.Float128Literal, value: number }
	export type GetMember = Location & { kind: ExpressionKind.GetMember, expression: Expression, name: string }
	export type GlobalError = Location & { kind: ExpressionKind.GlobalError, name: string }
	export type Identifier = Location & { kind: ExpressionKind.Identifier, name: string }
	export type LogicalNot = Location & { kind: ExpressionKind.LogicalNot, expression: Expression }
	export type Loop = Location & { kind: ExpressionKind.Loop, body: Expression[] }
	export type MinusPrefix = Location & { kind: ExpressionKind.MinusPrefix, expression: Expression }
	export type Return = Location & { kind: ExpressionKind.Return, expression: Expression | undefined }
	export type String = Location & { kind: ExpressionKind.String, value: string }
	export type Void = Location & { kind: ExpressionKind.Void, expression: Expression }
	export type While = Location & { kind: ExpressionKind.While, condition: Expression, body: Expression[] }
}

export type ImportDestructureMember = { name: string, as: string | ImportDestructureMember[] }
