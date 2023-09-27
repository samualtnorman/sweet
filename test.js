import chalk from "chalk"
import { readdirSync as readDirectorySync } from "fs"
import { readFile } from "fs/promises"
import parse from "./dist/parse.js"
import { printExpressions } from "./dist/printExpression.js"
import tokenise, { TokenKind } from "./dist/tokenise.js"
import typeCheck from "./dist/typeCheck.js"

// for (const testFileName of readDirectorySync(`test`)) {
// 	const testPath = `test/${testFileName}`

// 	readFile(testPath, { encoding: `utf-8` })
// 		.then(sourceCode => {
// 			const expressions = [ ...parse([...tokenise(sourceCode)]) ]

// 			console.log(chalk.green(`${testPath} passed:`))
// 			console.log(printExpressions(expressions, `    `, 1))
// 		})
// 		.catch(error => {
// 			console.error(chalk.red(`error in ${testPath}:`))
// 			// console.error(error instanceof ParseError ? error.message : error)
// 			console.error(error)
// 			process.exitCode = 1
// 		})
// }

const fileName = `test.sw`
const sourceCode = await readFile(fileName, { encoding: `utf-8` })
const tokens = [ ...tokenise(sourceCode) ]

console.log(tokens.map(token => ({ ...token, kind: TokenKind[token.kind] })))

// const expressions = [ ...parse(tokens, fileName) ]

// console.log(printExpressions(expressions, `    `))
// typeCheck(expressions, fileName)
