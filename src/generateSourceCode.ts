import { Node, NodeKind } from "./parse"

export function generateSourceCode(nodes: Node[], indentString = `\t`, indentLevel = 0): string {
	let o = ``

	for (const node of nodes)
		o += `${generateSourceFromNode(node, indentString, indentLevel)}\n`

	return o
}

export default generateSourceCode

export function generateSourceFromNode(node: Node, indentString: string, indentLevel: number): string {
	switch (node.kind) {
		case NodeKind.Function: {
			const parameters = node.parameters.map(node => generateSourceFromNode(node, indentString, indentLevel)).join(`, `)
			const body = node.body.map(node => `${indentString.repeat(indentLevel + 1)}${generateSourceFromNode(node, indentString, indentLevel + 1)}\n`).join(``)

			if (node.returnType)
				return `function ${node.name}(${parameters}) ${generateSourceFromNode(node.returnType, indentString, indentLevel)}\n${body}`

			return `function ${node.name}(${parameters})\n${body}`
		}

		case NodeKind.Parameter: {
			if (node.type)
				return `${generateSourceFromNode(node.binding, indentString, indentLevel)}: ${generateSourceFromNode(node.type, indentString, indentLevel)}`

			return generateSourceFromNode(node.binding, indentString, indentLevel)
		}

		case NodeKind.Identifier:
			return node.name

		case NodeKind.UnsignedIntegerType:
			return `u${node.bits}`

		case NodeKind.SignedIntegerType:
			return `i${node.bits}`

		case NodeKind.Return: {
			if (node.expression)
				return `return ${generateSourceFromNode(node.expression, indentString, indentLevel)}`

			return `return`
		}

		case NodeKind.Add:
			return `(${generateSourceFromNode(node.left, indentString, indentLevel)} + ${generateSourceFromNode(node.right, indentString, indentLevel)})`

		case NodeKind.UnsignedIntegerLiteral:
			return `${node.value}u${node.bits}`

		case NodeKind.To:
			return `(${generateSourceFromNode(node.left, indentString, indentLevel)} to ${generateSourceFromNode(node.right, indentString, indentLevel)})`

		case NodeKind.SignedIntegerLiteral:
			return `${node.value}i${node.bits}`

		case NodeKind.As:
			return `(${generateSourceFromNode(node.left, indentString, indentLevel)} as ${generateSourceFromNode(node.right, indentString, indentLevel)})`

		case NodeKind.Divide:
			return `(${generateSourceFromNode(node.left, indentString, indentLevel)} / ${generateSourceFromNode(node.right, indentString, indentLevel)})`

		case NodeKind.MinusPrefix:
			return `(-${generateSourceFromNode(node.expression, indentString, indentLevel)})`

		case NodeKind.Call: {
			const arguments_ = node.arguments.map(node => generateSourceFromNode(node, indentString, indentLevel)).join(`, `)

			return `${node.name}(${arguments_})`
		}

		case NodeKind.Times:
			return `(${generateSourceFromNode(node.left, indentString, indentLevel)} * ${generateSourceFromNode(node.right, indentString, indentLevel)})`

		case NodeKind.Float64Type:
			return `f64`

		case NodeKind.Minus:
			return `(${generateSourceFromNode(node.left, indentString, indentLevel)} - ${generateSourceFromNode(node.right, indentString, indentLevel)})`

		case NodeKind.Float64Literal:
			return `${node.value}f64`

		case NodeKind.Null:
			return `null`

		case NodeKind.VariableDeclaration: {
			if (node.type) {
				const type = generateSourceFromNode(node.type, indentString, indentLevel)

				if (node.initialValue)
					return `let ${node.binding.name}: ${type} = ${generateSourceFromNode(node.initialValue, indentString, indentLevel)}`

				return `let ${node.binding.name}: ${type}`
			}

			if (node.initialValue)
				return `let ${node.binding.name} = ${generateSourceFromNode(node.initialValue, indentString, indentLevel)}`

			return `let ${node.binding.name}`
		}

		case NodeKind.While: {
			return `while ${generateSourceFromNode(node.condition, indentString, indentLevel)} ${generateSourceFromNode(node.body, indentString, indentLevel)}`
		}

		case NodeKind.Block:
			return `(\n${node.body.map(node => `${indentString.repeat(indentLevel + 1)}${generateSourceFromNode(node, indentString, indentLevel + 1)}\n`).join(``)}${indentString.repeat(indentLevel)})`

		case NodeKind.WrappingAdd:
			return `(${generateSourceFromNode(node.left, indentString, indentLevel)} +% ${generateSourceFromNode(node.right, indentString, indentLevel)})`

		case NodeKind.Assignment:
			return `${generateSourceFromNode(node.binding, indentString, indentLevel)} = ${generateSourceFromNode(node.value, indentString, indentLevel)}`

		case NodeKind.Decrement:
			return `${generateSourceFromNode(node.binding, indentString, indentLevel)}--`

		case NodeKind.NotEqual:
			return `(${generateSourceFromNode(node.left, indentString, indentLevel)} != ${generateSourceFromNode(node.right, indentString, indentLevel)})`

		default:
			throw new Error(`${HERE} ${NodeKind[node.kind]}`)
	}
}
