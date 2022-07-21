import { readFile } from "fs/promises"
import generateWASMModule from "./dist/generateWASMModule.js"
import { parse, tokenise } from "./dist/index.js"
import { printNodes } from "./dist/printNode.js"
import { printToken } from "./dist/tokenise.js"

try {
	const sourceCode = await readFile(`test.sw`, { encoding: `utf-8` })
	const tokens = [ ...tokenise(sourceCode) ]

	console.log(tokens.map(token => printToken(token)).join(`\n`))

	const expressions = [ ...parse(tokens) ]

	console.log(printNodes(expressions, `    `))

	const binaryenModule = generateWASMModule(expressions)

	console.log(binaryenModule.emitText())

	const module = new WebAssembly.Module(binaryenModule.emitBinary())
	const { exports } = new WebAssembly.Instance(module, { _: { logI32: console.log } })

	console.log(exports)
} catch (error) {
	console.error(error)
}
