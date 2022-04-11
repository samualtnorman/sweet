import { Node, NodeType } from "./parse"

export enum IRType {
	I32,
	I64,
	F32,
	F64
}

export enum TypeType {
	SignedInteger = 1,
	UnsignedInteger,
	Float16,
	Float32,
	Float64,
	Float128,
	Null,
	Object,
	Union
}

export namespace Type {
	export type SignedInteger = { type: TypeType.SignedInteger, bits: number }
	export type UnsignedInteger = { type: TypeType.UnsignedInteger, bits: number }
	export type Float16 = { type: TypeType.Float16 }
	export type Float32 = { type: TypeType.Float32 }
	export type Float64 = { type: TypeType.Float64 }
	export type Float128 = { type: TypeType.Float128 }
	export type Null = { type: TypeType.Null }
	export type Object = { type: TypeType.Object, properties: Map<string, Type> }

	export type Union = {
		type: TypeType.Union
		// eslint-disable-next-line @typescript-eslint/ban-types
		members: (SignedInteger | UnsignedInteger | Float16 | Float32 | Float64 | Float128 | Null | Object)[]
	}
}

export type Type = Type.SignedInteger
	| Type.UnsignedInteger
	| Type.Float16
	| Type.Float32
	| Type.Float64
	| Type.Float128
	| Type.Null
	| Type.Object
	| Type.Union

export type Context = {
	variables: Map<string, { type: Type | undefined, isDefined: boolean }>
}

// export function generateIR(expressions: Node.Expression[]) {
// 	for (const expression of expressions)
// 		evaluateExpressionType(expression, context)
// }

// export default generateIR

export function evaluateExpressionType(expression: Node.Expression, context: Context): Type {
	switch (expression.type) {
		case NodeType.Function: {
			const functionContext = cloneContext(context)

			for (const parameter of expression.parameters) {
				functionContext.variables.set(parameter.name, {
					type: parameter.parameterType && evaluateExpression(parameter.parameterType, functionContext),
					isDefined: true
				})
			}

			let returnType

			if (expression.returnType) {

			}

			return { type: TypeType.Null }
		}

		default:
			throw new Error(`${HERE} ${NodeType[expression.type]}`)
	}
}

export function evaluateExpression(expression: Node, context: Context): Type {
	switch (expression.type) {
		case NodeType.SignedIntegerType:
			return { type: TypeType.SignedInteger, bits: expression.bits }

		case NodeType.UnsignedIntegerType:
			return { type: TypeType.UnsignedInteger, bits: expression.bits }

		case NodeType.Float16Type:
			return { type: TypeType.Float16 }

		case NodeType.Float32Type:
			return { type: TypeType.Float32 }

		case NodeType.Float64Type:
			return { type: TypeType.Float64 }

		case NodeType.Float128Type:
			return { type: TypeType.Float128 }

		case NodeType.Null:
			return { type: TypeType.Null }

		case NodeType.Or: {
			const leftEvaluated = evaluateExpression(expression.left, context)
			const rightEvaluated = evaluateExpression(expression.right, context)

			if (leftEvaluated.type == TypeType.Union) {
				if (rightEvaluated.type == TypeType.Union)
					leftEvaluated.members.push(...rightEvaluated.members)
				else
					leftEvaluated.members.push(rightEvaluated)

				return leftEvaluated
			}

			if (rightEvaluated.type == TypeType.Union) {
				rightEvaluated.members.push(leftEvaluated)

				return rightEvaluated
			}

			return { type: TypeType.Union, members: [ leftEvaluated, rightEvaluated ] }
		}

		default:
			throw new Error(`${HERE} ${NodeType[expression.type]}`)
	}
}

export function createContext(): Context {
	return { variables: new Map() }
}

export function cloneContext(context: Context): Context {
	return { variables: new Map(context.variables) }
}
