import { Node, NodeType } from "../parse"
import { Opcode, toLEB128, ValueType } from "./shared"
import { transformNode } from "./getNodeType"

export function generateCodeFromExpression(node: Node.Expression): number[] {
	switch (node.type) {
		case NodeType.Integer:
			return [ Opcode.PushI64, ...toLEB128(node.value) ]

		case NodeType.Float:
			return [ Opcode.PushF64, ...new Uint8Array(new Float64Array([ node.value ]).buffer) ]

		case NodeType.Addition: {
			const type = transformNode(node)
			const code = [ ...generateCodeFromExpression(node.left), ...generateCodeFromExpression(node.right) ]

			switch (type) {
				case ValueType.I32: {
					code.push(Opcode.AddI32s)
				} break

				case ValueType.I64: {
					code.push(Opcode.AddI64s)
				} break

				case ValueType.F32: {
					code.push(Opcode.AddF32s)
				} break

				case ValueType.F64: {
					code.push(Opcode.AddF64s)
				} break

				default:
					throw new Error(`${HERE} unhandled type ${type}`)
			}

			return code
		}
	}

	throw new Error(`${HERE} unhandled node type ${NodeType[node.type]}`)
}

export default generateCodeFromExpression
