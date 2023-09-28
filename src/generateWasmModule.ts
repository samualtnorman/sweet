/* eslint-disable unicorn/no-null */
import { assert, ensure } from "@samual/lib/assert"
import binaryen from "binaryen"
import { ExpressionTag, type Expression } from "./parse"

enum ReferenceKind { LocalLet, LocalConst, GlobalLet, GlobalConst, Function }

type Reference =
	{ kind: ReferenceKind.LocalLet | ReferenceKind.LocalConst, index: number, type: number } |
	{ kind: ReferenceKind.GlobalLet | ReferenceKind.GlobalConst, type: number } |
	{ kind: ReferenceKind.Function, returnType: number }

export type Context = { locals: number[], references: Map<string, Reference> }

export const generateWasmModule = (expressions: Expression[]) => {
	const module = new binaryen.Module()

	const generateWASMExpression = (expression: Expression, context: Context): number => {
		switch (expression.kind) {
			case ExpressionTag.Return:
				return module.return(expression.expression && generateWASMExpression(expression.expression, context))

			case ExpressionTag.Add:
				throw Error(`+ operator not implemented`)

			case ExpressionTag.Identifier: {
				const reference = ensure(context.references.get(expression.name), `no variable "${expression.name}"`)

				switch (reference.kind) {
					case ReferenceKind.LocalLet:
					case ReferenceKind.LocalConst:
						return module.local.get(reference.index, reference.type)

					case ReferenceKind.GlobalLet:
					case ReferenceKind.GlobalConst:
						return module.global.get(expression.name, reference.type)

					case ReferenceKind.Function:
						throw Error(HERE)
				}
			}

			case ExpressionTag.Let: {
				assert(expression.type, HERE)
				assert(expression.type.kind == ExpressionTag.SignedIntegerType, HERE)
				assert(expression.type.bits == 32, HERE)
				assert(expression.binding.kind == ExpressionTag.Identifier, HERE)

				const index = context.locals.push(binaryen.i32)

				context.references.set(
					expression.binding.name,
					{ kind: ReferenceKind.LocalLet, index, type: binaryen.i32 }
				)

				if (expression.initialValue)
					return module.local.set(index, generateWASMExpression(expression.initialValue, context))

				return module.nop()
			}

			case ExpressionTag.UnsignedIntegerLiteral:
				return module.i32.const(Number(expression.value))

			case ExpressionTag.While: {
				return module.loop(
					`loop`,
					module.if(
						generateWASMExpression(expression.condition, context),
						module.block(
							null,
							[
								...expression.body.map(expression => generateWASMExpression(expression, context)),
								module.br(`loop`)
							]
						)
					)
				)
			}

			case ExpressionTag.WrappingAdd: {
				return module.i32.add(
					generateWASMExpression(expression.left, context),
					generateWASMExpression(expression.right, context)
				)
			}

			case ExpressionTag.NormalAssign: {
				assert(expression.binding.kind == ExpressionTag.Identifier, HERE)

				const reference = ensure(context.references.get(expression.binding.name), HERE)

				switch (reference.kind) {
					case ReferenceKind.LocalLet:
					case ReferenceKind.LocalConst:
						return module.local.set(reference.index, generateWASMExpression(expression.value, context))

					case ReferenceKind.GlobalLet:
					case ReferenceKind.GlobalConst:
						return module.global.set(expression.binding.name, generateWASMExpression(expression.value, context))

					case ReferenceKind.Function:
						throw Error(HERE)
				}
			}

			case ExpressionTag.Decrement: {
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
						throw Error(HERE)
				}
			}

			case ExpressionTag.Increment: {
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
						throw Error(HERE)
				}
			}

			case ExpressionTag.Function: {
				assert(expression.returnType, HERE)
				assert(expression.parameterType, HERE)
				assert(expression.parameter.kind == ExpressionTag.Identifier, HERE)

				const returnType = evaluateType(expression.returnType)
				const type = evaluateType(expression.parameterType)

				context.references.set(expression.name, { kind: ReferenceKind.Function, returnType })
				context.references.set(expression.parameter.name, { kind: ReferenceKind.LocalLet, index: 0, type })

				const locals: number[] = []

				module.addFunction(
					expression.name,
					binaryen.createType([ type ]),
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

			// case ExpressionKind.DeclaredFunction: {
			// 	const returnType = evaluateType(ensure(expression.returnType, HERE))

			// 	module.addFunctionImport(
			// 		expression.name,
			// 		`_`,
			// 		expression.name,
			// 		binaryen.createType(expression.parameters.map(({ type }) => evaluateType(ensure(type, HERE)))),
			// 		returnType
			// 	)

			// 	context.references.set(
			// 		expression.name,
			// 		{ kind: ReferenceKind.Function, returnType }
			// 	)

			// 	return module.nop()
			// }

			// case ExpressionKind.Call: {
			// 	const reference = ensure(context.references.get(expression.callable), `no function "${expression.callable}"`)

			// 	assert(reference.kind == ReferenceKind.Function, HERE)

			// 	return module.call(
			// 		expression.callable,
			// 		expression.arguments.map(expression => generateWASMExpression(expression, context)),
			// 		reference.returnType
			// 	)
			// }

			case ExpressionTag.WrappingTimes: {
				return module.i32.mul(
					generateWASMExpression(expression.left, context),
					generateWASMExpression(expression.right, context)
				)
			}

			default:
				throw Error(`${HERE} ${ExpressionTag[expression.kind]}`)
		}
	}

	const context: Context = { locals: [], references: new Map() }

	module.setStart(
		module.addFunction(
			`main`,
			binaryen.none,
			binaryen.none,
			[],
			module.block(
				null,
				expressions.map(expression => {
					if (expression.kind == ExpressionTag.Let) {
						assert(expression.type, HERE)
						assert(expression.binding.kind == ExpressionTag.Identifier, HERE)

						const type = evaluateType(expression.type)

						module.addGlobal(expression.binding.name, type, true, module.i32.const(0))
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

export default generateWasmModule

export const evaluateType = (expression: Expression) => {
	switch (expression.kind) {
		case ExpressionTag.SignedIntegerType: {
			assert(expression.bits == 32, HERE)

			return binaryen.i32
		}

		case ExpressionTag.Null:
			return binaryen.none

		default:
			throw Error(`${HERE} ${ExpressionTag[expression.kind]}`)
	}
}

export const scopeContext = ({ locals, references }: Context) => {
	return {
		locals,
		references: new Map(references)
	}
}
