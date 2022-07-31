import { readdir as readDirectory, readFile } from "fs/promises"
import { parse, tokenise } from "./dist/index.js"
import chalk from "chalk"
import { ParseError } from "./dist/parse.js"
import { printNodes } from "./dist/printNode.js"

(await readDirectory(`test`)).sort().map(async testFileName => {
	const testPath = `test/${testFileName}`
	let nodes

	try {
		const sourceCode = await readFile(testPath, { encoding: `utf-8` })
		const tokens = [ ...tokenise(sourceCode) ]

		nodes = [ ...parse(tokens) ]
	} catch (error) {
		console.error(chalk.red(`error in ${testPath}:`))
		console.error(error instanceof ParseError ? error.message : error)
		process.exitCode = 1

		return
	}

	console.log(chalk.green(`${testPath} passed:`))
	console.log(printNodes(nodes, `    `, 1))
})

// const sourceCode = await readFile(`test.sw`, { encoding: `utf-8` })
// const tokens = [ ...tokenise(sourceCode) ]

// console.log(tokens.map(token => printToken(token)).join(`\n`))

// const expressions = [ ...parse(tokens) ]

// console.log(printNodes(expressions, `    `))

// const binaryenModule = generateWASMModule(expressions)

// console.log(binaryenModule.emitText())

// const module = new WebAssembly.Module(binaryenModule.emitBinary())
// const { exports } = new WebAssembly.Instance(module, { _: { logI32: console.log } })

// console.log(exports)
