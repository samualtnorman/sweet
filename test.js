import chalk from "chalk"
import { readdirSync as readDirectorySync } from "fs"
import { readFile } from "fs/promises"
import parse from "./dist/parse.js"
import { printExpressions } from "./dist/printExpression.js"
import tokenise from "./dist/tokenise.js"

for (const testFileName of readDirectorySync(`test`)) {
	const testPath = `test/${testFileName}`

	readFile(testPath, { encoding: `utf-8` })
		.then(sourceCode => {
			const expressions = [ ...parse([...tokenise(sourceCode)]) ]

			console.log(chalk.green(`${testPath} passed:`))
			console.log(printExpressions(expressions, `    `, 1))
		})
		.catch(error => {
			console.error(chalk.red(`error in ${testPath}:`))
			// console.error(error instanceof ParseError ? error.message : error)
			console.error(error)
			process.exitCode = 1
		})
}

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
