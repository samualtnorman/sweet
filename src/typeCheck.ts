import { Expression, ExpressionKind } from "./parse"
import printExpression from "./printExpression"

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

class TypeError extends Error {
	static {
		Object.defineProperty(this.prototype, `name`, { value: this.name })
	}

	constructor(
		public readonly fileName: string,
		public readonly expression: Expression,
		message: string
	) {
		super(`${message} at ${fileName}:${expression.line}:${expression.column}`)
	}
}

export const typeCheck = (expressions: Expression[], fileName: string) => {
	const locals = new Map<string, Type>()

	const evaluateExpressionType = (expression: Expression): Type => {
		// stupid typescript requires an explicit type annotation here for some reason
		const assert: (value: any, message: string) => asserts value = (value, message) => {
			if (!value)
				throw new TypeError(fileName, expression, message)
		}

		switch (expression.kind) {
			case ExpressionKind.Function: {
				assert(expression.parameter.kind == ExpressionKind.Identifier, `${HERE} TODO handle object`)
				assert(expression.parameterType, `${HERE} TODO infer type`)
				locals.set(expression.parameter.name, evaluateExpression(expression.parameterType))

				if (expression.returnType) {
					// TODO make sure types of expressions in returns are assignable to the return type
					evaluateExpression(expression.returnType)
				}

				for (const childExpression of expression.body) {
					// TODO evaluated expression type must be null
					evaluateExpressionType(childExpression)
				}

				return { kind: TypeKind.Null }
			}

			case ExpressionKind.Let: {
				assert(expression.binding.kind == ExpressionKind.Identifier, `${HERE} TODO destructure`)
				assert(expression.type, `${HERE} TODO infer type`)
				assert(expression.initialValue, `${HERE} TODO no initial value`)
				// TODO variable not having given or inferred type
				// locals.set(expression.binding.name, evaluateExpression(expression.type))
				// TODO check if type of the expression is assignable to the given type
				evaluateExpressionType(expression.initialValue)

				return { kind: TypeKind.Null }
			}

			case ExpressionKind.While: {
				evaluateExpressionType(expression.condition)

				for (const childExpression of expression.body) {
					// TODO evaluated expression type must be null
					evaluateExpressionType(childExpression)
				}

				return { kind: TypeKind.Null }
			}

			case ExpressionKind.NormalAssign: {
				assert(expression.binding.kind == ExpressionKind.Identifier, `${HERE} TODO destructure`)
				// TODO check if the type of the value is assignable to the binding
				evaluateExpressionType(expression.value)

				return { kind: TypeKind.Null }
			}

			case ExpressionKind.Identifier: {
				if (locals.has(expression.name))
					return locals.get(expression.name)!

				throw new Error(`no variable "${expression.name}" at ${fileName}:${expression.line}:${expression.column}`)
			}

			default:
				throw new Error(`${HERE} TODO handle ${ExpressionKind[expression.kind]}`)
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

			case ExpressionKind.Union: {
				const leftEvaluated = evaluateExpression(expression.left)
				const rightEvaluated = evaluateExpression(expression.right)

				if (leftEvaluated.kind == TypeKind.Any)
					return leftEvaluated

				if (rightEvaluated.kind == TypeKind.Any)
					return rightEvaluated

				return {
					kind: TypeKind.Union,
					members: leftEvaluated.kind == TypeKind.Union ?
						(rightEvaluated.kind == TypeKind.Union ?
							[ ...leftEvaluated.members, ...rightEvaluated.members ] :
							[ ...leftEvaluated.members, rightEvaluated ]
						) :
						(rightEvaluated.kind == TypeKind.Union ?
							[ leftEvaluated, ...rightEvaluated.members ] :
							[ leftEvaluated, rightEvaluated ]
						)
				}
			}

			default: {
				console.log(printExpression(expression))

				throw new Error(`${HERE} ${ExpressionKind[expression.kind]}`)
			}
		}
	}

	for (const expression of expressions) {
		// TODO evaluated expression type must be null
		evaluateExpressionType(expression)
	}
}

export default typeCheck
