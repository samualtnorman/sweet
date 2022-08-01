/* eslint-disable @typescript-eslint/array-type */
import { assert } from "@samual/lib"
import { ensure } from "@samual/lib/assert"
import { getIntegerLength } from "./shared"
import { printToken, Token, TokenKind } from "./tokenise"

// TODO complain when number literal too big or small for bits

const DEBUG = false

export enum NodeKind {
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

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Node {
	// eslint-disable-next-line @typescript-eslint/ban-types
	export type Expression = Function | Boolean | Object | String |
		Identifier | Call | If | Assignment | Let | Return | Increment | SignedIntegerType | UnsignedIntegerType |
		Float16Type | Float32Type | Float64Type | Float128Type | Null | Do | Void | FunctionType | Any | MinusPrefix |
		While | Decrement | DeclaredImport | Import | GetMember | Null | True | False | UnsignedIntegerLiteral |
		SignedIntegerLiteral | Float16Literal | Float32Literal | Float64Literal | Float128Literal | Array |
		BinaryOperation | Enum

	export type BinaryOperation = {
		kind: NodeKind.Add | NodeKind.Minus | NodeKind.Divide | NodeKind.Times | NodeKind.Modulo | NodeKind.Power |
			NodeKind.WrappingAdd | NodeKind.WrappingMinus | NodeKind.WrappingDivide | NodeKind.WrappingTimes |
			NodeKind.WrappingPower | NodeKind.Is | NodeKind.SmallerThan | NodeKind.BiggerThan |
			NodeKind.SmallerThanEquals | NodeKind.BiggerThanEquals | NodeKind.Equals | NodeKind.NotEquals |
			NodeKind.ShiftLeft | NodeKind.ShiftRight | NodeKind.WrappingShiftLeft | NodeKind.BitwiseAnd |
			NodeKind.BitwiseOr | NodeKind.Xor | NodeKind.LogicalAnd | NodeKind.LogicalOr | NodeKind.NullishCoalesce |
			NodeKind.Union | NodeKind.Concatenate | NodeKind.To | NodeKind.As

		left: Expression
		right: Expression
	}

	export type ImportDestructureMember = {
		kind: NodeKind.ImportDestructureMember
		name: string
		as: string | ImportDestructureMember[]
	}

	export type Let = {
		kind: NodeKind.Let
		binding: Identifier | Destructure
		type: Expression | undefined
		initialValue: Expression | undefined
	}

	export type Destructure = {
		kind: NodeKind.Destructure
		members: { name: string, as: Identifier | Destructure, defaultValue: Expression | undefined }[]
	}

	export type If = {
		kind: NodeKind.If
		condition: Expression
		truthyBranch: Expression
		falseyBranch: Expression | undefined
	}

	export type Function = {
		kind: NodeKind.Function
		name: string
		// eslint-disable-next-line @typescript-eslint/ban-types
		parameter: Identifier | Object
		parameterType: Expression | undefined
		returnType: Expression | undefined
		body: Expression[]
	}

	export type DeclaredImport = {
		kind: NodeKind.DeclaredImport
		module: string
		members: { name: string, as: string, type: Expression }[]
	}

	export type Assignment = {
		kind: NodeKind.Assignment
		binding: Identifier | GetMember | Destructure
		value: Expression
	}

	export type Object = {
		kind: NodeKind.Object

		entries:
			{ name: string, type: Expression | undefined, value: Expression }[] |
			{ name: string, type: Expression, value: undefined }[]
	}

	export type Enum = { kind: NodeKind.Enum, name: string, members: { name: string, type: Expression | undefined }[] }
	export type Import = { kind: NodeKind.Import, path: string, as: string | ImportDestructureMember[] | undefined }
	export type Array = { kind: NodeKind.Array, expressions: Expression[] }
	export type Call = { kind: NodeKind.Call, callable: Expression, argument: Expression }
	export type Return = { kind: NodeKind.Return, expression: Expression }
	export type SignedIntegerLiteral = { kind: NodeKind.SignedIntegerLiteral, value: bigint, bits: number }
	export type UnsignedIntegerLiteral = { kind: NodeKind.UnsignedIntegerLiteral, value: bigint, bits: number }
	export type Float16Literal = { kind: NodeKind.Float16Literal, value: number }
	export type Float32Literal = { kind: NodeKind.Float32Literal, value: number }
	export type Float64Literal = { kind: NodeKind.Float64Literal, value: number }
	export type Float128Literal = { kind: NodeKind.Float128Literal, value: number }
	export type Increment = { kind: NodeKind.Increment, binding: Identifier | GetMember }
	export type Decrement = { kind: NodeKind.Decrement, binding: Identifier | GetMember }
	export type SignedIntegerType = { kind: NodeKind.SignedIntegerType, bits: number }
	export type UnsignedIntegerType = { kind: NodeKind.UnsignedIntegerType, bits: number }
	export type Float16Type = { kind: NodeKind.Float16Type }
	export type Float32Type = { kind: NodeKind.Float32Type }
	export type Float64Type = { kind: NodeKind.Float64Type }
	export type Float128Type = { kind: NodeKind.Float128Type }
	export type Null = { kind: NodeKind.Null }
	export type Do = { kind: NodeKind.Do, body: Expression[] }
	export type Void = { kind: NodeKind.Void, expression: Expression }
	export type True = { kind: NodeKind.True }
	export type False = { kind: NodeKind.False }
	export type Boolean = { kind: NodeKind.Boolean }
	export type FunctionType = { kind: NodeKind.FunctionType, argumentType: Expression, returnType: Expression }
	export type Any = { kind: NodeKind.Any }
	export type MinusPrefix = { kind: NodeKind.MinusPrefix, expression: Expression }
	export type While = { kind: NodeKind.While, condition: Expression, body: Expression }
	export type Identifier = { kind: NodeKind.Identifier, name: string }
	export type GetMember = { kind: NodeKind.GetMember, expression: Expression, name: string }
	export type String = { kind: NodeKind.String, value: string }
	export type BitwiseNot = { kind: NodeKind.BitwiseNot, expression: Expression }
	export type LogicalNot = { kind: NodeKind.LogicalNot, expression: Expression }
}

export type Node = Node.Expression

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

export const BinaryOperatorTokenToNodeKinds: { [Key in TokenKind]?: Node.BinaryOperation[`kind`] } = {
	[TokenKind.Add]: NodeKind.Add,
	[TokenKind.Minus]: NodeKind.Minus,
	[TokenKind.Divide]: NodeKind.Divide,
	[TokenKind.Times]: NodeKind.Times,
	[TokenKind.Modulo]: NodeKind.Modulo,
	[TokenKind.Power]: NodeKind.Power,
	[TokenKind.WrappingAdd]: NodeKind.WrappingAdd,
	[TokenKind.WrappingMinus]: NodeKind.WrappingMinus,
	[TokenKind.WrappingDivide]: NodeKind.WrappingDivide,
	[TokenKind.WrappingTimes]: NodeKind.WrappingTimes,
	[TokenKind.WrappingPower]: NodeKind.WrappingPower,
	[TokenKind.Is]: NodeKind.Is,
	[TokenKind.SmallerThan]: NodeKind.SmallerThan,
	[TokenKind.BiggerThan]: NodeKind.BiggerThan,
	[TokenKind.SmallerThanEquals]: NodeKind.SmallerThanEquals,
	[TokenKind.BiggerThanEquals]: NodeKind.BiggerThanEquals,
	[TokenKind.Equals]: NodeKind.Equals,
	[TokenKind.NotEquals]: NodeKind.NotEquals,
	[TokenKind.ShiftLeft]: NodeKind.ShiftLeft,
	[TokenKind.ShiftRight]: NodeKind.ShiftRight,
	[TokenKind.WrappingShiftLeft]: NodeKind.WrappingShiftLeft,
	[TokenKind.BitwiseAnd]: NodeKind.BitwiseAnd,
	[TokenKind.BitwiseOr]: NodeKind.BitwiseOr,
	[TokenKind.Xor]: NodeKind.Xor,
	[TokenKind.LogicalAnd]: NodeKind.LogicalAnd,
	[TokenKind.LogicalOr]: NodeKind.LogicalOr,
	[TokenKind.NullishCoalesce]: NodeKind.NullishCoalesce,
	[TokenKind.Union]: NodeKind.Union,
	[TokenKind.Concatenate]: NodeKind.Concatenate,
	[TokenKind.To]: NodeKind.To,
	[TokenKind.As]: NodeKind.As
}

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

		let expression = ensure(parseElement(), HERE)

		while (tokens.length > state.cursor) {
			const kind = BinaryOperatorTokenToNodeKinds[tokens[state.cursor]!.kind]

			if (!kind)
				return expression

			state.cursor++
			expression = { kind, left: expression, right: ensure(parseElement(), HERE) }
		}

		return expression
	}

	const parseElement = (): Node.Expression | undefined => {
		if (tokens.length == state.cursor)
			throw new ParseError(undefined)

		state.cursor++

		// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
		switch (tokens[state.cursor - 1]!.kind) {
			case TokenKind.While: {
				let condition: Node.Expression
				let body: Node.Expression

				if (nextTokenIs(TokenKind.OpenBracket)) {
					condition = parseExpression()

					if (nextTokenIs(TokenKind.Newline)) {
						expectNewline()
						body = { kind: NodeKind.Do, body: [ ...parseExpressions(tokens, indentLevel + 1, state) ] }
					} else
						body = parseExpression()
				} else {
					condition = parseExpression()

					if (nextTokenIs(TokenKind.OpenBracket))
						body = parseExpression()
					else {
						expectNewline()
						body = { kind: NodeKind.Do, body: [ ...parseExpressions(tokens, indentLevel + 1, state) ] }
					}
				}

				return { kind: NodeKind.While, condition, body }
			}

			case TokenKind.Null:
				return { kind: NodeKind.Null }

			case TokenKind.Void:
				return { kind: NodeKind.Void, expression: parseExpression() }

			case TokenKind.Return: {
				if (nextTokenIs(TokenKind.Newline))
					return { kind: NodeKind.Return, expression: { kind: NodeKind.Null } }

				return { kind: NodeKind.Return, expression: parseExpression() }
			}

			case TokenKind.Let: {
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

				return { kind: NodeKind.Let, binding, type, initialValue }
			}

			case TokenKind.Identifier: {
				const name = tokens[state.cursor - 1]!.data!

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

			case TokenKind.Number: {
				const numberString = tokens[state.cursor - 1]!.data!

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

			// case TokenKind.OpenBracket: {
			// 	let element: Node.Expression

			// 	if (nextTokenIs(TokenKind.Newline)) {
			// 		expectNewline()
			// 		element = { kind: NodeKind.Block, body: [ ...parseExpressions(tokens, indentLevel + 1, state) ] }
			// 		expectNewline(indentLevel)
			// 	} else
			// 		element = parseExpression()

			// 	expectToken(TokenKind.CloseBracket)

			// 	return element
			// }

			// case TokenKind.If: {
			// 	let condition: Node.Expression
			// 	let truthyBranch: Node.Expression

			// 	if (nextTokenIs(TokenKind.OpenBracket)) {
			// 		state.cursor++
			// 		condition = parseExpression()

			// 		if (nextTokenIs(TokenKind.Newline)) {
			// 			const newline = tokens[state.cursor]!

			// 			if (newline.data!.length != indentLevel)
			// 				throw new WrongIndentLevelParseError(newline, indentLevel)

			// 			state.cursor++
			// 		}

			// 		expectToken(TokenKind.CloseBracket)

			// 		if (nextTokenIs(TokenKind.Newline)) {
			// 			expectNewline()
			// 			truthyBranch = { kind: NodeKind.Block, body: [ ...parseExpressions(tokens, indentLevel + 1, state) ] }
			// 		} else
			// 			truthyBranch = parseExpression()
			// 	} else {
			// 		condition = parseExpression()

			// 		if (nextTokenIs(TokenKind.OpenBracket))
			// 			truthyBranch = parseExpression()
			// 		else {
			// 			expectNewline()
			// 			truthyBranch = { kind: NodeKind.Block, body: [ ...parseExpressions(tokens, indentLevel + 1, state) ] }
			// 		}
			// 	}

			// 	if (nextTokenIs(TokenKind.Newline, TokenKind.Else)) {
			// 		const newline = tokens[state.cursor]!

			// 		if (newline.data!.length != indentLevel)
			// 			throw new WrongIndentLevelParseError(newline, indentLevel)

			// 		state.cursor++
			// 	}

			// 	let falseyBranch: Node.Expression | undefined

			// 	if (nextTokenIs(TokenKind.Else)) {
			// 		state.cursor++

			// 		if (nextTokenIs(TokenKind.Newline)) {
			// 			expectNewline()
			// 			falseyBranch = { kind: NodeKind.Block, body: [ ...parseExpressions(tokens, indentLevel + 1, state) ] }
			// 		} else
			// 			falseyBranch = parseExpression()
			// 	}

			// 	return {
			// 		kind: NodeKind.If,
			// 		condition,
			// 		truthyBranch,
			// 		falseyBranch
			// 	}
			// }

			// case TokenKind.Minus: {
			// 	const expression = ensure(parseElement(), HERE)

			// 	if (expression.kind == NodeKind.UnsignedIntegerLiteral)
			// 		return { kind: NodeKind.SignedIntegerLiteral, value: -expression.value, bits: expression.bits + 1 }

			// 	return { kind: NodeKind.MinusPrefix, expression }
			// }

			case TokenKind.Float16Type:
				return { kind: NodeKind.Float16Type }

			case TokenKind.Float32Type:
				return { kind: NodeKind.Float32Type }

			case TokenKind.Float64Type:
				return { kind: NodeKind.Float64Type }

			case TokenKind.Float128Type:
				return { kind: NodeKind.Float128Type }

			case TokenKind.UnsignedIntegerType:
				return { kind: NodeKind.UnsignedIntegerType, bits: Number(tokens[state.cursor - 1]!.data!) }

			case TokenKind.SignedIntegerType:
				return { kind: NodeKind.SignedIntegerType, bits: Number(tokens[state.cursor - 1]!.data!) }

			case TokenKind.Enum: {
				const enumNode: Node.Enum = {
					kind: NodeKind.Enum,
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

					enumNode.members.push({ name, type })

					const newline = expectToken(TokenKind.Newline)

					if (newline.data!.length < indentLevel)
						break

					if (newline.data!.length != indentLevel)
						throw new WrongIndentLevelParseError(newline, indentLevel)
				}

				indentLevel--

				return enumNode
			}
		}

		return undefined

		// if (nextTokenIs(TokenKind.DeclareFunction)) {
		// 	const name = tokens[state.cursor]!.data!
		// 	const parameters: Node.Parameter[] = []

		// 	state.cursor++

		// 	if (!nextTokenIs(TokenKind.CloseBracket)) {
		// 		while (true) {
		// 			const identifier = expectToken(TokenKind.Identifier)

		// 			expectToken(TokenKind.Colon)

		// 			parameters.push({
		// 				kind: NodeKind.Parameter,
		// 				binding: { kind: NodeKind.Identifier, name: identifier.data! },
		// 				type: parseExpression()
		// 			})

		// 			if (nextTokenIs(TokenKind.CloseBracket))
		// 				break

		// 			expectToken(TokenKind.Comma)
		// 		}
		// 	}

		// 	state.cursor++

		// 	let returnType

		// 	if (nextTokenIs(TokenKind.Colon)) {
		// 		state.cursor++
		// 		returnType = parseExpression()
		// 	} else if (!nextTokenIs(TokenKind.Newline))
		// 		returnType = parseExpression()

		// 	return { kind: NodeKind.DeclaredFunction, name, parameters, returnType }
		// }

		// if (nextTokenIs(TokenKind.Constant)) {
		// 	state.cursor++

		// 	const binding: Node.Identifier = {
		// 		kind: NodeKind.Identifier,
		// 		name: expectToken(TokenKind.Identifier).data!
		// 	}

		// 	let type

		// 	if (nextTokenIs(TokenKind.Colon)) {
		// 		state.cursor++
		// 		type = parseExpression()
		// 	}

		// 	expectToken(TokenKind.Assign)

		// 	return {
		// 		kind: NodeKind.ConstantDeclaration,
		// 		binding,
		// 		type,
		// 		value: parseExpression()
		// 	}
		// }

		// if (nextTokenIs(TokenKind.Function)) {
		// 	const name = tokens[state.cursor]!.data!

		// 	state.cursor++

		// 	const parameter = parseExpression()

		// 	// if (parameter.kind != NodeKind.Identifier && parameter.kind != NodeKind.Object)

		// 	if (!nextTokenIs(TokenKind.CloseBracket)) {
		// 		while (true) {
		// 			const identifier = expectToken(TokenKind.Identifier)

		// 			expectToken(TokenKind.Colon)

		// 			parameters.push({
		// 				kind: NodeKind.Parameter,
		// 				binding: { kind: NodeKind.Identifier, name: identifier.data! },
		// 				type: parseExpression()
		// 			})

		// 			if (nextTokenIs(TokenKind.CloseBracket))
		// 				break

		// 			expectToken(TokenKind.Comma)
		// 		}
		// 	}

		// 	state.cursor++

		// 	let returnType

		// 	if (nextTokenIs(TokenKind.Colon)) {
		// 		state.cursor++
		// 		returnType = parseExpression()
		// 	} else if (!nextTokenIs(TokenKind.Newline))
		// 		returnType = parseExpression()

		// 	expectNewline()

		// 	return {
		// 		kind: NodeKind.Function,
		// 		name,
		// 		parameters,
		// 		returnType,
		// 		body: [ ...parseExpressions(tokens, indentLevel + 1, state) ]
		// 	}
		// }
	}

	const expectNewline = () => {
		const newline = expectToken(TokenKind.Newline)

		if (newline.data!.length != indentLevel)
			throw new WrongIndentLevelParseError(newline, indentLevel)
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
