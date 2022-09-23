import { Expression, ExpressionKind } from "./parse"
import { assert, error as error_, Location, assert as assert_ } from "./shared"

export type Type = Type.Opaque | Type.Null | Type.True | Type.False | Type.UnsignedInteger | Type.SignedInteger | Type.Float16 |
	Type.Float32 | Type.Float64 | Type.Float128 | Type.Union | Type.Object | Type.Function | Type.Any

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Type {
	export type Opaque = { kind: TypeKind.Opaque }
	export type Null = { kind: TypeKind.Null }
	export type True = { kind: TypeKind.True }
	export type False = { kind: TypeKind.False }
	export type UnsignedInteger = { kind: TypeKind.UnsignedInteger, bits: number, isZero: false | undefined }
	export type SignedInteger = { kind: TypeKind.SignedInteger, bits: number, isZero: false | undefined }
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

export function typeCheck(expressions: Expression[], fileName: string) {
	const symbols = new Map<string, Type>()

	for (const expression of expressions)
		assertTypeIsCompatible(getExpressionType(expression), { kind: TypeKind.Null }, expression)

	function getExpressionType(expression: Expression): Type {
		const returnedTypes: Type[] = []

		const assert: (value: any, message: string) => asserts value = (value, message) => assert_(value, message, fileName, expression)

		const evaluateExpression = (expression: Expression): Type => {
			switch (expression.kind) {
				case ExpressionKind.SignedIntegerType:
					return { kind: TypeKind.SignedInteger, bits: expression.bits || 32, isZero: undefined }

				case ExpressionKind.UnsignedIntegerType:
					return { kind: TypeKind.UnsignedInteger, bits: expression.bits || 32, isZero: undefined }

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

				default:
					error(`TODO handle ExpressionKind.${ExpressionKind[expression.kind]}`, expression)
			}
		}

		const resolveTypes = (...types: Type[]): Type => {
			if (!types.length)
				return { kind: TypeKind.Null }

			const typeKinds = new Set(types.map(({ kind }) => kind))

			if (typeKinds.has(TypeKind.Float128)) {
				for (const type of types)
					assertTypeIsCompatible(type, { kind: TypeKind.Float128 }, expression)

				return { kind: TypeKind.Float128 }
			}

			if (typeKinds.has(TypeKind.Float64)) {
				for (const type of types)
					assertTypeIsCompatible(type, { kind: TypeKind.Float64 }, expression)

				return { kind: TypeKind.Float64 }
			}

			if (typeKinds.has(TypeKind.Float32)) {
				for (const type of types)
					assertTypeIsCompatible(type, { kind: TypeKind.Float32 }, expression)

				return { kind: TypeKind.Float32 }
			}

			if (typeKinds.has(TypeKind.Float16)) {
				for (const type of types)
					assertTypeIsCompatible(type, { kind: TypeKind.Float16 }, expression)

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
							error(`TODO handle TypeKind.${TypeKind[type.kind]}`, expression)
					}
				}

				return { kind: TypeKind.SignedInteger, bits, isZero: undefined }
			}

			if (typeKinds.has(TypeKind.UnsignedInteger)) {
				let bits = 0

				for (const type of types) {
					assert(type.kind == TypeKind.UnsignedInteger, `${HERE} ${printType(type)}`)
					bits = Math.max(bits, type.bits)
				}

				return { kind: TypeKind.UnsignedInteger, bits, isZero: undefined }
			}

			error(`TODO handle TypeKind.${TypeKind[types[0]!.kind]}`, expression)
		}

		switch (expression.kind) {
			case ExpressionKind.Function: {
				assert(expression.parameter.kind == ExpressionKind.Identifier, `TODO handle object`)
				assert(expression.parameterType, `TODO infer type`)
				symbols.set(expression.parameter.name, evaluateExpression(expression.parameterType))

				for (const childExpression of expression.body)
					assertTypeIsCompatible(getExpressionType(childExpression), { kind: TypeKind.Null }, childExpression)

				if (expression.returnType) {
					const returnType = evaluateExpression(expression.returnType)

					for (const returnedType of returnedTypes)
						assertTypeIsCompatible(returnedType, returnType, expression)
				} else
					resolveTypes(...returnedTypes)

				return { kind: TypeKind.Null }
			}

			case ExpressionKind.Let: {
				assert(expression.binding.kind == ExpressionKind.Identifier, `TODO destructure`)
				assert(expression.initialValue, `TODO no initial value`)

				if (expression.type) {
					const type = evaluateExpression(expression.type)

					assertTypeIsCompatible(getExpressionType(expression.initialValue), type, expression)
					symbols.set(expression.binding.name, type)
				} else
					symbols.set(expression.binding.name, getExpressionType(expression.initialValue))

				return { kind: TypeKind.Null }
			}

			case ExpressionKind.While: {
				// TODO I need a function to do this to share code
				if (expression.condition.kind == ExpressionKind.Identifier && symbols.has(expression.condition.name)) {
					const type = symbols.get(expression.condition.name)!

					if (`isZero` in type)
						type.isZero = false
				}

				getExpressionType(expression.condition)

				for (const childExpression of expression.body)
					assertTypeIsCompatible(getExpressionType(childExpression), { kind: TypeKind.Null }, childExpression)

				return { kind: TypeKind.Null }
			}

			case ExpressionKind.NormalAssign: {
				assert(expression.binding.kind == ExpressionKind.Identifier, `TODO destructure`)

				if (!symbols.has(expression.binding.name))
					error(`no variable "${expression.binding.name}"`, expression)

				assertTypeIsCompatible(getExpressionType(expression.value), symbols.get(expression.binding.name)!, expression)

				return { kind: TypeKind.Null }
			}

			case ExpressionKind.Identifier: {
				if (symbols.has(expression.name))
					return symbols.get(expression.name)!

				error(`no variable "${expression.name}"`, expression)
			}

			case ExpressionKind.UnsignedIntegerLiteral:
				return { kind: TypeKind.UnsignedInteger, bits: expression.bits, isZero: undefined }

			case ExpressionKind.Add: {
				const type = resolveTypes(getExpressionType(expression.left), getExpressionType(expression.right))

				if (type.kind == TypeKind.UnsignedInteger || type.kind == TypeKind.SignedInteger)
					return { ...type, bits: type.bits + 1 }

				return type
			}

			case ExpressionKind.Decrement: {
				assert(expression.binding.kind == ExpressionKind.Identifier, `TODO destructure`)

				if (!symbols.has(expression.binding.name))
					error(`no variable "${expression.binding.name}"`, expression)

				const type = symbols.get(expression.binding.name)!

				if ((type.kind == TypeKind.UnsignedInteger || type.kind == TypeKind.SignedInteger) && type.isZero != false)
					assertTypeIsCompatible({ kind: TypeKind.SignedInteger, bits: type.bits + 1, isZero: type.isZero }, type, expression)

				return { kind: TypeKind.Null }
			}

			case ExpressionKind.Return: {
				returnedTypes.push(
					expression.expression ? getExpressionType(expression.expression) : { kind: TypeKind.Null }
				)

				return { kind: TypeKind.Null }
			}

			case ExpressionKind.WrappingAdd:
				return resolveTypes(getExpressionType(expression.left), getExpressionType(expression.right))

			case ExpressionKind.Minus: {
				const type = resolveTypes(getExpressionType(expression.left), getExpressionType(expression.right))

				if (type.kind == TypeKind.UnsignedInteger || type.kind == TypeKind.SignedInteger)
					return { kind: TypeKind.SignedInteger, bits: type.bits + 1, isZero: undefined }

				return type
			}

			case ExpressionKind.If: {
				assert(!expression.falseyBranch, `TODO else branch`)

				// TODO I need a function to do this to share code
				if (expression.condition.kind == ExpressionKind.BiggerThan &&
					expression.condition.left.kind == ExpressionKind.Identifier &&
					symbols.has(expression.condition.left.name)) {
					const leftType = symbols.get(expression.condition.left.name)!
					const rightType = evaluateExpression(expression.condition.right)

					if (leftType.kind == TypeKind.UnsignedInteger && rightType.kind == TypeKind.UnsignedInteger)
						leftType.bits = rightType.bits
				}

				const truthyBranchType = getExpressionType(expression.truthyBranch)

				if (truthyBranchType.kind == TypeKind.Any)
					return truthyBranchType

				// TODO I need a function to resolve types and widen if needed
				return {
					kind: TypeKind.Union,
					members: truthyBranchType.kind == TypeKind.Union ?
						[ ...truthyBranchType.members, { kind: TypeKind.Null } ] :
						[ truthyBranchType, { kind: TypeKind.Null } ]
				}
			}

			case ExpressionKind.Do:
			case ExpressionKind.Loop: {
				for (const childExpression of expression.body)
					assertTypeIsCompatible(getExpressionType(childExpression), { kind: TypeKind.Null }, childExpression)

				return { kind: TypeKind.Null }
			}

			case ExpressionKind.GlobalError: {
				return { kind: TypeKind.Opaque }
			}

			default:
				error(`TODO handle ExpressionKind.${ExpressionKind[expression.kind]}`, expression)
		}
	}

	function error(message: string, location: Location): never {
		return error_(message, fileName, location)
	}

	function assertTypeIsCompatible(subject: Type, target: Type, expression: Expression) {
		assert(
			isTypeCompatible(subject, target),
			`${printType(subject)} is not compatible with ${printType(target)}`,
			fileName,
			expression
		)
	}

	function isTypeCompatible(subject: Type, target: Type): boolean {
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
				throw new Error(`TODO handle TypeKind.${TypeKind[subject.kind]}`)
		}
	}

	function printType(type: Type): string {
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
				throw new Error(`TODO handle TypeKind.${TypeKind[type.kind]}`)
		}
	}
}

export default typeCheck
