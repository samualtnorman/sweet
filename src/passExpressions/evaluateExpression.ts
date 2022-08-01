import { Context, Type, TypeKind } from "."
import { Expression, ExpressionKind } from "../parse"

export function evaluateExpression(expression: Node, context: Context): Type {
	switch (expression.kind) {
		case ExpressionKind.SignedIntegerType:
			return { kind: TypeKind.SignedInteger, bits: expression.bits }

		case ExpressionKind.UnsignedIntegerType:
			return { kind: TypeKind.UnsignedInteger, bits: expression.bits }

		case ExpressionKind.Float16Type:
			return { kind: TypeKind.Float16 }

		case ExpressionKind.Float32Type:
			return { kind: TypeKind.Float32 }

		case ExpressionKind.Float64Type:
			return { kind: TypeKind.Float64 }

		case ExpressionKind.Float128Type:
			return { kind: TypeKind.Float128 }

		case ExpressionKind.Null:
			return { kind: TypeKind.Null }

		case ExpressionKind.Or: {
			const leftEvaluated = evaluateExpression(expression.left, context)
			const rightEvaluated = evaluateExpression(expression.right, context)

			if (leftEvaluated.kind == TypeKind.Any)
				return leftEvaluated

			if (rightEvaluated.kind == TypeKind.Any)
				return rightEvaluated

			if (leftEvaluated.kind == TypeKind.Union) {
				if (rightEvaluated.kind == TypeKind.Union)
					leftEvaluated.members.push(...rightEvaluated.members)
				else
					leftEvaluated.members.push(rightEvaluated)

				return leftEvaluated
			}

			if (rightEvaluated.kind == TypeKind.Union) {
				rightEvaluated.members.push(leftEvaluated)

				return rightEvaluated
			}

			return { kind: TypeKind.Union, members: [ leftEvaluated, rightEvaluated ] }
		}

		default:
			throw new Error(`${HERE} ${ExpressionKind[expression.kind]}`)
	}
}

export default evaluateExpression
