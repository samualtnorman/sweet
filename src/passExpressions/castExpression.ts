import { assert } from "@samual/lib"
import { assertTypesAreCompatible, Context, printContext, Type, TypeKind } from "."
import { generateSourceFromNode } from "../generateSourceCode"
import { Expression, ExpressionKind } from "../parse"
import areTypesTheSame from "./areTypesTheSame"
import evaluateExpressionType from "./evaluateExpressionType"
import printType from "./printType"
import typeToExpression from "./typeToExpression"

const DEBUG = false

export function castExpression(expression: Expression.Expression, targetType: Type, context: Context): Expression.Expression {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (DEBUG) {
		console.log(`DEBUG castExpression(
    ${generateSourceFromNode(expression, `    `, 1)},
    ${printType(targetType)},
    ${printContext(context, `    `).trimEnd()}
)\n`)
	}

	switch (expression.kind) {
		case ExpressionKind.UnsignedIntegerLiteral: {
			assertTypesAreCompatible({ kind: TypeKind.UnsignedInteger, bits: expression.bits }, targetType)

			if (targetType.kind == TypeKind.UnsignedInteger) {
				if (expression.bits == targetType.bits)
					return expression

				assert(expression.bits < targetType.bits, HERE)

				return {
					kind: ExpressionKind.UnsignedIntegerLiteral,
					value: expression.value,
					bits: targetType.bits
				}
			}

			if (targetType.kind == TypeKind.SignedInteger) {
				// the extra bit is needed because signed integers use 1 bit for the sign
				assert(expression.bits < targetType.bits, HERE)

				return {
					kind: ExpressionKind.SignedIntegerLiteral,
					value: expression.value,
					bits: targetType.bits
				}
			}

			if (targetType.kind == TypeKind.Float16) {
				// IEEE half floating point numbers have 11 bits precision
				assert(expression.bits <= 11, HERE)

				return {
					kind: ExpressionKind.Float16Literal,
					value: Number(expression.value)
				}
			}

			if (targetType.kind == TypeKind.Float32) {
				assert(expression.bits <= 24, HERE)

				return {
					kind: ExpressionKind.Float32Literal,
					value: Number(expression.value)
				}
			}

			if (targetType.kind == TypeKind.Float64) {
				assert(expression.bits <= 53, HERE)

				return {
					kind: ExpressionKind.Float64Literal,
					value: Number(expression.value)
				}
			}

			assert(targetType.kind == TypeKind.Float128, HERE)
			assert(expression.bits <= 113, HERE)

			return {
				kind: ExpressionKind.Float128Literal,
				value: Number(expression.value)
			}
		}

		case ExpressionKind.Identifier: {
			const expressionType = evaluateExpressionType(expression, context)

			if (areTypesTheSame(expressionType, targetType))
				return { kind: ExpressionKind.As, left: expression, right: typeToExpression(expressionType) }

			assertTypesAreCompatible(expressionType, targetType)

			return {
				kind: ExpressionKind.To,
				left: { kind: ExpressionKind.As, left: expression, right: typeToExpression(expressionType) },
				right: typeToExpression(targetType)
			}
		}

		case ExpressionKind.Add: {
			// if (isNodeLiteral(expression.left) && isNodeLiteral(expression.right)) {
			// 	const expressionType = evaluateExpressionType(expression, context)

			// 	assert(expressionType.kind != TypeKind.Null, HERE)
			// 	assert(expressionType.kind != TypeKind.True, HERE)
			// 	assert(expressionType.kind != TypeKind.False, HERE)

			// 	switch (expressionType.kind) {
			// 		case TypeKind.UnsignedInteger:
			// 			return { kind: NodeKind.UnsignedIntegerLiteral, value: expression.left }
			// 	}
			// }

			if (isNodeLiteral(expression.left) || isNodeLiteral(expression.right)) {
				if (targetType.kind == TypeKind.UnsignedInteger || targetType.kind == TypeKind.SignedInteger) {
					expression.left = castExpression(expression.left, { ...targetType, bits: targetType.bits - 1 }, context)
					expression.right = castExpression(expression.right, { ...targetType, bits: targetType.bits - 1 }, context)
				} else {
					expression.left = castExpression(expression.left, targetType, context)
					expression.right = castExpression(expression.right, targetType, context)
				}

				return expression
			}

			const expressionType = evaluateExpressionType(expression, context)

			if (areTypesTheSame(expressionType, targetType))
				return expression

			assertTypesAreCompatible(expressionType, targetType)

			return {
				kind: ExpressionKind.To,
				left: expression,
				right: typeToExpression(targetType)
			}
		}

		case ExpressionKind.To: {
			assertTypesAreCompatible(evaluateExpressionType(expression, context), targetType)
			expression.right = typeToExpression(targetType)

			return expression
		}

		case ExpressionKind.SignedIntegerLiteral: {
			assertTypesAreCompatible({ kind: TypeKind.SignedInteger, bits: expression.bits }, targetType)

			if (targetType.kind == TypeKind.SignedInteger) {
				if (expression.bits == targetType.bits)
					return expression

				assert(expression.bits < targetType.bits, HERE)

				return {
					kind: ExpressionKind.SignedIntegerLiteral,
					value: expression.value,
					bits: targetType.bits
				}
			}

			if (targetType.kind == TypeKind.Float16) {
				// IEEE half floating point numbers have 11 bits precision
				assert(expression.bits <= 11, HERE)

				return {
					kind: ExpressionKind.Float16Literal,
					value: Number(expression.value)
				}
			}

			if (targetType.kind == TypeKind.Float32) {
				assert(expression.bits <= 24, HERE)

				return {
					kind: ExpressionKind.Float32Literal,
					value: Number(expression.value)
				}
			}

			if (targetType.kind == TypeKind.Float64) {
				assert(expression.bits <= 53, HERE)

				return {
					kind: ExpressionKind.Float64Literal,
					value: Number(expression.value)
				}
			}

			assert(targetType.kind == TypeKind.Float128, HERE)
			assert(expression.bits <= 113, HERE)

			return {
				kind: ExpressionKind.Float128Literal,
				value: Number(expression.value)
			}
		}

		default: {
			const expressionType = evaluateExpressionType(expression, context)

			if (areTypesTheSame(expressionType, targetType))
				return expression

			assertTypesAreCompatible(expressionType, targetType)

			return {
				kind: ExpressionKind.To,
				left: expression,
				right: typeToExpression(targetType)
			}
		}
	}
}

export default castExpression

export function isNodeLiteral(node: Node): node is Expression.Literal {
	return node.kind == ExpressionKind.UnsignedIntegerLiteral || node.kind == ExpressionKind.SignedIntegerLiteral || node.kind == ExpressionKind.Float16Literal || node.kind == ExpressionKind.Float32Literal || node.kind == ExpressionKind.Float64Literal || node.kind == ExpressionKind.Float128Literal
}
