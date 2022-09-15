import { isRecord } from "@samual/lib"
import { Expression, ExpressionKind } from "./parse"

export const printExpression = (node: Record<string, unknown>, indentString = `\t`, indentLevel = 0): string => {
	const { kind, ...nodeProperties } = node
	let o = ``

	if (typeof kind == `number`) {
		o += `${ExpressionKind[kind]}\n`
		indentLevel++
	}

	for (const [ name, value ] of Object.entries(nodeProperties)) {
		o += `${o && indentString.repeat(indentLevel)}${name}:`

		if (typeof value == `bigint`)
			o += ` ${value}n\n`
		else if (Array.isArray(value))
			o += `\n${printExpressions(value, indentString, indentLevel + 1)}`
		else if (isRecord(value))
			o += ` ${printExpression(value, indentString, indentLevel)}`
		else
			o += ` ${JSON.stringify(value)}\n`
	}

	return o
}

export default printExpression

export const printExpressions = (nodes: Expression[], indentString = `\t`, indentLevel = 0): string => {
	let o = ``

	for (const node of nodes)
		o += `${indentString.repeat(indentLevel)}${printExpression(node, indentString, indentLevel)}\n`

	return o
}
