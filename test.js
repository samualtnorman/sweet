import { readdir as readDirectory, readFile } from "fs/promises"
import { parse, tokenise } from "./dist/index.js"
import chalk from "chalk"

(await readDirectory(`test`)).map(async testFileName => {
	const testPath = `test/${testFileName}`

	try {
		const sourceCode = await readFile(testPath, { encoding: `utf-8` })
		const tokens = [ ...tokenise(sourceCode) ]

		void [ ...parse(tokens) ]
	} catch (error) {
		console.error(chalk.red(`error in ${testPath}:`))
		console.error(error)

		return
	}

	console.log(chalk.green(`${testPath} passed`))
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
