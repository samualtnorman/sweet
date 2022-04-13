import { assert } from "@samual/lib"
import { Node, NodeKind } from "./parse"

export enum TypeKind {
	Null = 1,
	True,
	False,
	UnsignedInteger,
	SignedInteger,
	Float16,
	Float32,
	Float64,
	Float128,
	Union,
	Object,
	Function,
	Any
}

export namespace Type {
	export type Null = { kind: TypeKind.Null }
	export type True = { kind: TypeKind.True }
	export type False = { kind: TypeKind.False }
	export type UnsignedInteger = { kind: TypeKind.UnsignedInteger, bits: number }
	export type SignedInteger = { kind: TypeKind.SignedInteger, bits: number }
	export type Float16 = { kind: TypeKind.Float16 }
	export type Float32 = { kind: TypeKind.Float32 }
	export type Float64 = { kind: TypeKind.Float64 }
	export type Float128 = { kind: TypeKind.Float128 }
	export type Union = { kind: TypeKind.Union, members: Exclude<Type, Union | Any>[]}
	export type Object = { kind: TypeKind.Object, properties: Map<string, Type> }
	export type Function = { kind: TypeKind.Function, parameters: Type[], returnType: Type }
	export type Any = { kind: TypeKind.Any }
}

export type Type = Type.Null
	| Type.True
	| Type.False
	| Type.UnsignedInteger
	| Type.SignedInteger
	| Type.Float16
	| Type.Float32
	| Type.Float64
	| Type.Float128
	| Type.Union
	| Type.Object
	| Type.Function
	// | Type.Any

export type Context = {
	variables: Map<string, { type: Type, isDefined: boolean }>
	expectedReturnType: Type
}

export function passExpressions(expressions: Node.Expression[]) {
	const context = createContext()

	for (const expression of expressions)
		evaluateExpressionType(expression, context)

	return context
}

export default passExpressions

export function evaluateExpressionType(expression: Node.Expression, context: Context): Type {
	switch (expression.kind) {
		case NodeKind.Function: {
			const functionContext = scopeContext(context)
			const parameters = []

			for (const parameter of expression.parameters) {
				assert(parameter.type, HERE)

				const type = evaluateExpression(parameter.type, functionContext)

				functionContext.variables.set(parameter.name, { type, isDefined: true })
				parameters.push(type)
			}

			assert(expression.returnType, HERE)

			const returnType = evaluateExpression(expression.returnType, context)

			context.variables.set(expression.name, {
				type: { kind: TypeKind.Function, parameters, returnType },
				isDefined: true
			})

			functionContext.expectedReturnType = returnType

			for (const childExpression of expression.body)
				evaluateExpressionType(childExpression, functionContext)

			return { kind: TypeKind.Null }
		}

		case NodeKind.Return: {
			expression.expression ||= { kind: NodeKind.Null }

			const evaluatedExpressionType = evaluateExpressionType(expression.expression, context)

			assert(
				areTypesCompatible(evaluatedExpressionType, context.expectedReturnType),
				`${HERE} ${printType(evaluatedExpressionType)} is not compatible with ${printType(context.expectedReturnType)}`
			)

			return { kind: TypeKind.Null }
		}

		case NodeKind.UnsignedInteger:
			return { kind: TypeKind.UnsignedInteger, bits: expression.bits }

		case NodeKind.SignedInteger:
			return { kind: TypeKind.SignedInteger, bits: expression.bits }

		default:
			throw new Error(`${HERE} ${NodeKind[expression.kind]}`)
	}
}

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

export function createContext(): Context {
	return {
		variables: new Map(),
		expectedReturnType: { kind: TypeKind.Null }
	}
}

export function scopeContext(context: Context): Context {
	return {
		variables: new Map(context.variables),
		expectedReturnType: context.expectedReturnType
	}
}

function areTypesCompatible(subject: Type, target: Type): boolean {
	if (target.kind == TypeKind.Union)
		return target.members.some(target => areTypesCompatible(subject, target))

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
			return subject.members.every(subject => areTypesCompatible(subject, target))

		case TypeKind.Object: {
			if (target.kind != TypeKind.Object)
				return false

			return [ ...target.properties ].every(([ propertyName, target ]) => {
				if (subject.properties.has(propertyName))
					return areTypesCompatible(subject.properties.get(propertyName)!, target)

				return false
			})
		}

		case TypeKind.Function: {
			if (target.kind != TypeKind.Function || subject.parameters.length > target.parameters.length)
				return false

			for (const [ parameterIndex, parameterType ] of subject.parameters.entries()) {
				if (!areTypesCompatible(parameterType, target.parameters[parameterIndex]!))
					return false
			}

			return areTypesCompatible(subject.returnType, target.returnType)
		}
	}
}

export function printContext(context: Context, indentString = `\t`): string {
	let o = `variables:\n`

	for (const [ name, variable ] of context.variables)
		o += `${indentString}${name}: ${printType(variable.type)}\n`

	return o
}

export function printType(type: Type): string {
	switch (type.kind) {
		case TypeKind.Null:
			return `null`

		case TypeKind.True:
			return `true`

		case TypeKind.False:
			return `false`

		case TypeKind.UnsignedInteger:
			return `u${type.bits}`

		case TypeKind.SignedInteger:
			return `i${type.bits}`

		case TypeKind.Float16:
			return `f16`

		case TypeKind.Float32:
			return `f32`

		case TypeKind.Float64:
			return `f64`

		case TypeKind.Float128:
			return `f128`

		case TypeKind.Union:
			return type.members.map(type => printType(type)).join(` | `)

		case TypeKind.Object:
			return `{ ${[ ...type.properties ].map(([ name, type ]) => `${name}: ${printType(type)}`).join(`, `)} }`

		case TypeKind.Function:
			return `(${[ ...type.parameters ].map(type => printType(type)).join(`, `)}): ${printType(type.returnType)}`
	}
}
