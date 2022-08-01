/* eslint-disable unicorn/no-null */
import { assert } from "@samual/lib"
import { ensure } from "@samual/lib/assert"
import binaryen from "binaryen"
import { Expression, ExpressionKind } from "./parse"

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

export const generateWASMModule = (expressions: Expression.Expression[]) => {
	const module = new binaryen.Module()

	const generateWASMExpression = (expression: Expression.Expression, context: Context): number => {
		switch (expression.kind) {
			case ExpressionKind.Return:
				return module.return(expression.expression && generateWASMExpression(expression.expression, context))

			case ExpressionKind.Add:
				throw new Error(`+ operator not implemented`)

			case ExpressionKind.Identifier: {
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

			case ExpressionKind.Let: {
				assert(expression.type, HERE)
				assert(expression.type.kind == ExpressionKind.SignedIntegerType, HERE)
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

			case ExpressionKind.UnsignedIntegerLiteral:
				return module.i32.const(Number(expression.value))

			case ExpressionKind.While: {
				assert(expression.body.kind == ExpressionKind.Do, HERE)

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

			case ExpressionKind.WrappingAdd: {
				return module.i32.add(
					generateWASMExpression(expression.left, context),
					generateWASMExpression(expression.right, context)
				)
			}

			case ExpressionKind.Assignment: {
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

			case ExpressionKind.Decrement: {
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

			case ExpressionKind.Increment: {
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

			case ExpressionKind.Function: {
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

			case ExpressionKind.DeclaredFunction: {
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

			case ExpressionKind.Call: {
				const reference = ensure(context.references.get(expression.callable), `no function "${expression.callable}"`)

				assert(reference.kind == ReferenceKind.Function, HERE)

				return module.call(
					expression.callable,
					expression.arguments.map(expression => generateWASMExpression(expression, context)),
					reference.returnType
				)
			}

			case ExpressionKind.WrappingTimes: {
				return module.i32.mul(
					generateWASMExpression(expression.left, context),
					generateWASMExpression(expression.right, context)
				)
			}

			default:
				throw new Error(`${HERE} ${ExpressionKind[expression.kind]}`)
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
					if (expression.kind == ExpressionKind.Let) {
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

export const evaluateType = (expression: Expression.Expression) => {
	switch (expression.kind) {
		case ExpressionKind.SignedIntegerType: {
			assert(expression.bits == 32, HERE)

			return binaryen.i32
		}

		case ExpressionKind.Null:
			return binaryen.none

		default:
			throw new Error(`${HERE} ${ExpressionKind[expression.kind]}`)
	}
}

export const scopeContext = ({ locals, references }: Context) => {
	return {
		locals,
		references: new Map(references)
	}
}
