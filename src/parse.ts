import { assert } from "@samual/lib"
import { getIntegerLength } from "./shared"
import { printToken, Token, TokenKind } from "./tokenise"

// TODO complain when number literal too big or small for bits

const DEBUG = false

export enum NodeKind {
	Identifier,
	Assignment,
	Call,
	Add,
	VariableDeclaration,
	Minus,
	IfStatement,
	IfElse,
	Block,
	Function,
	Parameter,
	Return,
	SignedIntegerLiteral,
	UnsignedIntegerLiteral,
	ConstantDeclaration,
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
	ObjectEntry,
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
	DeclaredFunction,
	WrappingTimes
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Node {
	export type Identifier = { kind: NodeKind.Identifier, name: string }
	export type Assignment = { kind: NodeKind.Assignment, binding: Identifier, value: Expression }
	export type Call = { kind: NodeKind.Call, name: string, arguments: Expression[] }
	export type Add = { kind: NodeKind.Add, left: Expression, right: Expression }
	export type Times = { kind: NodeKind.Times, left: Expression, right: Expression }
	export type WrappingTimes = { kind: NodeKind.WrappingTimes, left: Expression, right: Expression }
	export type Minus = { kind: NodeKind.Minus, left: Expression, right: Expression }
	export type Divide = { kind: NodeKind.Divide, left: Expression, right: Expression }

	export type VariableDeclaration = {
		kind: NodeKind.VariableDeclaration
		binding: Identifier
		type: Expression | undefined
		initialValue: Expression | undefined
	}

	export type IfElse = {
		kind: NodeKind.IfElse
		condition: Expression
		truthyBranch: Expression
		falseyBranch: Expression | undefined
	}

	export type Function = {
		kind: NodeKind.Function
		name: string
		parameters: Parameter[]
		returnType: Expression | undefined
		body: Expression[]
	}

	export type Parameter = { kind: NodeKind.Parameter, binding: Identifier, type: Expression | undefined }
	export type Return = { kind: NodeKind.Return, expression: Expression | undefined }
	export type SignedIntegerLiteral = { kind: NodeKind.SignedIntegerLiteral, value: bigint, bits: number }
	export type UnsignedIntegerLiteral = { kind: NodeKind.UnsignedIntegerLiteral, value: bigint, bits: number }
	export type Float16Literal = { kind: NodeKind.Float16Literal, value: number }
	export type Float32Literal = { kind: NodeKind.Float32Literal, value: number }
	export type Float64Literal = { kind: NodeKind.Float64Literal, value: number }
	export type Float128Literal = { kind: NodeKind.Float128Literal, value: number }

	export type ConstantDeclaration = {
		kind: NodeKind.ConstantDeclaration
		binding: Identifier
		type: Expression | undefined
		value: Expression
	}

	export type Increment = { kind: NodeKind.Increment, binding: Identifier }
	export type Decrement = { kind: NodeKind.Decrement, binding: Identifier }
	export type SignedIntegerType = { kind: NodeKind.SignedIntegerType, bits: number }
	export type UnsignedIntegerType = { kind: NodeKind.UnsignedIntegerType, bits: number }
	export type Float16Type = { kind: NodeKind.Float16Type }
	export type Float32Type = { kind: NodeKind.Float32Type }
	export type Float64Type = { kind: NodeKind.Float64Type }
	export type Float128Type = { kind: NodeKind.Float128Type }
	export type Null = { kind: NodeKind.Null }
	export type Block = { kind: NodeKind.Block, body: Expression[] }
	export type To = { kind: NodeKind.To, left: Expression, right: Expression }
	export type As = { kind: NodeKind.As, left: Expression, right: Expression }
	export type Or = { kind: NodeKind.Or, left: Expression, right: Expression }
	export type Void = { kind: NodeKind.Void, expression: Expression }
	export type True = { kind: NodeKind.True }
	export type False = { kind: NodeKind.False }
	export type Boolean = { kind: NodeKind.Boolean }
	export type ObjectType = { kind: NodeKind.ObjectType, entries: ObjectEntry[] }
	export type ObjectEntry = { kind: NodeKind.ObjectEntry, name: string, type: Expression }
	export type FunctionType = { kind: NodeKind.FunctionType, parameters: Expression[], returnType: Expression }
	export type Any = { kind: NodeKind.Any }
	export type MinusPrefix = { kind: NodeKind.MinusPrefix, expression: Expression }
	export type While = { kind: NodeKind.While, condition: Expression, body: Expression }
	export type WrappingAdd = { kind: NodeKind.WrappingAdd, left: Expression, right: Expression }
	export type Equal = { kind: NodeKind.Equal, left: Expression, right: Expression }
	export type NotEqual = { kind: NodeKind.NotEqual, left: Expression, right: Expression }

	export type FunctionDeclaration = {
		kind: NodeKind.DeclaredFunction
		name: string
		parameters: Parameter[]
		returnType: Expression | undefined
	}

	export type Literal = Null | True | False | UnsignedIntegerLiteral | SignedIntegerLiteral | Float16Literal
		| Float32Literal | Float64Literal | Float128Literal

	export type Expression = Literal | Identifier | Call | Add | Minus | IfElse | Assignment
		// eslint-disable-next-line @typescript-eslint/ban-types
		| VariableDeclaration | Function | Return | ConstantDeclaration | Increment | SignedIntegerType
		| UnsignedIntegerType | Float16Type | Float32Type | Float64Type | Float128Type | Null | Block | To | As | Or
		// eslint-disable-next-line @typescript-eslint/ban-types
		| Void | Boolean | ObjectType | FunctionType | Any | Times | MinusPrefix | Divide | While | WrappingAdd
		| Decrement | Equal | NotEqual | FunctionDeclaration | WrappingTimes
}

export type Node = Node.Expression | Node.Parameter

export class ParseError extends Error {
	constructor(
		public readonly token: Token | undefined,
		public readonly expectedTypes?: TokenKind[]
	) {
		if (expectedTypes) {
			assert(expectedTypes.length, `expectedTypes array must not be empty`)

			if (token)
				super(`unexpected token ${TokenKind[token.kind]} at :${token.line}:${token.column}, expected ${getExpectedTypeNames(expectedTypes)}`)
			else
				super(`unexpected end, expected ${getExpectedTypeNames(expectedTypes)}`)
		} else if (token)
			super(`unexpected token ${TokenKind[token.kind]} at :${token.line}:${token.column}`)
		else
			super(`unexpected end`)
	}

	static {
		Object.defineProperty(this.prototype, `name`, { value: this.name })
	}
}

const getExpectedTypeNames = (expectedTypes: TokenKind[]) =>
	expectedTypes.map(expectedType => TokenKind[expectedType]).join(`, `)

export class WrongIndentLevelParseError extends ParseError {
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

export const parseExpressions = function* (tokens: Token[], indentLevel: number, state: { cursor: number }): Generator<Node.Expression, void> {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (DEBUG) {
		for (const token of tokens.slice(state.cursor))
			console.log(`DEBUG parseExpressions()`, printToken(token))

		console.log(`DEBUG parseExpressions() ---`)
	}

	const parseExpression = (): Node.Expression => {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (DEBUG) {
			for (const token of tokens.slice(state.cursor))
				console.log(`DEBUG parseExpression()`, printToken(token))

			console.log(`DEBUG parseExpression() ---`)
		}

		let expression = parseElement()

		while (true) {
			if (nextTokenIs(TokenKind.Divide)) {
				state.cursor++

				expression = {
					kind: NodeKind.Divide,
					left: expression,
					right: parseElement()
				}
			} else if (nextTokenIs(TokenKind.Times)) {
				state.cursor++

				expression = {
					kind: NodeKind.Times,
					left: expression,
					right: parseElement()
				}
			} else if (nextTokenIs(TokenKind.WrappingTimes)) {
				state.cursor++

				expression = {
					kind: NodeKind.WrappingTimes,
					left: expression,
					right: parseElement()
				}
			} else if (nextTokenIs(TokenKind.Add)) {
				state.cursor++

				if (nextTokenIs(TokenKind.Modulo)) {
					state.cursor++

					expression = {
						kind: NodeKind.WrappingAdd,
						left: expression,
						right: parseElement()
					}
				} else {
					expression = {
						kind: NodeKind.Add,
						left: expression,
						right: parseElement()
					}
				}
			} else if (nextTokenIs(TokenKind.Minus)) {
				state.cursor++

				expression = {
					kind: NodeKind.Minus,
					left: expression,
					right: parseElement()
				}
			} else if (nextTokenIs(TokenKind.To)) {
				state.cursor++

				expression = {
					kind: NodeKind.To,
					left: expression,
					right: parseElement()
				}
			} else if (nextTokenIs(TokenKind.As)) {
				state.cursor++

				expression = {
					kind: NodeKind.As,
					left: expression,
					right: parseElement()
				}
			} else if (nextTokenIs(TokenKind.BitwiseOr)) {
				state.cursor++

				expression = {
					kind: NodeKind.Or,
					left: expression,
					right: parseElement()
				}
			} else
				break
		}

		return expression
	}

	const parseElement = (): Node.Expression => {
		if (nextTokenIs(TokenKind.While)) {
			state.cursor++

			let condition: Node.Expression
			let body: Node.Expression

			if (nextTokenIs(TokenKind.OpenBracket)) {
				condition = parseExpression()

				if (nextTokenIs(TokenKind.Newline)) {
					expectNewline()
					body = { kind: NodeKind.Block, body: [ ...parseExpressions(tokens, indentLevel + 1, state) ] }
				} else
					body = parseExpression()
			} else {
				condition = parseExpression()

				if (nextTokenIs(TokenKind.OpenBracket))
					body = parseExpression()
				else {
					expectNewline()
					body = { kind: NodeKind.Block, body: [ ...parseExpressions(tokens, indentLevel + 1, state) ] }
				}
			}

			return { kind: NodeKind.While, condition, body }
		}

		if (nextTokenIs(TokenKind.Float64Type)) {
			state.cursor++

			return { kind: NodeKind.Float64Type }
		}

		if (nextTokenIs(TokenKind.Null)) {
			state.cursor++

			return { kind: NodeKind.Null }
		}

		if (nextTokenIs(TokenKind.Void)) {
			state.cursor++

			return { kind: NodeKind.Void, expression: parseExpression() }
		}

		if (nextTokenIs(TokenKind.Return)) {
			state.cursor++

			if (nextTokenIs(TokenKind.Newline))
				return { kind: NodeKind.Return, expression: undefined }

			return { kind: NodeKind.Return, expression: parseExpression() }
		}

		if (nextTokenIs(TokenKind.Function)) {
			const name = tokens[state.cursor]!.data!
			const parameters: Node.Parameter[] = []

			state.cursor++

			if (!nextTokenIs(TokenKind.CloseBracket)) {
				while (true) {
					const identifier = expectToken(TokenKind.Identifier)

					expectToken(TokenKind.Colon)

					parameters.push({
						kind: NodeKind.Parameter,
						binding: { kind: NodeKind.Identifier, name: identifier.data! },
						type: parseExpression()
					})

					if (nextTokenIs(TokenKind.CloseBracket))
						break

					expectToken(TokenKind.Comma)
				}
			}

			state.cursor++

			let returnType

			if (nextTokenIs(TokenKind.Colon)) {
				state.cursor++
				returnType = parseExpression()
			} else if (!nextTokenIs(TokenKind.Newline))
				returnType = parseExpression()

			expectNewline()

			return {
				kind: NodeKind.Function,
				name,
				parameters,
				returnType,
				body: [ ...parseExpressions(tokens, indentLevel + 1, state) ]
			}
		}

		if (nextTokenIs(TokenKind.Let)) {
			state.cursor++

			const binding: Node.Identifier = {
				kind: NodeKind.Identifier,
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

			return {
				kind: NodeKind.VariableDeclaration,
				binding,
				type,
				initialValue
			}
		}

		if (nextTokenIs(TokenKind.Constant)) {
			state.cursor++

			const binding: Node.Identifier = {
				kind: NodeKind.Identifier,
				name: expectToken(TokenKind.Identifier).data!
			}

			let type

			if (nextTokenIs(TokenKind.Colon)) {
				state.cursor++
				type = parseExpression()
			}

			expectToken(TokenKind.Assign)

			return {
				kind: NodeKind.ConstantDeclaration,
				binding,
				type,
				value: parseExpression()
			}
		}

		if (nextTokenIs(TokenKind.Identifier)) {
			const name = tokens[state.cursor]!.data!

			state.cursor++

			if (nextTokenIs(TokenKind.Assign)) {
				state.cursor++

				return {
					kind: NodeKind.Assignment,
					binding: { kind: NodeKind.Identifier, name },
					value: parseExpression()
				}
			}

			if (nextTokenIs(TokenKind.Increment)) {
				state.cursor++

				return {
					kind: NodeKind.Increment,
					binding: { kind: NodeKind.Identifier, name }
				}
			}

			if (nextTokenIs(TokenKind.Decrement)) {
				state.cursor++

				return {
					kind: NodeKind.Decrement,
					binding: { kind: NodeKind.Identifier, name }
				}
			}

			return { kind: NodeKind.Identifier, name }
		}

		if (nextTokenIs(TokenKind.Number)) {
			const numberString = tokens[state.cursor]!.data!

			state.cursor++

			if (numberString.includes(`.`)) {
				if (nextTokenIs(TokenKind.Float16Type)) {
					state.cursor++

					return {
						kind: NodeKind.Float16Literal,
						value: Number(numberString)
					}
				}

				if (nextTokenIs(TokenKind.Float32Type)) {
					state.cursor++

					return {
						kind: NodeKind.Float32Literal,
						value: Number(numberString)
					}
				}

				if (nextTokenIs(TokenKind.Float64Type)) {
					state.cursor++

					return {
						kind: NodeKind.Float64Literal,
						value: Number(numberString)
					}
				}

				if (nextTokenIs(TokenKind.Float128Type)) {
					state.cursor++

					return {
						kind: NodeKind.Float128Literal,
						value: Number(numberString)
					}
				}

				return {
					kind: NodeKind.Float64Literal,
					value: Number(numberString)
				}
			}

			if (nextTokenIs(TokenKind.UnsignedIntegerType)) {
				const bits = Number(tokens[state.cursor]!.data)

				state.cursor++

				return {
					kind: NodeKind.UnsignedIntegerLiteral,
					value: BigInt(numberString),
					bits
				}
			}

			if (nextTokenIs(TokenKind.SignedIntegerType)) {
				const bits = Number(tokens[state.cursor]!.data)

				state.cursor++

				return {
					kind: NodeKind.SignedIntegerLiteral,
					value: BigInt(numberString),
					bits
				}
			}

			if (nextTokenIs(TokenKind.Float16Type)) {
				state.cursor++

				return {
					kind: NodeKind.Float16Literal,
					value: Number(numberString)
				}
			}

			if (nextTokenIs(TokenKind.Float32Type)) {
				state.cursor++

				return {
					kind: NodeKind.Float32Literal,
					value: Number(numberString)
				}
			}

			if (nextTokenIs(TokenKind.Float64Type)) {
				state.cursor++

				return {
					kind: NodeKind.Float64Literal,
					value: Number(numberString)
				}
			}

			if (nextTokenIs(TokenKind.Float128Type)) {
				state.cursor++

				return {
					kind: NodeKind.Float128Literal,
					value: Number(numberString)
				}
			}

			const value = BigInt(numberString)

			return {
				kind: NodeKind.UnsignedIntegerLiteral,
				value,
				bits: getIntegerLength(value)
			}
		}

		if (nextTokenIs(TokenKind.Call)) {
			const name = tokens[state.cursor]!.data!
			const arguments_ = []

			state.cursor++

			if (!nextTokenIs(TokenKind.CloseBracket)) {
				while (true) {
					arguments_.push(parseExpression())

					if (nextTokenIs(TokenKind.CloseBracket))
						break

					expectToken(TokenKind.Comma)
				}
			}

			state.cursor++

			return { kind: NodeKind.Call, name, arguments: arguments_ }
		}

		if (nextTokenIs(TokenKind.OpenBracket)) {
			state.cursor++

			let element: Node.Expression

			if (nextTokenIs(TokenKind.Newline)) {
				expectNewline()
				element = { kind: NodeKind.Block, body: [ ...parseExpressions(tokens, indentLevel + 1, state) ] }
				expectNewline(indentLevel)
			} else
				element = parseExpression()

			expectToken(TokenKind.CloseBracket)

			return element
		}

		if (nextTokenIs(TokenKind.If)) {
			state.cursor++

			let condition: Node.Expression
			let truthyBranch: Node.Expression

			if (nextTokenIs(TokenKind.OpenBracket)) {
				state.cursor++
				condition = parseExpression()

				if (nextTokenIs(TokenKind.Newline)) {
					const newline = tokens[state.cursor]!

					if (newline.data!.length != indentLevel)
						throw new WrongIndentLevelParseError(newline, indentLevel)

					state.cursor++
				}

				expectToken(TokenKind.CloseBracket)

				if (nextTokenIs(TokenKind.Newline)) {
					expectNewline()
					truthyBranch = { kind: NodeKind.Block, body: [ ...parseExpressions(tokens, indentLevel + 1, state) ] }
				} else
					truthyBranch = parseExpression()
			} else {
				condition = parseExpression()

				if (nextTokenIs(TokenKind.OpenBracket))
					truthyBranch = parseExpression()
				else {
					expectNewline()
					truthyBranch = { kind: NodeKind.Block, body: [ ...parseExpressions(tokens, indentLevel + 1, state) ] }
				}
			}

			if (nextTokenIs(TokenKind.Newline, TokenKind.Else)) {
				const newline = tokens[state.cursor]!

				if (newline.data!.length != indentLevel)
					throw new WrongIndentLevelParseError(newline, indentLevel)

				state.cursor++
			}

			let falseyBranch: Node.Expression | undefined

			if (nextTokenIs(TokenKind.Else)) {
				state.cursor++

				if (nextTokenIs(TokenKind.Newline)) {
					expectNewline()
					falseyBranch = { kind: NodeKind.Block, body: [ ...parseExpressions(tokens, indentLevel + 1, state) ] }
				} else
					falseyBranch = parseExpression()
			}

			return {
				kind: NodeKind.IfElse,
				condition,
				truthyBranch,
				falseyBranch
			}
		}

		if (nextTokenIs(TokenKind.Minus)) {
			state.cursor++

			const expression = parseElement()

			if (expression.kind == NodeKind.UnsignedIntegerLiteral)
				return { kind: NodeKind.SignedIntegerLiteral, value: -expression.value, bits: expression.bits + 1 }

			return { kind: NodeKind.MinusPrefix, expression }
		}

		if (nextTokenIs(TokenKind.Float16Type))
			return { kind: NodeKind.Float16Type }

		if (nextTokenIs(TokenKind.Float32Type))
			return { kind: NodeKind.Float32Type }

		if (nextTokenIs(TokenKind.Float64Type))
			return { kind: NodeKind.Float64Type }

		if (nextTokenIs(TokenKind.Float128Type))
			return { kind: NodeKind.Float128Type }

		if (nextTokenIs(TokenKind.UnsignedIntegerType)) {
			const bits = Number(tokens[state.cursor]!.data!)

			state.cursor++

			return { kind: NodeKind.UnsignedIntegerType, bits }
		}

		if (nextTokenIs(TokenKind.SignedIntegerType)) {
			const bits = Number(tokens[state.cursor]!.data!)

			state.cursor++

			return { kind: NodeKind.SignedIntegerType, bits }
		}

		if (nextTokenIs(TokenKind.DeclareFunction)) {
			const name = tokens[state.cursor]!.data!
			const parameters: Node.Parameter[] = []

			state.cursor++

			if (!nextTokenIs(TokenKind.CloseBracket)) {
				while (true) {
					const identifier = expectToken(TokenKind.Identifier)

					expectToken(TokenKind.Colon)

					parameters.push({
						kind: NodeKind.Parameter,
						binding: { kind: NodeKind.Identifier, name: identifier.data! },
						type: parseExpression()
					})

					if (nextTokenIs(TokenKind.CloseBracket))
						break

					expectToken(TokenKind.Comma)
				}
			}

			state.cursor++

			let returnType

			if (nextTokenIs(TokenKind.Colon)) {
				state.cursor++
				returnType = parseExpression()
			} else if (!nextTokenIs(TokenKind.Newline))
				returnType = parseExpression()

			return { kind: NodeKind.DeclaredFunction, name, parameters, returnType }
		}

		throw new ParseError(tokens[state.cursor])
	}

	const expectNewline = (expectedIndentLevel = indentLevel + 1) => {
		const newline = expectToken(TokenKind.Newline)

		if (newline.data!.length != expectedIndentLevel)
			throw new WrongIndentLevelParseError(newline, expectedIndentLevel)
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
			throw new WrongIndentLevelParseError(newline, indentLevel)

		state.cursor++

		if (state.cursor >= tokens.length)
			return
	}
}
