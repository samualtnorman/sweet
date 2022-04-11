import { Node } from "./parse"

export function* traverse(node: Node | Node[]): Generator<Node, void> {
	if (Array.isArray(node)) {
		for (const childNode of node) {
			yield childNode
			yield* traverse(childNode)
		}

		return
	}

	const { type, ...nodeProperties } = node

	for (const node of Object.values(nodeProperties)) {
		if (Array.isArray(node))
			yield* traverse(node)
		else if (typeof node == `object`) {
			yield node
			yield* traverse(node)
		}
	}
}

export default traverse
