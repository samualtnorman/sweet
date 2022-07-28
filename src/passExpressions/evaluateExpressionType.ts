import { assert } from "@samual/lib"
import { assertTypesAreCompatible, Context, printContext, Type, TypeKind } from "."
import { generateSourceFromNode } from "../generateSourceCode"
import { Node, NodeKind } from "../parse"
import castExpression from "./castExpression"
import evaluateExpression from "./evaluateExpression"
import passExpressions from "./passExpressions"
import resolveTypes from "./resolveTypes"

const DEBUG = false

export function evaluateExpressionType(expression: Node.Expression, context: Context): Type {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (DEBUG) {
		console.log(`DEBUG evaluateExpressionType(
    ${generateSourceFromNode(expression, `    `, 1)},
    ${printContext(context, `    `).trimEnd()}
)\n`)
	}

	switch (expression.kind) {
		case NodeKind.Function: {
			assert(!context.variables.has(expression.name), `redeclaration of ${expression.name}()`)

			const parameters = []
			const functionContext = { ...context, variables: new Map(context.variables) }

			for (const parameter of expression.parameters) {
				assert(parameter.type, HERE)

				const type = evaluateExpression(parameter.type, functionContext)

				functionContext.variables.set(parameter.binding.name, { type, isDefined: true })
				parameters.push(type)
			}

			context.variables.set(expression.name, {
				type: {
					kind: TypeKind.Function,
					parameters,
					returnType: expression.returnType ? evaluateExpression(expression.returnType, context) : { kind: TypeKind.Union, members: [] }
				},
				isDefined: true
			})

			passExpressions(expression.body, functionContext)

			return { kind: TypeKind.Null }
		}

		case NodeKind.Return: {
			expression.expression = castExpression(
				expression.expression || { kind: NodeKind.Null },
				context.returnType,
				context
			)

			return { kind: TypeKind.Null }
		}

		case NodeKind.Identifier: {
			assert(context.variables.has(expression.name), `undeclared variable "${expression.name}"`)

			const variable = context.variables.get(expression.name)!

			assert(variable.isDefined, `undefined variable "${expression.name}"`)

			return variable.type
		}

		case NodeKind.Null:
			return { kind: TypeKind.Null }

		case NodeKind.UnsignedIntegerLiteral:
			return { kind: TypeKind.UnsignedInteger, bits: expression.bits }

		case NodeKind.Void: {
			evaluateExpressionType(expression.expression, context)

			return { kind: TypeKind.Null }
		}

		case NodeKind.Add: {
			const resolvedType = resolveTypes(
				evaluateExpressionType(expression.left, context),
				evaluateExpressionType(expression.right, context)
			)

			expression.left = castExpression(expression.left, resolvedType, context)
			expression.right = castExpression(expression.right, resolvedType, context)

			if (resolvedType.kind == TypeKind.UnsignedInteger || resolvedType.kind == TypeKind.SignedInteger)
				resolvedType.bits++

			return resolvedType
		}

		case NodeKind.To:
		case NodeKind.As: {
			const castType = evaluateExpression(expression.right, context)

			assertTypesAreCompatible(evaluateExpressionType(expression.left, context), castType)

			return castType
		}

		case NodeKind.Divide: {
			const resolvedType = resolveTypes(
				evaluateExpressionType(expression.left, context),
				evaluateExpressionType(expression.right, context)
			)

			expression.left = castExpression(expression.left, resolvedType, context)
			expression.right = castExpression(expression.right, resolvedType, context)

			return resolvedType
		}

		case NodeKind.MinusPrefix: {
			const type = evaluateExpressionType(expression.expression, context)

			expression.expression = castExpression(expression.expression, type, context)

			return type
		}

		case NodeKind.Call: {
			assert(context.variables.has(expression.callable), `undeclared function "${expression.callable}"`)

			const variable = context.variables.get(expression.callable)!

			assert(variable.type.kind == TypeKind.Function, `variable ${expression.callable} is not a function`)
			assert(variable.isDefined, `undefined function "${expression.callable}"`)
			assert(variable.type.parameters.length == expression.arguments.length, `number of arguments did not match to call ${expression.callable}()`)

			for (const [ index, type ] of variable.type.parameters.entries())
				expression.arguments[index] = castExpression(expression.arguments[index]!, type, context)

			return variable.type.returnType
		}

		case NodeKind.Times: {
			const resolvedType = resolveTypes(
				evaluateExpressionType(expression.left, context),
				evaluateExpressionType(expression.right, context)
			)

			expression.left = castExpression(expression.left, resolvedType, context)
			expression.right = castExpression(expression.right, resolvedType, context)

			if (resolvedType.kind == TypeKind.UnsignedInteger || resolvedType.kind == TypeKind.SignedInteger)
				resolvedType.bits *= 2

			return resolvedType
		}

		case NodeKind.SignedIntegerLiteral:
			return { kind: TypeKind.SignedInteger, bits: expression.bits }

		case NodeKind.Minus: {
			const resolvedType = resolveTypes(
				evaluateExpressionType(expression.left, context),
				evaluateExpressionType(expression.right, context)
			)

			expression.left = castExpression(expression.left, resolvedType, context)
			expression.right = castExpression(expression.right, resolvedType, context)

			return resolvedType
		}

		case NodeKind.Float64Literal:
			return { kind: TypeKind.Float64 }

		case NodeKind.Let: {
			assert(expression.type, HERE)
			assert(expression.initialValue, HERE)

			const type = evaluateExpression(expression.type, context)

			expression.initialValue = castExpression(expression.initialValue, type, context)
			context.variables.set(expression.binding.name, { type, isDefined: true })

			return { kind: TypeKind.Null }
		}

		case NodeKind.While: {
			// { kind: TypeKind.Union, members: [ { kind: TypeKind.True }, { kind: TypeKind.False } ] }

			const conditionType = evaluateExpressionType(expression.condition, context)

			if (conditionType.kind == TypeKind.UnsignedInteger) {
				expression.condition = {
					kind: NodeKind.NotEqual,
					left: expression.condition,
					right: { kind: NodeKind.UnsignedIntegerLiteral, value: 0n, bits: conditionType.bits }
				}
			}

			// expression.condition = castExpression(expression.condition, { kind: TypeKind.Union, members: [ { kind: TypeKind.True }, { kind: TypeKind.False } ] }, context)

			return evaluateExpressionType(expression.body, context)
		}

		case NodeKind.Block: {
			passExpressions(expression.body, context)

			return { kind: TypeKind.Null }
		}

		case NodeKind.WrappingAdd: {
			const resolvedType = resolveTypes(
				evaluateExpressionType(expression.left, context),
				evaluateExpressionType(expression.right, context)
			)

			expression.left = castExpression(expression.left, resolvedType, context)
			expression.right = castExpression(expression.right, resolvedType, context)

			return resolvedType
		}

		case NodeKind.Assignment: {
			assert(context.variables.has(expression.binding.name), HERE)

			const variable = context.variables.get(expression.binding.name)!

			expression.value = castExpression(expression.value, variable.type, context)
			variable.isDefined = true

			return { kind: TypeKind.Null }
		}

		case NodeKind.Decrement: {
			return { kind: TypeKind.Null }
		}

		// case NodeKind.NotEqual: {
		// 	return { kind: TypeKind.Union, members: [ { kind: TypeKind.True }, { kind: TypeKind.False } ] }
		// }

		default:
			throw new Error(`${HERE} ${NodeKind[expression.kind]}`)
	}
}

export default evaluateExpressionType
