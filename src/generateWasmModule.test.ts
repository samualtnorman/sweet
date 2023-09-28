import { test } from "vitest"
import { generateWasmModule } from "./generateWasmModule"
import parse from "./parse"
import tokenise from "./tokenise"

const source = `\
error tag OverflowError

function generateFibonacciNumber n: u -> u32 ? OverflowError
	let a: u32 = 0
	let b: u32 = 1

	while n
		let sum = a + b

		if sum > u32
			return OverflowError

		a = b
		b = sum
		n--

	return a
`

test(`doesn't throw`, () => {
	const { exports } = new WebAssembly.Instance(
		new WebAssembly.Module(generateWasmModule([ ...parse([ ...tokenise(source) ], `source`) ]).emitBinary())
	)

	console.log(exports)
})
