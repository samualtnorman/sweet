import { Opcode, ValueType } from "./shared"
import { Node, NodeType } from "../parse"
import { assert } from "console"

type Context<T extends Node> = {
	node: T
	parent: Node
	type: ValueType

	properties: {
		[Key in Exclude<keyof T, `type`>]:
			T[Key] extends Node[]
				? Context<T[Key][0]>[]
			: T[Key] extends Node
				? Context<T[Key]>
			: T[Key] extends Node | undefined
				? Context<NonNullable<T[Key]>> | undefined
				: T[Key]
	}
}


export function transformNode(node: Node): ValueType {
	switch (node.type) {
		case NodeType.Integer: {
			if (node.value > MAX_I32 || node.value < MIN_I32)
				return ValueType.I64

			return ValueType.I32
		}

		case NodeType.Float:
			return ValueType.F64

		case NodeType.Addition: {
			const leftType = transformNode(node.left)
			const rightType = transformNode(node.right)
			const resolvedType = resolveTypes(leftType, rightType)

			node.left = wrapExpression(node.left, leftType, resolvedType)
			node.right = wrapExpression(node.right, rightType, resolvedType)

			return resolvedType
		}
	}

	throw new Error(`${HERE} unhandled node type ${NodeType[node.type]}`)
}

export default transformNode

export function wrapExpression(expression: Node.Expression, currentType: ValueType, targetType: ValueType) {
	if (currentType == targetType)
		return expression

	const instructions: number[] = []
	const wrapperExpression: Node.Expression = { type: NodeType.RawInstructions, expression, instructions }

	switch (currentType) {
		case ValueType.I32: {
			switch (targetType) {
				case ValueType.I64: {
					instructions.push(Opcode.I32ToI64)
				} break

				case ValueType.F32: {
					instructions.push(Opcode.I32ToF32)
				} break

				case ValueType.F64: {
					instructions.push(Opcode.I32ToF64)
				} break
			}
		} break

		case ValueType.I64: {
			switch (targetType) {
				case ValueType.I32: {
					instructions.push(Opcode.I64ToI32)
				} break

				case ValueType.F32: {
					instructions.push(Opcode.I64ToF32)
				} break

				case ValueType.F64: {
					instructions.push(Opcode.I64ToF64)
				} break
			}
		} break

		case ValueType.F32: {
			switch (targetType) {
				case ValueType.I32: {
					instructions.push(Opcode.F32ToI32)
				} break

				case ValueType.I64: {
					instructions.push(Opcode.F32ToI64)
				} break

				case ValueType.F64: {
					instructions.push(Opcode.F32ToF64)
				} break
			}
		} break

		case ValueType.F64: {
			switch (targetType) {
				case ValueType.I32: {
					instructions.push(Opcode.F64ToI32)
				} break

				case ValueType.I64: {
					instructions.push(Opcode.F64ToI64)
				} break

				case ValueType.F32: {
					instructions.push(Opcode.F64ToF32)
				} break
			}
		} break
	}

	return wrapperExpression
}

export function resolveTypes(...types: ValueType[]): ValueType {
	const typeSet = new Set(types)

	if (typeSet.has(ValueType.F64)) {
		assert(!typeSet.has(ValueType.I64), `f64 and i64 are not compatible`)

		return ValueType.F64
	}

	if (typeSet.has(ValueType.F32)) {
		assert(!typeSet.has(ValueType.I32), `f32 and i32 are not compatible`)
		assert(!typeSet.has(ValueType.I64), `f32 and i64 are not compatible`)

		return ValueType.F32
	}

	if (typeSet.has(ValueType.I64))
		return ValueType.I64

	return ValueType.I32
}
