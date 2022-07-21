/* eslint-disable unicorn/no-null */
import { assert } from "@samual/lib"
import { ensure } from "@samual/lib/assert"
import binaryen from "binaryen"
import { Node, NodeKind } from "./parse"

enum ReferenceKind {
	LocalLet,
	LocalConst,
	GlobalLet,
	GlobalConst,
	Function
}

type Reference =
	{ kind: ReferenceKind.LocalLet | ReferenceKind.LocalConst, index: number, type: number } |
	{ kind: ReferenceKind.GlobalLet | ReferenceKind.GlobalConst, type: number } |
	{ kind: ReferenceKind.Function, returnType: number }

export type Context = {
	locals: number[]
	references: Map<string, Reference>
}

export const generateWASMModule = (expressions: Node.Expression[]) => {
	const module = new binaryen.Module()

	const generateWASMExpression = (expression: Node.Expression, context: Context): number => {
		switch (expression.kind) {
			case NodeKind.Return:
				return module.return(expression.expression && generateWASMExpression(expression.expression, context))

			case NodeKind.Add:
				throw new Error(`+ operator not implemented`)

			case NodeKind.Identifier: {
				const reference = ensure(context.references.get(expression.name), `no variable "${expression.name}"`)

				switch (reference.kind) {
					case ReferenceKind.LocalLet:
					case ReferenceKind.LocalConst:
						return module.local.get(reference.index, reference.type)

					case ReferenceKind.GlobalLet:
					case ReferenceKind.GlobalConst:
						return module.global.get(expression.name, reference.type)

					case ReferenceKind.Function:
						throw new Error(HERE)
				}
			}

			case NodeKind.VariableDeclaration: {
				assert(expression.type, HERE)
				assert(expression.type.kind == NodeKind.SignedIntegerType, HERE)
				assert(expression.type.bits == 32, HERE)

				const index = context.locals.push(binaryen.i32)

				context.references.set(
					expression.binding.name,
					{ kind: ReferenceKind.LocalLet, index, type: binaryen.i32 }
				)

				if (expression.initialValue)
					return module.local.set(index, generateWASMExpression(expression.initialValue, context))

				return module.nop()
			}

			case NodeKind.UnsignedIntegerLiteral:
				return module.i32.const(Number(expression.value))

			case NodeKind.While: {
				assert(expression.body.kind == NodeKind.Block, HERE)

				return module.loop(
					`loop`,
					module.if(
						generateWASMExpression(expression.condition, context),
						module.block(
							null,
							[
								...expression.body.body.map(expression => generateWASMExpression(expression, context)),
								module.br(`loop`)
							]
						)
					)
				)
			}

			case NodeKind.WrappingAdd: {
				return module.i32.add(
					generateWASMExpression(expression.left, context),
					generateWASMExpression(expression.right, context)
				)
			}

			case NodeKind.Assignment: {
				const reference = ensure(context.references.get(expression.binding.name), HERE)

				switch (reference.kind) {
					case ReferenceKind.LocalLet:
					case ReferenceKind.LocalConst:
						return module.local.set(reference.index, generateWASMExpression(expression.value, context))

					case ReferenceKind.GlobalLet:
					case ReferenceKind.GlobalConst:
						return module.global.set(expression.binding.name, generateWASMExpression(expression.value, context))

					case ReferenceKind.Function:
						throw new Error(HERE)
				}
			}

			case NodeKind.Decrement: {
				const reference = ensure(context.references.get(expression.binding.name), HERE)

				switch (reference.kind) {
					case ReferenceKind.LocalLet:
					case ReferenceKind.LocalConst: {
						return module.local.set(
							reference.index,
							module.i32.sub(
								module.local.get(reference.index, reference.type),
								module.i32.const(1)
							)
						)
					}

					case ReferenceKind.GlobalLet:
					case ReferenceKind.GlobalConst: {
						return module.global.set(
							expression.binding.name, module.i32.sub(
								module.global.get(expression.binding.name, reference.type),
								module.i32.const(1)
							)
						)
					}

					case ReferenceKind.Function:
						throw new Error(HERE)
				}
			}

			case NodeKind.Increment: {
				const reference = ensure(context.references.get(expression.binding.name), HERE)

				switch (reference.kind) {
					case ReferenceKind.LocalLet:
					case ReferenceKind.LocalConst: {
						return module.local.set(
							reference.index,
							module.i32.add(
								module.local.get(reference.index, reference.type),
								module.i32.const(1)
							)
						)
					}

					case ReferenceKind.GlobalLet:
					case ReferenceKind.GlobalConst: {
						return module.global.set(
							expression.binding.name, module.i32.add(
								module.global.get(expression.binding.name, reference.type),
								module.i32.const(1)
							)
						)
					}

					case ReferenceKind.Function:
						throw new Error(HERE)
				}
			}

			case NodeKind.Function: {
				const returnType = evaluateType(ensure(expression.returnType, HERE))

				context.references.set(expression.name, { kind: ReferenceKind.Function, returnType })

				const locals: number[] = []

				module.addFunction(
					expression.name,
					binaryen.createType(
						expression.parameters.map((parameter, index) => {
							const type = evaluateType(ensure(parameter.type, HERE))

							context.references.set(
								parameter.binding.name,
								{ kind: ReferenceKind.LocalLet, index, type }
							)

							return type
						})
					),
					returnType,
					locals,
					module.block(
						null,
						expression.body.map(expression => generateWASMExpression(expression, { ...context, locals }))
					)
				)

				module.addFunctionExport(expression.name, expression.name)

				return module.nop()
			}

			case NodeKind.DeclaredFunction: {
				const returnType = evaluateType(ensure(expression.returnType, HERE))

				module.addFunctionImport(
					expression.name,
					`_`,
					expression.name,
					binaryen.createType(expression.parameters.map(({ type }) => evaluateType(ensure(type, HERE)))),
					returnType
				)

				context.references.set(
					expression.name,
					{ kind: ReferenceKind.Function, returnType }
				)

				return module.nop()
			}

			case NodeKind.Call: {
				const reference = ensure(context.references.get(expression.name), `no function "${expression.name}"`)

				assert(reference.kind == ReferenceKind.Function, HERE)

				return module.call(
					expression.name,
					expression.arguments.map(expression => generateWASMExpression(expression, context)),
					reference.returnType
				)
			}

			case NodeKind.WrappingTimes: {
				return module.i32.mul(
					generateWASMExpression(expression.left, context),
					generateWASMExpression(expression.right, context)
				)
			}

			default:
				throw new Error(`${HERE} ${NodeKind[expression.kind]}`)
		}
	}

	const context: Context = {
		locals: [],
		references: new Map()
	}

	module.setStart(
		module.addFunction(
			`main`,
			binaryen.none,
			binaryen.none,
			[],
			module.block(
				null,
				expressions.map(expression => {
					if (expression.kind == NodeKind.VariableDeclaration) {
						const type = evaluateType(ensure(expression.type, HERE))

						module.addGlobal(
							expression.binding.name,
							type,
							true,
							module.i32.const(0)
						)

						module.addGlobalExport(expression.binding.name, expression.binding.name)
						context.references.set(expression.binding.name, { kind: ReferenceKind.GlobalLet, type })

						return module.global.set(
							expression.binding.name,
							generateWASMExpression(ensure(expression.initialValue, HERE), context)
						)
					}

					return generateWASMExpression(expression, context)
				})
			)
		)
	)

	return module
}

export default generateWASMModule

export const evaluateType = (expression: Node.Expression) => {
	switch (expression.kind) {
		case NodeKind.SignedIntegerType: {
			assert(expression.bits == 32, HERE)

			return binaryen.i32
		}

		case NodeKind.Null:
			return binaryen.none

		default:
			throw new Error(`${HERE} ${NodeKind[expression.kind]}`)
	}
}

export const scopeContext = ({ locals, references }: Context) => {
	return {
		locals,
		references: new Map(references)
	}
}
