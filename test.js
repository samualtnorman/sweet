/* eslint-disable unicorn/import-index */

import { readFile } from "fs/promises"
import generateSourceCode from "./dist/generateSourceCode.js"
import { parse, passExpressions, tokenise } from "./dist/index.js"
import { printNodes } from "./dist/printNode.js"

const source = await readFile(`test.sw`, { encoding: `utf-8` })
const nodes = [ ...parse([ ...tokenise(source) ]) ]

console.log(`\nast:`)
console.log(printNodes(nodes, `    `))
passExpressions(nodes)
console.log(`\nafter pass:`)
console.log(generateSourceCode(nodes, `    `))
