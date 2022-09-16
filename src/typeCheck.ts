import { assert } from "@samual/lib"
import { Expression, ExpressionKind } from "./parse"

export type Type = Type.Opaque | Type.Null | Type.True | Type.False | Type.UnsignedInteger | Type.SignedInteger | Type.Float16 |
	Type.Float32 | Type.Float64 | Type.Float128 | Type.Union | Type.Object | Type.Function | Type.Any

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Type {
	export type Opaque = { kind: TypeKind.Opaque }
	export type Null = { kind: TypeKind.Null }
	export type True = { kind: TypeKind.True }
	export type False = { kind: TypeKind.False }
	export type UnsignedInteger = { kind: TypeKind.UnsignedInteger, bits: number }
	export type SignedInteger = { kind: TypeKind.SignedInteger, bits: number }
	export type Float16 = { kind: TypeKind.Float16 }
	export type Float32 = { kind: TypeKind.Float32 }
	export type Float64 = { kind: TypeKind.Float64 }
	export type Float128 = { kind: TypeKind.Float128 }
	export type Union = { kind: TypeKind.Union, members: Exclude<Type, Union | Any>[] }
	export type Object = { kind: TypeKind.Object, properties: Map<string, Type> }
	export type Function = { kind: TypeKind.Function, parameters: Type[], returnType: Type }
	export type Any = { kind: TypeKind.Any }
}

export enum TypeKind {
	Opaque, Null, True, False, UnsignedInteger, SignedInteger, Float16,
	Float32, Float64, Float128, Union, Object, Function, Any
}

export const typeCheck = (expressions: Expression[]) => {
	const locals = new Map<string, Type>()

	const evaluateExpressionType = (expression: Expression): Type => {
		switch (expression.kind) {
			case ExpressionKind.Function: {
				typeCheck(expression.body)

				return { kind: TypeKind.Null }
			}

			case ExpressionKind.Let: {
				assert(expression.binding.kind == ExpressionKind.Identifier, `${HERE} TODO destructure`)
				assert(expression.type, `${HERE} TODO infer type`)
				assert(expression.initialValue, `${HERE} TODO no initial value`)
				// TODO variable not having given or inferred type
				evaluateExpressionType(expression.type)
				evaluateExpressionType(expression.initialValue)

				return { kind: TypeKind.Null }
			}

			case ExpressionKind.While: {
				typeCheck(expression.body)

				return { kind: TypeKind.Null }
			}

			case ExpressionKind.NormalAssign: {
				// TODO check if the type of the value is assignable to the binding

				return { kind: TypeKind.Null }
			}

			default:
				throw new Error(`${HERE} unhandled expression kind ${ExpressionKind[expression.kind]}`)
		}
	}

	const evaluateExpression = (expression: Expression): Type => {
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

	for (const expression of expressions)
		evaluateExpressionType(expression)
}

export default typeCheck
