import { assert } from "@samual/lib"
import { execFile as executeFile_ } from "child_process"
import { readFile, writeFile } from "fs/promises"
import { promisify } from "util"
import generateWASMModule from "./generateWASMModule"
// import passExpressions, { createContext, printContext, Type } from "./generateWASMModule/passExpressions"
import parse from "./parse"
import { printNodes } from "./printNodes"
import tokenise from "./tokenise"

const executeFile = promisify(executeFile_)

const source = await readFile(`src/test.ul`, { encoding: `utf-8` })
const nodes = [ ...parse([ ...tokenise(source) ]) ]

console.log(`\nnodes:`)
console.log(printNodes(nodes, `    `))
console.log(`\ncontext:`)

// const context = createContext()

// passExpressions(nodes, context)
// console.log(printContext(context))
console.log(`\nnodes:`)
console.log(printNodes(nodes, `    `))


// const module = generateWASMModule(nodes)

// console.log(printNodes(nodes, `    `))

// await writeFile(`./test.wasm`, new Uint8Array(module))

// console.log((await executeFile(`wasm2wat`, [ `test.wasm` ])).stdout)

// const wasmModule = new WebAssembly.Module(new Uint8Array(module))
// const { add } = new WebAssembly.Instance(wasmModule).exports

// assert(typeof add == `function`)
// console.log(add(1, 2))
