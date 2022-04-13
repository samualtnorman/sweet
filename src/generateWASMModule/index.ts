import { assert } from "@samual/lib"
import { Node, NodeKind } from "../parse"
import traverse from "../traverse"
import generateCodeFromExpression from "./generateCodeFromExpression"
import generateCodeSection from "./generateCodeSection"
import generateExportSection from "./generateExportSection"
import generateFunctionSection from "./generateFunctionSection"
import generateTypeSection from "./generateTypeSection"
import transformNode, { resolveTypes } from "./getNodeType"
import { Local, Opcode, Type, ValueType } from "./shared"

export function generateWASMModule(ast: Node.Statement[]): number[] {
	const types: Type[] = []
	const signatureIndexes = []
	const exports = []
	const wasmFunctions = []

	for (const node of traverse(ast)) {
		if (node.kind != NodeKind.Function)
			continue

		const instructions = []
		const locals: Local[] = []
		const parameters = []

		for (const parameter of node.parameters) {
			assert(parameter.type.kind == NodeKind.Identifier, `${HERE} unhandled node ${NodeKind[parameter.type.kind]}`)

			if (parameter.type.name == `i32`)
				parameters.push(ValueType.I32)
			else if (parameter.type.name == `i64`)
				parameters.push(ValueType.I64)
			else if (parameter.type.name == `f32`)
				parameters.push(ValueType.F32)
			else if (parameter.type.name == `f64`)
				parameters.push(ValueType.F64)
			else
				throw new Error(`${HERE} unhandled type ${parameter.type.name}`)
		}

		assert(node.returnType, HERE)
		assert(node.returnType.kind == NodeKind.Identifier, `${HERE} unhandled node ${NodeKind[node.returnType.kind]}`)

		let returnType

		if (node.returnType.name == `i32`)
			returnType = ValueType.I32
		else if (node.returnType.name == `i64`)
			returnType = ValueType.I64
		else if (node.returnType.name == `f32`)
			returnType = ValueType.F32
		else if (node.returnType.name == `f64`)
			returnType = ValueType.F64
		else
			throw new Error(`${HERE} unhandled type ${node.returnType.name}`)

		types.push({ type: ValueType.Function, parameters, result: [ returnType ] })

		for (const statement of node.body) {
			switch (statement.kind) {
				case NodeKind.Return: {
					assert(statement.expression, HERE)

					const expressionType = transformNode(statement.expression)

					assert(resolveTypes(expressionType, returnType) == returnType, `return expression type ${ValueType[expressionType]} isn't compatible with return type of function ${ValueType[returnType]}`)
					instructions.push(...generateCodeFromExpression(statement.expression), Opcode.Return)
				} break

				default:
					throw new Error(`${HERE} unhandled node type ${NodeKind[statement.kind]}`)
			}
		}

		signatureIndexes.push(signatureIndexes.length)
		exports.push({ name: node.name, functionIndex: exports.length })
		wasmFunctions.push({ instructions, locals })


	}

	return [
		// wasm magic
		0x00, 0x61, 0x73, 0x6D,

		// wasm version
		0x01, 0x00, 0x00, 0x00,

		...generateTypeSection(types),
		...generateFunctionSection(signatureIndexes),
		...generateExportSection(exports),
		...generateCodeSection(wasmFunctions)
	]
}

export default generateWASMModule
