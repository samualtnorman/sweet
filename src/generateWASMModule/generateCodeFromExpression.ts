// import { Node, NodeKind } from "../parse"
// import { Opcode, toLEB128, ValueType } from "./shared"

// export function generateCodeFromExpression(node: Node.Expression): number[] {
// 	switch (node.kind) {
// 		case NodeKind.SignedIntegerLiteral:
// 			return [ Opcode.PushI64, ...toLEB128(node.value) ]

// 		case NodeKind.Float64Literal:
// 			return [ Opcode.PushF64, ...new Uint8Array(new Float64Array([ node.value ]).buffer) ]

// 		case NodeKind.Addition: {
// 			const type = transformNode(node)
// 			const code = [ ...generateCodeFromExpression(node.left), ...generateCodeFromExpression(node.right) ]

// 			switch (type) {
// 				case ValueType.I32: {
// 					code.push(Opcode.AddI32s)
// 				} break

// 				case ValueType.I64: {
// 					code.push(Opcode.AddI64s)
// 				} break

// 				case ValueType.F32: {
// 					code.push(Opcode.AddF32s)
// 				} break

// 				case ValueType.F64: {
// 					code.push(Opcode.AddF64s)
// 				} break

// 				default:
// 					throw new Error(`${HERE} unhandled type ${type}`)
// 			}

// 			return code
// 		}
// 	}

// 	throw new Error(`${HERE} unhandled node type ${NodeKind[node.kind]}`)
// }

// export default generateCodeFromExpression
