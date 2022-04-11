import { assert } from "@samual/lib"
import { printToken, Token, TokenType } from "./tokenise"

// TODO complain when number literal too big or small for bits

const DEBUG = false

const MAX_I32 = 0x7F_FF_FF_FFn
const MIN_I32 = -0x80_00_00_00n

export enum NodeType {
	Identifier,
	Assignment,
	Call,
	Addition,
	VariableDeclaration,
	Subtraction,
	IfStatement,
	IfElse,
	Block,
	Function,
	Parameter,
	Return,
	Integer,
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
	Float16,
	Float32,
	Float64,
	Float128
}

export namespace Node {
	export type Identifier = { type: NodeType.Identifier, name: string }

	export type Assignment = {
		type: NodeType.Assignment
		binding: Identifier
		value: Expression
	}

	export type Call = {
		type: NodeType.Call
		name: string
		arguments: Expression[]
	}

	export type Addition = {
		type: NodeType.Addition
		left: Expression
		right: Expression
	}

	export type Subtraction = {
		type: NodeType.Subtraction
		left: Expression
		right: Expression
	}

	export type VariableDeclaration = {
		type: NodeType.VariableDeclaration
		binding: Identifier
		bindingType: Expression | undefined
		initialValue: Expression | undefined
	}

	export type IfElse = {
		type: NodeType.IfElse
		condition: Expression
		truthyBranch: Expression
		falseyBranch: Expression | undefined
	}

	export type Function = {
		type: NodeType.Function
		name: string
		parameters: Parameter[]
		returnType: Expression | undefined
		body: Expression[]

	}

	export type Parameter = {
		type: NodeType.Parameter
		name: string
		parameterType: Expression | undefined
	}

	export type Return = { type: NodeType.Return, expression: Expression | undefined }
	export type Integer = { type: NodeType.Integer, value: bigint, bits: number }
	export type Float16 = { type: NodeType.Float16, value: number }
	export type Float32 = { type: NodeType.Float32, value: number }
	export type Float64 = { type: NodeType.Float64, value: number }
	export type Float128 = { type: NodeType.Float128, value: number }

	export type ConstantDeclaration = {
		type: NodeType.ConstantDeclaration
		binding: Identifier
		bindingType: Expression | undefined
		value: Expression
	}

	export type Increment = { type: NodeType.Increment, binding: Identifier }
	export type SignedIntegerType = { type: NodeType.SignedIntegerType, bits: number }
	export type UnsignedIntegerType = { type: NodeType.UnsignedIntegerType, bits: number }
	export type Float16Type = { type: NodeType.Float16Type }
	export type Float32Type = { type: NodeType.Float32Type }
	export type Float64Type = { type: NodeType.Float64Type }
	export type Float128Type = { type: NodeType.Float128Type }
	export type Null = { type: NodeType.Null }
	export type Block = { type: NodeType.Block, body: Expression[] }
	export type To = { type: NodeType.To, left: Expression, right: Expression }
	export type As = { type: NodeType.As, left: Expression, right: Expression }
	export type Or = { type: NodeType.Or, left: Expression, right: Expression }

	export type Expression = Identifier
		| Call
		| Addition
		| Subtraction
		| IfElse
		| Integer
		| Float16
		| Float32
		| Float64
		| Float128
		| Assignment
		| VariableDeclaration
		// eslint-disable-next-line @typescript-eslint/ban-types
		| Function
		| Return
		| ConstantDeclaration
		| Increment
		| SignedIntegerType
		| UnsignedIntegerType
		| Float16Type
		| Float32Type
		| Float64Type
		| Float128Type
		| Null
		| Block
		| To
		| As
		| Or
}

export type Node = Node.Expression | Node.Parameter

export class ParseError extends Error {
	constructor(
		public readonly token: Token | undefined,
		public readonly expectedTypes?: TokenType[]
	) {
		if (expectedTypes) {
			assert(expectedTypes.length, `expectedTypes array must not be empty`)

			if (token)
				super(`unexpected token ${TokenType[token.type]} at :${token.line}:${token.column}, expected ${getExpectedTypeNames(expectedTypes)}`)
			else
				super(`unexpected end, expected ${getExpectedTypeNames(expectedTypes)}`)
		} else if (token)
			super(`unexpected token ${TokenType[token.type]} at :${token.line}:${token.column}`)
		else
			super(`unexpected end`)
	}

	static {
		Object.defineProperty(this.prototype, `name`, { value: this.name })
	}
}

export class WrongIndentLevelParseError extends ParseError {
	constructor(
		public override readonly token: Token,
		public readonly expected: number
	) {
		super(undefined, [ TokenType.Newline ])
		this.message = `wrong indent level, expected ${expected} but got ${token.data!.length} at :${token.line + 1}:${1}`
	}

	static {
		Object.defineProperty(this.prototype, `name`, { value: this.name })
	}
}

export function parse(tokens: Token[]) {
	return parseExpressions(tokens, 0, { i: 0 })
}

export default parse

export function* parseExpressions(tokens: Token[], indentLevel: number, state: { i: number }): Generator<Node.Expression, void> {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (DEBUG) {
		for (const token of tokens.slice(state.i))
			console.log(`DEBUG parseExpressions()`, printToken(token))

		console.log(`DEBUG parseExpressions() ---`)
	}

	while (true) {
		yield parseExpression()

		if (state.i >= tokens.length)
			return

		if (!nextTokenIs(TokenType.Newline))
			throw new ParseError(tokens[state.i], [ TokenType.Newline ])

		const newline = tokens[state.i]!

		if (newline.data!.length < indentLevel)
			return

		if (newline.data!.length != indentLevel)
			throw new WrongIndentLevelParseError(newline, indentLevel)

		state.i++

		if (state.i >= tokens.length)
			return
	}

	function parseExpression(): Node.Expression {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (DEBUG) {
			for (const token of tokens.slice(state.i))
				console.log(`DEBUG parseExpression()`, printToken(token))

			console.log(`DEBUG parseExpression() ---`)
		}

		let expression = parseElement()

		while (true) {
			if (nextTokenIs(TokenType.Add)) {
				state.i++

				expression = {
					type: NodeType.Addition,
					left: expression,
					right: parseElement()
				}
			} else if (nextTokenIs(TokenType.Minus)) {
				state.i++

				expression = {
					type: NodeType.Subtraction,
					left: expression,
					right: parseElement()
				}
			} else if (nextTokenIs(TokenType.To)) {
				state.i++

				expression = {
					type: NodeType.To,
					left: expression,
					right: parseElement()
				}
			} else if (nextTokenIs(TokenType.As)) {
				state.i++

				expression = {
					type: NodeType.As,
					left: expression,
					right: parseElement()
				}
			} else if (nextTokenIs(TokenType.Or)) {
				state.i++

				expression = {
					type: NodeType.Or,
					left: expression,
					right: parseElement()
				}
			} else
				break
		}

		return expression
	}

	function parseElement(): Node.Expression {
		if (nextTokenIs(TokenType.Return)) {
			state.i++

			if (nextTokenIs(TokenType.Newline))
				return { type: NodeType.Return, expression: undefined }

			return { type: NodeType.Return, expression: parseExpression() }
		}

		if (nextTokenIs(TokenType.Function)) {
			const name = tokens[state.i]!.data!
			const parameters: Node.Parameter[] = []

			state.i++

			if (!nextTokenIs(TokenType.CloseBracket)) {
				while (true) {
					const identifier = expectToken(TokenType.Identifier)

					expectToken(TokenType.Colon)

					parameters.push({
						type: NodeType.Parameter,
						name: identifier.data!,
						parameterType: parseExpression()
					})

					if (nextTokenIs(TokenType.CloseBracket))
						break

					expectToken(TokenType.Comma)
				}
			}

			state.i++

			let returnType

			if (nextTokenIs(TokenType.Colon)) {
				state.i++
				returnType = parseExpression()
			} else if (!nextTokenIs(TokenType.Newline))
				returnType = parseExpression()

			expectNewline()

			return {
				type: NodeType.Function,
				name,
				parameters,
				returnType,
				body: [ ...parseExpressions(tokens, indentLevel + 1, state) ]
			}
		}

		if (nextTokenIs(TokenType.Let)) {
			state.i++

			const binding: Node.Identifier = {
				type: NodeType.Identifier,
				name: expectToken(TokenType.Identifier).data!
			}

			let bindingType

			if (nextTokenIs(TokenType.Colon)) {
				state.i++
				bindingType = parseExpression()
			}

			let initialValue

			if (nextTokenIs(TokenType.Assign)) {
				state.i++
				initialValue = parseExpression()
			}

			return {
				type: NodeType.VariableDeclaration,
				binding,
				bindingType,
				initialValue
			}
		}

		if (nextTokenIs(TokenType.Const)) {
			state.i++

			const binding: Node.Identifier = {
				type: NodeType.Identifier,
				name: expectToken(TokenType.Identifier).data!
			}

			let bindingType

			if (nextTokenIs(TokenType.Colon)) {
				state.i++
				bindingType = parseExpression()
			}

			expectToken(TokenType.Assign)

			return {
				type: NodeType.ConstantDeclaration,
				binding,
				bindingType,
				value: parseExpression()
			}
		}

		if (nextTokenIs(TokenType.Identifier)) {
			const name = tokens[state.i]!.data!

			state.i++

			if (nextTokenIs(TokenType.Assign)) {
				state.i++

				return {
					type: NodeType.Assignment,
					binding: { type: NodeType.Identifier, name },
					value: parseExpression()
				}
			}

			if (nextTokenIs(TokenType.Increment)) {
				state.i++

				return {
					type: NodeType.Increment,
					binding: { type: NodeType.Identifier, name }
				}
			}

			return { type: NodeType.Identifier, name }
		}

		if (nextTokenIs(TokenType.Number)) {
			const numberString = tokens[state.i]!.data!

			state.i++

			if (numberString.includes(`.`)) {
				if (nextTokenIs(TokenType.Float16Type)) {
					state.i++

					return {
						type: NodeType.Float16,
						value: Number(numberString)
					}
				}

				if (nextTokenIs(TokenType.Float32Type)) {
					state.i++

					return {
						type: NodeType.Float32,
						value: Number(numberString)
					}
				}

				if (nextTokenIs(TokenType.Float64Type)) {
					state.i++

					return {
						type: NodeType.Float64,
						value: Number(numberString)
					}
				}

				if (nextTokenIs(TokenType.Float128Type)) {
					state.i++

					return {
						type: NodeType.Float128,
						value: Number(numberString)
					}
				}

				return {
					type: NodeType.Float64,
					value: Number(numberString)
				}
			}

			if (nextTokenIs(TokenType.SignedIntegerType)) {
				const bits = Number(tokens[state.i]!.data)

				state.i++

				return {
					type: NodeType.Integer,
					value: BigInt(numberString),
					bits
				}
			}

			if (nextTokenIs(TokenType.Float16Type)) {
				state.i++

				return {
					type: NodeType.Float16,
					value: Number(numberString)
				}
			}

			if (nextTokenIs(TokenType.Float32Type)) {
				state.i++

				return {
					type: NodeType.Float32,
					value: Number(numberString)
				}
			}

			if (nextTokenIs(TokenType.Float64Type)) {
				state.i++

				return {
					type: NodeType.Float64,
					value: Number(numberString)
				}
			}

			if (nextTokenIs(TokenType.Float128Type)) {
				state.i++

				return {
					type: NodeType.Float128,
					value: Number(numberString)
				}
			}

			const value = BigInt(numberString)

			return {
				type: NodeType.Integer,
				value,
				bits: value > MAX_I32 || value < MIN_I32 ? 64 : 32
			}
		}

		if (nextTokenIs(TokenType.Call)) {
			const name = tokens[state.i]!.data!
			const arguments_ = []

			state.i++

			if (!nextTokenIs(TokenType.CloseBracket)) {
				while (true) {
					arguments_.push(parseExpression())

					if (nextTokenIs(TokenType.CloseBracket))
						break

					expectToken(TokenType.Comma)
				}
			}

			state.i++

			return { type: NodeType.Call, name, arguments: [] }
		}

		if (nextTokenIs(TokenType.OpenBracket)) {
			state.i++

			let element: Node.Expression

			if (nextTokenIs(TokenType.Newline)) {
				expectNewline()
				element = { type: NodeType.Block, body: [ ...parseExpressions(tokens, indentLevel + 1, state) ] }
				expectNewline(indentLevel)
			} else
				element = parseExpression()

			expectToken(TokenType.CloseBracket)

			return element
		}

		if (nextTokenIs(TokenType.If)) {
			state.i++

			let condition: Node.Expression
			let truthyBranch: Node.Expression

			if (nextTokenIs(TokenType.OpenBracket)) {
				state.i++
				condition = parseExpression()

				if (nextTokenIs(TokenType.Newline)) {
					const newline = tokens[state.i]!

					if (newline.data!.length != indentLevel)
						throw new WrongIndentLevelParseError(newline, indentLevel)

					state.i++
				}

				expectToken(TokenType.CloseBracket)

				if (nextTokenIs(TokenType.Newline)) {
					expectNewline()
					truthyBranch = { type: NodeType.Block, body: [ ...parseExpressions(tokens, indentLevel + 1, state) ] }
				} else
					truthyBranch = parseExpression()
			} else {
				condition = parseExpression()

				if (nextTokenIs(TokenType.OpenBracket))
					truthyBranch = parseExpression()
				else {
					expectNewline()
					truthyBranch = { type: NodeType.Block, body: [ ...parseExpressions(tokens, indentLevel + 1, state) ] }
				}
			}

			if (nextTokenIs(TokenType.Newline, TokenType.Else)) {
				const newline = tokens[state.i]!

				if (newline.data!.length != indentLevel)
					throw new WrongIndentLevelParseError(newline, indentLevel)

				state.i++
			}

			let falseyBranch: Node.Expression | undefined

			if (nextTokenIs(TokenType.Else)) {
				state.i++

				if (nextTokenIs(TokenType.Newline)) {
					expectNewline()
					falseyBranch = { type: NodeType.Block, body: [ ...parseExpressions(tokens, indentLevel + 1, state) ] }
				} else
					falseyBranch = parseExpression()
			}

			return {
				type: NodeType.IfElse,
				condition,
				truthyBranch,
				falseyBranch
			}
		}

		if (nextTokenIs(TokenType.Minus)) {
			state.i++

			const childExpression = parseExpression()

			if (childExpression.type == NodeType.Integer)
				return { type: NodeType.Integer, value: -childExpression.value, bits: childExpression.bits }

			throw new Error(`${HERE} unhandled node type ${NodeType[childExpression.type]}`)
		}

		if (nextTokenIs(TokenType.Float16Type))
			return { type: NodeType.Float16Type }

		if (nextTokenIs(TokenType.Float32Type))
			return { type: NodeType.Float32Type }

		if (nextTokenIs(TokenType.Float64Type))
			return { type: NodeType.Float64Type }

		if (nextTokenIs(TokenType.Float128Type))
			return { type: NodeType.Float128Type }

		if (nextTokenIs(TokenType.UnsignedIntegerType)) {
			const bits = Number(tokens[state.i]!.data!)

			state.i++

			return { type: NodeType.UnsignedIntegerType, bits }
		}

		if (nextTokenIs(TokenType.SignedIntegerType)) {
			const bits = Number(tokens[state.i]!.data!)

			state.i++

			return { type: NodeType.SignedIntegerType, bits }
		}

		throw new ParseError(tokens[state.i])
	}

	function expectNewline(expectedIndentLevel = indentLevel + 1) {
		const newline = expectToken(TokenType.Newline)

		if (newline.data!.length != expectedIndentLevel)
			throw new WrongIndentLevelParseError(newline, expectedIndentLevel)
	}

	function expectToken(expectedType: TokenType) {
		if (tokens[state.i]?.type != expectedType)
			throw new ParseError(tokens[state.i], [ expectedType ])

		const token = tokens[state.i]!

		state.i++

		return token
	}

	function nextTokenIs(...types: TokenType[]): boolean {
		if (tokens.length - state.i < types.length)
			return false

		for (const [ typeIndex, type ] of types.entries()) {
			if (tokens[state.i + typeIndex]!.type != type)
				return false
		}

		return true
	}
}

function getExpectedTypeNames(expectedTypes: TokenType[]) {
	return expectedTypes.map(expectedType => TokenType[expectedType]).join(`, `)
}
