import { assert } from "@samual/lib"
import { getIntegerLength } from "./generateWASMModule/shared"
import { printToken, Token, TokenKind } from "./tokenise"

// TODO complain when number literal too big or small for bits

const DEBUG = false

const MAX_I32 = 0x7F_FF_FF_FFn
const MIN_I32 = -0x80_00_00_00n

export enum NodeKind {
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
	SignedInteger,
	UnsignedInteger,
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
	export type Identifier = { kind: NodeKind.Identifier, name: string }

	export type Assignment = {
		kind: NodeKind.Assignment
		binding: Identifier
		value: Expression
	}

	export type Call = {
		kind: NodeKind.Call
		name: string
		arguments: Expression[]
	}

	export type Addition = {
		kind: NodeKind.Addition
		left: Expression
		right: Expression
	}

	export type Subtraction = {
		kind: NodeKind.Subtraction
		left: Expression
		right: Expression
	}

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

	export type Parameter = {
		kind: NodeKind.Parameter
		name: string
		type: Expression | undefined
	}

	export type Return = { kind: NodeKind.Return, expression: Expression | undefined }
	export type SignedInteger = { kind: NodeKind.SignedInteger, value: bigint, bits: number }
	export type UnsignedInteger = { kind: NodeKind.UnsignedInteger, value: bigint, bits: number }
	export type Float16 = { kind: NodeKind.Float16, value: number }
	export type Float32 = { kind: NodeKind.Float32, value: number }
	export type Float64 = { kind: NodeKind.Float64, value: number }
	export type Float128 = { kind: NodeKind.Float128, value: number }

	export type ConstantDeclaration = {
		kind: NodeKind.ConstantDeclaration
		binding: Identifier
		type: Expression | undefined
		value: Expression
	}

	export type Increment = { kind: NodeKind.Increment, binding: Identifier }
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

	export type Expression = Identifier
		| Call
		| Addition
		| Subtraction
		| IfElse
		| SignedInteger
		| UnsignedInteger
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

		if (!nextTokenIs(TokenKind.Newline))
			throw new ParseError(tokens[state.i], [ TokenKind.Newline ])

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
			if (nextTokenIs(TokenKind.Add)) {
				state.i++

				expression = {
					kind: NodeKind.Addition,
					left: expression,
					right: parseElement()
				}
			} else if (nextTokenIs(TokenKind.Minus)) {
				state.i++

				expression = {
					kind: NodeKind.Subtraction,
					left: expression,
					right: parseElement()
				}
			} else if (nextTokenIs(TokenKind.To)) {
				state.i++

				expression = {
					kind: NodeKind.To,
					left: expression,
					right: parseElement()
				}
			} else if (nextTokenIs(TokenKind.As)) {
				state.i++

				expression = {
					kind: NodeKind.As,
					left: expression,
					right: parseElement()
				}
			} else if (nextTokenIs(TokenKind.Or)) {
				state.i++

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

	function parseElement(): Node.Expression {
		if (nextTokenIs(TokenKind.Return)) {
			state.i++

			if (nextTokenIs(TokenKind.Newline))
				return { kind: NodeKind.Return, expression: undefined }

			return { kind: NodeKind.Return, expression: parseExpression() }
		}

		if (nextTokenIs(TokenKind.Function)) {
			const name = tokens[state.i]!.data!
			const parameters: Node.Parameter[] = []

			state.i++

			if (!nextTokenIs(TokenKind.CloseBracket)) {
				while (true) {
					const identifier = expectToken(TokenKind.Identifier)

					expectToken(TokenKind.Colon)

					parameters.push({
						kind: NodeKind.Parameter,
						name: identifier.data!,
						type: parseExpression()
					})

					if (nextTokenIs(TokenKind.CloseBracket))
						break

					expectToken(TokenKind.Comma)
				}
			}

			state.i++

			let returnType

			if (nextTokenIs(TokenKind.Colon)) {
				state.i++
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
			state.i++

			const binding: Node.Identifier = {
				kind: NodeKind.Identifier,
				name: expectToken(TokenKind.Identifier).data!
			}

			let type

			if (nextTokenIs(TokenKind.Colon)) {
				state.i++
				type = parseExpression()
			}

			let initialValue

			if (nextTokenIs(TokenKind.Assign)) {
				state.i++
				initialValue = parseExpression()
			}

			return {
				kind: NodeKind.VariableDeclaration,
				binding,
				type,
				initialValue
			}
		}

		if (nextTokenIs(TokenKind.Const)) {
			state.i++

			const binding: Node.Identifier = {
				kind: NodeKind.Identifier,
				name: expectToken(TokenKind.Identifier).data!
			}

			let type

			if (nextTokenIs(TokenKind.Colon)) {
				state.i++
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
			const name = tokens[state.i]!.data!

			state.i++

			if (nextTokenIs(TokenKind.Assign)) {
				state.i++

				return {
					kind: NodeKind.Assignment,
					binding: { kind: NodeKind.Identifier, name },
					value: parseExpression()
				}
			}

			if (nextTokenIs(TokenKind.Increment)) {
				state.i++

				return {
					kind: NodeKind.Increment,
					binding: { kind: NodeKind.Identifier, name }
				}
			}

			return { kind: NodeKind.Identifier, name }
		}

		if (nextTokenIs(TokenKind.Number)) {
			const numberString = tokens[state.i]!.data!

			state.i++

			if (numberString.includes(`.`)) {
				if (nextTokenIs(TokenKind.Float16Type)) {
					state.i++

					return {
						kind: NodeKind.Float16,
						value: Number(numberString)
					}
				}

				if (nextTokenIs(TokenKind.Float32Type)) {
					state.i++

					return {
						kind: NodeKind.Float32,
						value: Number(numberString)
					}
				}

				if (nextTokenIs(TokenKind.Float64Type)) {
					state.i++

					return {
						kind: NodeKind.Float64,
						value: Number(numberString)
					}
				}

				if (nextTokenIs(TokenKind.Float128Type)) {
					state.i++

					return {
						kind: NodeKind.Float128,
						value: Number(numberString)
					}
				}

				return {
					kind: NodeKind.Float64,
					value: Number(numberString)
				}
			}

			if (nextTokenIs(TokenKind.UnsignedIntegerType)) {
				const bits = Number(tokens[state.i]!.data)

				state.i++

				return {
					kind: NodeKind.UnsignedInteger,
					value: BigInt(numberString),
					bits
				}
			}

			if (nextTokenIs(TokenKind.SignedIntegerType)) {
				const bits = Number(tokens[state.i]!.data)

				state.i++

				return {
					kind: NodeKind.SignedInteger,
					value: BigInt(numberString),
					bits
				}
			}

			if (nextTokenIs(TokenKind.Float16Type)) {
				state.i++

				return {
					kind: NodeKind.Float16,
					value: Number(numberString)
				}
			}

			if (nextTokenIs(TokenKind.Float32Type)) {
				state.i++

				return {
					kind: NodeKind.Float32,
					value: Number(numberString)
				}
			}

			if (nextTokenIs(TokenKind.Float64Type)) {
				state.i++

				return {
					kind: NodeKind.Float64,
					value: Number(numberString)
				}
			}

			if (nextTokenIs(TokenKind.Float128Type)) {
				state.i++

				return {
					kind: NodeKind.Float128,
					value: Number(numberString)
				}
			}

			const value = BigInt(numberString)

			return {
				kind: NodeKind.UnsignedInteger,
				value,
				bits: getIntegerLength(value)
			}
		}

		if (nextTokenIs(TokenKind.Call)) {
			const name = tokens[state.i]!.data!
			const arguments_ = []

			state.i++

			if (!nextTokenIs(TokenKind.CloseBracket)) {
				while (true) {
					arguments_.push(parseExpression())

					if (nextTokenIs(TokenKind.CloseBracket))
						break

					expectToken(TokenKind.Comma)
				}
			}

			state.i++

			return { kind: NodeKind.Call, name, arguments: [] }
		}

		if (nextTokenIs(TokenKind.OpenBracket)) {
			state.i++

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
			state.i++

			let condition: Node.Expression
			let truthyBranch: Node.Expression

			if (nextTokenIs(TokenKind.OpenBracket)) {
				state.i++
				condition = parseExpression()

				if (nextTokenIs(TokenKind.Newline)) {
					const newline = tokens[state.i]!

					if (newline.data!.length != indentLevel)
						throw new WrongIndentLevelParseError(newline, indentLevel)

					state.i++
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
				const newline = tokens[state.i]!

				if (newline.data!.length != indentLevel)
					throw new WrongIndentLevelParseError(newline, indentLevel)

				state.i++
			}

			let falseyBranch: Node.Expression | undefined

			if (nextTokenIs(TokenKind.Else)) {
				state.i++

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
			state.i++

			const childExpression = parseExpression()

			if (childExpression.kind == NodeKind.UnsignedInteger)
				return { kind: NodeKind.SignedInteger, value: -childExpression.value, bits: childExpression.bits + 1 }

			throw new Error(`${HERE} unhandled node type ${NodeKind[childExpression.kind]}`)
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
			const bits = Number(tokens[state.i]!.data!)

			state.i++

			return { kind: NodeKind.UnsignedIntegerType, bits }
		}

		if (nextTokenIs(TokenKind.SignedIntegerType)) {
			const bits = Number(tokens[state.i]!.data!)

			state.i++

			return { kind: NodeKind.SignedIntegerType, bits }
		}

		throw new ParseError(tokens[state.i])
	}

	function expectNewline(expectedIndentLevel = indentLevel + 1) {
		const newline = expectToken(TokenKind.Newline)

		if (newline.data!.length != expectedIndentLevel)
			throw new WrongIndentLevelParseError(newline, expectedIndentLevel)
	}

	function expectToken(expectedType: TokenKind) {
		if (tokens[state.i]?.kind != expectedType)
			throw new ParseError(tokens[state.i], [ expectedType ])

		const token = tokens[state.i]!

		state.i++

		return token
	}

	function nextTokenIs(...types: TokenKind[]): boolean {
		if (tokens.length - state.i < types.length)
			return false

		for (const [ typeIndex, type ] of types.entries()) {
			if (tokens[state.i + typeIndex]!.kind != type)
				return false
		}

		return true
	}
}

function getExpectedTypeNames(expectedTypes: TokenKind[]) {
	return expectedTypes.map(expectedType => TokenKind[expectedType]).join(`, `)
}
