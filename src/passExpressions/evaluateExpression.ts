import { Context, Type, TypeKind } from "."
import { Node, NodeKind } from "../parse"

export function evaluateExpression(expression: Node, context: Context): Type {
	switch (expression.kind) {
		case NodeKind.SignedIntegerType:
			return { kind: TypeKind.SignedInteger, bits: expression.bits }

		case NodeKind.UnsignedIntegerType:
			return { kind: TypeKind.UnsignedInteger, bits: expression.bits }

		case NodeKind.Float16Type:
			return { kind: TypeKind.Float16 }

		case NodeKind.Float32Type:
			return { kind: TypeKind.Float32 }

		case NodeKind.Float64Type:
			return { kind: TypeKind.Float64 }

		case NodeKind.Float128Type:
			return { kind: TypeKind.Float128 }

		case NodeKind.Null:
			return { kind: TypeKind.Null }

		case NodeKind.Or: {
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
			throw new Error(`${HERE} ${NodeKind[expression.kind]}`)
	}
}

export default evaluateExpression
