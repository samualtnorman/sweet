import { Node, NodeKind } from "./parse"

export function printNode(node: Node, indentString = `\t`, indentLevel = 0): string {
	const { kind, ...nodeProperties } = node
	let o = `${NodeKind[kind]}\n`

	indentLevel++

	for (const [ name, value ] of Object.entries(nodeProperties)) {
		o += `${indentString.repeat(indentLevel)}${name}:`

		if (Array.isArray(value))
			o += `\n${printNodes(value, indentString, indentLevel + 1)}`
		else if (typeof value == `object`)
			o += ` ${printNode(value, indentString, indentLevel)}`
		else if (typeof value == `bigint`)
			o += ` ${value}n\n`
		else
			o += ` ${JSON.stringify(value)}\n`
	}

	return o
}

export default printNode

export function printNodes(nodes: Node[], indentString = `\t`, indentLevel = 0): string {
	let o = ``

	for (const node of nodes)
		o += `${indentString.repeat(indentLevel)}${printNode(node, indentString, indentLevel)}\n`

	return o
}
