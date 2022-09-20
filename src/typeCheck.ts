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

		const resolveTypes = (...types: Type[]): Type => {
			const typeKinds = new Set(types.map(({ kind }) => kind))

			if (typeKinds.has(TypeKind.Float128)) {
				for (const type of types)
					assertTypesAreCompatible(type, { kind: TypeKind.Float128 })

				return { kind: TypeKind.Float128 }
			}

			if (typeKinds.has(TypeKind.Float64)) {
				for (const type of types)
					assertTypesAreCompatible(type, { kind: TypeKind.Float64 })

				return { kind: TypeKind.Float64 }
			}

			if (typeKinds.has(TypeKind.Float32)) {
				for (const type of types)
					assertTypesAreCompatible(type, { kind: TypeKind.Float32 })

				return { kind: TypeKind.Float32 }
			}

			if (typeKinds.has(TypeKind.Float16)) {
				for (const type of types)
					assertTypesAreCompatible(type, { kind: TypeKind.Float16 })

				return { kind: TypeKind.Float16 }
			}

			if (typeKinds.has(TypeKind.SignedInteger)) {
				let bits = 0

				for (const type of types) {
					switch (type.kind) {
						case TypeKind.UnsignedInteger: {
							bits = Math.max(bits, type.bits + 1)
						} break

						case TypeKind.SignedInteger: {
							bits = Math.max(bits, type.bits)
						} break

						default:
							throw new Error(`${HERE} ${printType(type)}`)
					}
				}

				return { kind: TypeKind.SignedInteger, bits }
			}

			if (typeKinds.has(TypeKind.UnsignedInteger)) {
				let bits = 0

				for (const type of types) {
					assert(type.kind == TypeKind.UnsignedInteger, `${HERE} ${printType(type)}`)
					bits = Math.max(bits, type.bits)
				}

				return { kind: TypeKind.UnsignedInteger, bits }
			}

			throw new Error(HERE)
		}

		const assertTypesAreCompatible = (subject: Type, target: Type) => {
			assert(isTypeCompatible(subject, target), `${printType(subject)} is not compatible with ${printType(target)}`)
		}

		const printType = (type: Type): string => {
			switch (type.kind) {
				case TypeKind.Null:
					return `null`

				case TypeKind.True:
					return `true`

				case TypeKind.False:
					return `false`

				case TypeKind.UnsignedInteger:
					return type.bits ? `u${type.bits}` : `u`

				case TypeKind.SignedInteger:
					return type.bits ? `i${type.bits}` : `i`

				case TypeKind.Float16:
					return `f16`

				case TypeKind.Float32:
					return `f32`

				case TypeKind.Float64:
					return `f64`

				case TypeKind.Float128:
					return `f128`

				case TypeKind.Union:
					return type.members.map(
						type => type.kind == TypeKind.Function ? `(${printType(type)})` : printType(type)
					).join(` ? `)

				case TypeKind.Object:
					return `{ ${[ ...type.properties ].map(([ name, type ]) => `${name}: ${printType(type)}`).join(`, `)} }`

				case TypeKind.Function: {
					const printedReturnType = type.returnType.kind == TypeKind.Union ||
						type.returnType.kind == TypeKind.Function ?
							`(${printType(type.returnType)})` :
							printType(type.returnType)

					return `(${[ ...type.parameters ].map(type => printType(type)).join(`, `)}): ${printedReturnType}`
				}

				case TypeKind.Any:
					return `any`

				default:
					throw new Error(`TODO handle ${TypeKind[type.kind]}`)
			}
		}

		switch (expression.kind) {
			case ExpressionKind.Function: {
				assert(expression.parameter.kind == ExpressionKind.Identifier, `TODO handle object`)
				assert(expression.parameterType, `TODO infer type`)
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
				assert(expression.binding.kind == ExpressionKind.Identifier, `TODO destructure`)
				assert(expression.initialValue, `TODO no initial value`)
				// TODO variable not having given or inferred type
				// TODO check if type of the expression is assignable to the given type

				if (expression.type) {
					const type = evaluateExpression(expression.type)

					assertTypesAreCompatible(evaluateExpressionType(expression.initialValue), type)
					locals.set(expression.binding.name, type)
				} else
					locals.set(expression.binding.name, evaluateExpressionType(expression.initialValue))

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
				assert(expression.binding.kind == ExpressionKind.Identifier, `TODO destructure`)
				// TODO check if the type of the value is assignable to the binding
				evaluateExpressionType(expression.value)

				return { kind: TypeKind.Null }
			}

			case ExpressionKind.Identifier: {
				if (locals.has(expression.name))
					return locals.get(expression.name)!

				throw new Error(`no variable "${expression.name}" at ${fileName}:${expression.line}:${expression.column}`)
			}

			case ExpressionKind.UnsignedIntegerLiteral:
				return { kind: TypeKind.UnsignedInteger, bits: expression.bits }

			case ExpressionKind.Add: {
				const resolvedType = resolveTypes(
					evaluateExpressionType(expression.left),
					evaluateExpressionType(expression.right)
				)

				if (resolvedType.kind == TypeKind.UnsignedInteger || resolvedType.kind == TypeKind.SignedInteger)
					resolvedType.bits++

				return resolvedType
			}

			default:
				throw new Error(`TODO handle expression ${ExpressionKind[expression.kind]}`)
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

				throw new Error(`${ExpressionKind[expression.kind]}`)
			}
		}
	}

	const isTypeCompatible = (subject: Type, target: Type): boolean => {
		if (target.kind == TypeKind.Any)
			return true

		if (target.kind == TypeKind.Union)
			return target.members.some(target => isTypeCompatible(subject, target))

		switch (subject.kind) {
			case TypeKind.Null:
				return target.kind == TypeKind.Null

			case TypeKind.True:
				return target.kind == TypeKind.True

			case TypeKind.False:
				return target.kind == TypeKind.False

			case TypeKind.UnsignedInteger: {
				if (target.kind == TypeKind.UnsignedInteger)
					return subject.bits <= target.bits

				// the extra bit is needed because signed integers use 1 bit for the sign
				if (target.kind == TypeKind.SignedInteger)
					return subject.bits < target.bits

				// IEEE half floating point numbers have 11 bits precision
				if (target.kind == TypeKind.Float16)
					return subject.bits <= 11

				if (target.kind == TypeKind.Float32)
					return subject.bits <= 24

				if (target.kind == TypeKind.Float64)
					return subject.bits <= 53

				return target.kind == TypeKind.Float128 && subject.bits <= 113
			}

			case TypeKind.SignedInteger: {
				if (target.kind == TypeKind.SignedInteger)
					return subject.bits <= target.bits

				// we can get away with an extra bit here because signed integers use 1 bit for the sign
				if (target.kind == TypeKind.Float16)
					return subject.bits <= 12

				if (target.kind == TypeKind.Float32)
					return subject.bits <= 25

				if (target.kind == TypeKind.Float64)
					return subject.bits <= 54

				return target.kind == TypeKind.Float128 && subject.bits <= 114
			}

			case TypeKind.Float16: {
				if (target.kind == TypeKind.Float16 || target.kind == TypeKind.Float32)
					return true

				return target.kind == TypeKind.Float64 || target.kind == TypeKind.Float128
			}

			case TypeKind.Float32: {
				if (target.kind == TypeKind.Float32 || target.kind == TypeKind.Float64 || target.kind == TypeKind.Float128)
					return true

				return false
			}

			case TypeKind.Float64:
				return target.kind == TypeKind.Float64 || target.kind == TypeKind.Float128

			case TypeKind.Float128:
				return target.kind == TypeKind.Float128

			case TypeKind.Union:
				return subject.members.every(subject => isTypeCompatible(subject, target))

			case TypeKind.Object: {
				if (target.kind != TypeKind.Object)
					return false

				return [ ...target.properties ].every(([ propertyName, target ]) => {
					if (subject.properties.has(propertyName))
						return isTypeCompatible(subject.properties.get(propertyName)!, target)

					return false
				})
			}

			case TypeKind.Function: {
				if (target.kind != TypeKind.Function || subject.parameters.length > target.parameters.length)
					return false

				for (const [ parameterIndex, parameterType ] of subject.parameters.entries()) {
					if (!isTypeCompatible(parameterType, target.parameters[parameterIndex]!))
						return false
				}

				return isTypeCompatible(subject.returnType, target.returnType)
			}

			case TypeKind.Opaque:
				return subject == target

			default:
				throw new Error(`TODO handle type ${TypeKind[subject.kind]}`)
		}
	}

	for (const expression of expressions) {
		// TODO evaluated expression type must be null
		evaluateExpressionType(expression)
	}
}

export default typeCheck
