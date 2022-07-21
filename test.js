import { readFile } from "fs/promises"
import generateWASMModule from "./dist/generateWASMModule.js"
import { parse, tokenise } from "./dist/index.js"
import { printNodes } from "./dist/printNode.js"


try {
	const sourceCode = await readFile(`test.sw`, { encoding: `utf-8` })

	console.log(sourceCode)

	const tokens = [ ...tokenise(sourceCode) ]
	const expressions = [ ...parse(tokens) ]

	// console.log(printNodes(expressions, `    `))

	const binaryenModule = generateWASMModule(expressions)

	console.log(binaryenModule.emitText())

	const module = new WebAssembly.Module(binaryenModule.emitBinary())

	const { generateFibonacciNumber } = /** @type {*} */ (new WebAssembly.Instance(module).exports)

	console.log(generateFibonacciNumber(7))
} catch (error) {
	console.error(error)
}
