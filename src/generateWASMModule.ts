/* eslint-disable unicorn/no-null */
import { assert } from "@samual/lib"
import { ensure } from "@samual/lib/assert"
import binaryen from "binaryen"
import { Node, NodeKind } from "./parse"

export const generateWASMModule = (expressions: Node.Expression[]) => {
	const module = new binaryen.Module()

	for (const expression of expressions) {
		switch (expression.kind) {
			case NodeKind.Function: {
				assert(expression.returnType, HERE)
				assert(expression.returnType.kind == NodeKind.SignedIntegerType, HERE)
				assert(expression.returnType.bits == 32, HERE)

				const variables = new Map<string, { index: number, type: number }>()

				const parameters = binaryen.createType(
					expression.parameters.map((parameter, index) => {
						assert(parameter.type, HERE)
						assert(parameter.type.kind == NodeKind.SignedIntegerType, HERE)
						assert(parameter.type.bits == 32, HERE)
						variables.set(parameter.binding.name, { index, type: binaryen.i32 })

						return binaryen.i32
					})
				)

				const locals: number[] = []

				const generateWASMExpression = (expression: Node.Expression): number => {
					switch (expression.kind) {
						case NodeKind.Return:
							return module.return(expression.expression && generateWASMExpression(expression.expression))

						case NodeKind.Add:
							return module.i32.add(generateWASMExpression(expression.left), generateWASMExpression(expression.right))

						case NodeKind.Identifier: {
							const { index, type } = ensure(variables.get(expression.name))

							return module.local.get(index, type)
						}

						case NodeKind.VariableDeclaration: {
							assert(expression.type, HERE)
							assert(expression.type.kind == NodeKind.SignedIntegerType, HERE)
							assert(expression.type.bits == 32, HERE)
							locals.push(binaryen.i32)

							const index = variables.size

							variables.set(expression.binding.name, { index, type: binaryen.i32 })

							if (expression.initialValue)
								return module.local.set(index, generateWASMExpression(expression.initialValue))

							return module.local.get(index, binaryen.i32)
						}

						case NodeKind.UnsignedIntegerLiteral:
							return module.i32.const(Number(expression.value))

						case NodeKind.While: {
							assert(expression.body.kind == NodeKind.Block, HERE)

							return module.loop(
								`loop`,
								module.if(
									generateWASMExpression(expression.condition),
									module.block(
										null,
										[
											...expression.body.body.map(expression => generateWASMExpression(expression)),
											module.br(`loop`)
										]
									)
								)
							)
						}

						case NodeKind.WrappingAdd: {
							return module.i32.add(
								generateWASMExpression(expression.left),
								generateWASMExpression(expression.right)
							)
						}

						case NodeKind.Assignment: {
							const { index } = ensure(variables.get(expression.binding.name))

							return module.local.set(index, generateWASMExpression(expression.value))
						}

						case NodeKind.Decrement: {
							const { index } = ensure(variables.get(expression.binding.name))

							return module.local.set(
								index,
								module.i32.sub(
									generateWASMExpression(expression.binding),
									module.i32.const(1)
								)
							)
						}

						default:
							throw new Error(`${HERE} ${NodeKind[expression.kind]}`)
					}
				}

				module.addFunction(
					expression.name,
					parameters,
					binaryen.i32,
					locals,
					module.block(
						null,
						expression.body.map(expression => generateWASMExpression(expression))
					)
				)

				module.addFunctionExport(expression.name, expression.name)
			} break

			default:
				throw new Error(`${HERE} ${NodeKind[expression.kind]}`)
		}
	}

	return module
}

export default generateWASMModule
