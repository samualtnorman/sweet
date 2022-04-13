import { assert } from "@samual/lib"
import { Node, NodeKind } from "../parse"
import printNode from "../printNodes"

const DEBUG = false

type Variable = { type: Type | undefined, isDefined: boolean, potentialTypes: Set<Type> }

type Context = {
	nameToFunctionMap: Map<string, {
		parameters: Type[]
		returnType: Type
		locals: Map<string, Type>
	}>

	variables: Map<string, Variable>[]
	expectedReturnType: Type | undefined
	possibleReturnTypes: Set<Type>
	expectedType: Type | undefined
}

export enum TypeType {
	SignedInteger = 1,
	UnsignedInteger,
	Float16,
	Float32,
	Float64,
	Float128,
	Null,
	Object,
	Union
}

export namespace Type {
	export type SignedInteger = { type: TypeType.SignedInteger, bits: number }
	export type UnsignedInteger = { type: TypeType.UnsignedInteger, bits: number }
	export type Float16 = { type: TypeType.Float16 }
	export type Float32 = { type: TypeType.Float32 }
	export type Float64 = { type: TypeType.Float64 }
	export type Float128 = { type: TypeType.Float128 }
	export type Null = { type: TypeType.Null }
	export type Object = { type: TypeType.Object, properties: Map<string, Type> }

	export type Union = {
		type: TypeType.Union
		// eslint-disable-next-line @typescript-eslint/ban-types
		members: (SignedInteger | UnsignedInteger | Float16 | Float32 | Float64 | Float128 | Null | Object)[]
	}
}

export type Type = Type.SignedInteger
	| Type.UnsignedInteger
	| Type.Float16
	| Type.Float32
	| Type.Float64
	| Type.Float128
	| Type.Null
	| Type.Object
	| Type.Union

export function passExpressions(expressions: Node.Expression[], context: Context) {
	for (const expression of expressions)
		evaluateExpressionType(expression, context)
}

export default passExpressions

function evaluateExpressionType(expression: Node.Expression, context: Context): Type {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (DEBUG)
		console.log(`evaluateExpressionType()`, printNode(expression, `    `))

	switch (expression.kind) {
		case NodeKind.Function: {
			const functionContext = scopeContext(context)
			const parameters = []

			for (const parameter of expression.parameters) {
				assert(parameter.type, HERE)

				const type = evaluateExpression(parameter.type)

				functionContext.variables[1]!.set(parameter.name, { type, isDefined: true, potentialTypes: new Set() })
				parameters.push(type)
			}

			let returnType

			if (expression.returnType) {
				returnType = evaluateExpression(expression.returnType)
				functionContext.expectedReturnType = returnType
				passExpressions(expression.body, functionContext)
			} else {
				passExpressions(expression.body, functionContext)
				returnType = resolveTypes(functionContext.possibleReturnTypes)
			}

			expression.returnType = typeToTypeNode(returnType)

			context.nameToFunctionMap.set(expression.name, {
				parameters,
				returnType,
				locals: new Map(
					[ ...functionContext.variables[0]! ]
						.map(([ name, { type, potentialTypes } ]) => [ name, type || resolveTypes(potentialTypes) ])
				)
			})

			return { type: TypeType.Null }
		}

		case NodeKind.VariableDeclaration: {
			if (expression.type) {
				const type = evaluateExpression(expression.type)

				if (expression.initialValue) {
					expression.initialValue = maybeWrapExpressionWithCast(expression.initialValue, type, context)

					context.variables[0]!.set(
						expression.binding.name,
						{ type, isDefined: true, potentialTypes: new Set() }
					)
				} else {
					context.variables[0]!.set(
						expression.binding.name,
						{ type, isDefined: false, potentialTypes: new Set() }
					)
				}
			} else if (expression.initialValue) {
				context.variables[0]!.set(expression.binding.name, {
					type: undefined,
					isDefined: true,
					potentialTypes: new Set([ evaluateExpressionType(expression.initialValue, context) ])
				})
			} else {
				context.variables[0]!.set(
					expression.binding.name,
					{ type: undefined, isDefined: false, potentialTypes: new Set() }
				)
			}

			return { type: TypeType.Null }
		}

		case NodeKind.Return: {
			expression.expression ||= { kind: NodeKind.Null }

			if (context.expectedReturnType) {
				expression.expression = maybeWrapExpressionWithCast(
					expression.expression,
					context.expectedReturnType,
					context
				)
			} else
				context.possibleReturnTypes.add(evaluateExpressionType(expression.expression, context))

			return { type: TypeType.Null }
		}

		case NodeKind.SignedInteger:
			return { type: TypeType.SignedInteger, bits: expression.bits }

		case NodeKind.Float16:
			return { type: TypeType.Float16 }

		case NodeKind.Identifier: {
			const variable = getVariable(expression.name, context)

			if (variable.type)
				return variable.type

			return resolveTypes(variable.potentialTypes)
		}

		case NodeKind.Addition: {
			if (context.expectedType) {
				expression.left = maybeWrapExpressionWithCast(expression.left, context.expectedType, context)
				expression.right = maybeWrapExpressionWithCast(expression.right, context.expectedType, context)

				return context.expectedType
			}

			const resolvedType = resolveTypes(new Set([
				evaluateExpressionType(expression.left, context),
				evaluateExpressionType(expression.right, context)
			]))

			expression.left = maybeWrapExpressionWithCast(expression.left, resolvedType, context)
			expression.right = maybeWrapExpressionWithCast(expression.right, resolvedType, context)

			return resolvedType
		}

		case NodeKind.Assignment: {
			const variable = getVariable(expression.binding.name, context)

			if (variable.type) {
				expression.value = maybeWrapExpressionWithCast(expression.value, variable.type, context)
				variable.isDefined = true

				return variable.type
			}

			if (context.expectedType)
				expression.value = maybeWrapExpressionWithCast(expression.value, context.expectedType, context)

			const valueType = evaluateExpressionType(expression.value, context)

			variable.potentialTypes.add(valueType)
			variable.isDefined = true

			return valueType
		}

		case NodeKind.Call: {
			if (!context.nameToFunctionMap.has(expression.name))
				throw new Error(`call to undeclared function ${expression.name}`)

			const { parameters, returnType } = context.nameToFunctionMap.get(expression.name)!

			assert(expression.arguments.length == parameters.length, `wrong number of arguments`)

			for (const [ index, parameterType ] of parameters.entries()) {
				const argumentType = evaluateExpressionType(
					expression.arguments[index]!,
					{ ...context, expectedType: parameterType }
				)

				assert(
					typeIsCompatibleWith(argumentType, parameterType),
					`${printType(argumentType)} is not compatible with ${printType(parameterType)}`
				)
			}

			return returnType
		}

		case NodeKind.To: {
			const leftType = evaluateExpressionType(expression.left, context)
			const rightType = evaluateExpression(expression.right)

			assert(
				typeIsCompatibleWith(leftType, rightType),
				`${printType(leftType)} is not compatible with ${printType(rightType)}`
			)

			return rightType
		}

		case NodeKind.Null:
			return { type: TypeType.Null }

		default:
			throw new Error(`${HERE} ${NodeKind[expression.type]}`)
	}
}

function evaluateExpression(expression: Node): Type {
	switch (expression.kind) {
		case NodeKind.SignedIntegerType:
			return { type: TypeType.SignedInteger, bits: expression.bits }

		case NodeKind.UnsignedIntegerType:
			return { type: TypeType.UnsignedInteger, bits: expression.bits }

		case NodeKind.Float16Type:
			return { type: TypeType.Float16 }

		case NodeKind.Float32Type:
			return { type: TypeType.Float32 }

		case NodeKind.Float64Type:
			return { type: TypeType.Float64 }

		case NodeKind.Float128Type:
			return { type: TypeType.Float128 }

		case NodeKind.Null:
			return { type: TypeType.Null }

		case NodeKind.Or: {
			const leftEvaluated = evaluateExpression(expression.left)
			const rightEvaluated = evaluateExpression(expression.right)

			if (leftEvaluated.type == TypeType.Union) {
				if (rightEvaluated.type == TypeType.Union)
					leftEvaluated.members.push(...rightEvaluated.members)
				else
					leftEvaluated.members.push(rightEvaluated)

				return leftEvaluated
			}

			if (rightEvaluated.type == TypeType.Union) {
				rightEvaluated.members.push(leftEvaluated)

				return rightEvaluated
			}

			return { type: TypeType.Union, members: [ leftEvaluated, rightEvaluated ] }
		}

		default:
			throw new Error(`${HERE} ${NodeKind[expression.kind]}`)
	}
}

function typeIsCompatibleWith(subject: Type, target: Type): boolean {
	// if (subject == target)
	// 	return true

	// if (subject == Type.I32)
	// 	return target == Type.I64 || target == Type.F64

	// if (subject == Type.F32)
	// 	return target == Type.F64

	// return false

	if (subject.type == TypeType.SignedInteger) {
		if (target.type == TypeType.SignedInteger)
			return subject.bits <= target.bits

		if (target.type == TypeType.Float16)
			return subject.bits < 12

		if (target.type == TypeType.Float32)
			return subject.bits < 25

		if (target.type == TypeType.Float64)
			return subject.bits < 54

		if (target.type == TypeType.Float128)
			return subject.bits < 114
	} else if (subject.type == TypeType.UnsignedInteger) {
		if (target.type == TypeType.UnsignedInteger)
			return subject.bits <= target.bits

		if (target.type == TypeType.SignedInteger)
			return subject.bits < target.bits

		if (target.type == TypeType.Float16)
			return subject.bits < 12

		if (target.type == TypeType.Float32)
			return subject.bits < 25

		if (target.type == TypeType.Float64)
			return subject.bits < 54

		if (target.type == TypeType.Float128)
			return subject.bits < 114
	} else if (subject.type == TypeType.Float16)
		return target.type == TypeType.Float16 || target.type == TypeType.Float32 || target.type == TypeType.Float64 || target.type == TypeType.Float128
	else if (subject.type == TypeType.Float32)
		return target.type == TypeType.Float32 || target.type == TypeType.Float64 || target.type == TypeType.Float128
	else if (subject.type == TypeType.Float64)
		return target.type == TypeType.Float64 || target.type == TypeType.Float128
	else if (subject.type == TypeType.Float128)
		return target.type == TypeType.Float128
	else {
		subject.type
	}
}

function resolveTypes(types: Set<Type>): Type {
	if (types.has(Type.Null)) {
		assert(types.size == 1, `null is not compatible with anything else`)

		return Type.Null
	}

	if (types.has(Type.F64)) {
		assert(!types.has(Type.I64), `f64 and i64 are not compatible`)

		return Type.F64
	}

	if (types.has(Type.F32)) {
		assert(!types.has(Type.I32), `f32 and i32 are not compatible`)
		assert(!types.has(Type.I64), `f32 and i64 are not compatible`)

		return Type.F32
	}

	if (types.has(Type.I64))
		return Type.I64

	return Type.I32
}

export function createContext(): Context {
	return {
		expectedReturnType: Type.Null,
		nameToFunctionMap: new Map(),
		variables: [ new Map() ],
		possibleReturnTypes: new Set(),
		expectedType: Type.Null
	}
}

export function printContext(context: Context) {
	let o = ``

	for (const variable of context.variables) {
		for (const [ name, { type, potentialTypes } ] of variable)
			o += `let ${name}: ${Type[type || resolveTypes(potentialTypes)]}\n`
	}

	for (const [ name, { parameters, returnType, locals } ] of context.nameToFunctionMap) {
		o += `${name}(${parameters.map(type => Type[type]).join(`, `)}): ${Type[returnType]}\n`

		for (const [ name, type ] of locals)
			o += `    let ${name}: ${Type[type]}\n`
	}

	return o
}

function scopeContext(context: Context): Context {
	return {
		expectedReturnType: undefined,
		nameToFunctionMap: new Map(context.nameToFunctionMap),
		possibleReturnTypes: new Set(),
		variables: [ new Map(), new Map(), ...context.variables ],
		expectedType: undefined
	}
}

function getVariable(name: string, context: Context) {
	for (const scope of context.variables) {
		if (scope.has(name))
			return scope.get(name)!
	}

	throw new ReferenceError(`${name} is not defined`)
}

function typeToTypeNode(type: Type): Node.Expression {
	switch (type) {
		case Type.I32:
			return { kind: NodeKind.SignedIntegerType, bits: 32 }

		case Type.I64:
			return { kind: NodeKind.SignedIntegerType, bits: 64 }

		case Type.F32:
			return { kind: NodeKind.FloatType, bits: 32 }

		case Type.F64:
			return { kind: NodeKind.FloatType, bits: 64 }
	}

	throw new Error(`${HERE} ${Type[type]}`)
}

function maybeWrapExpressionWithCast(expression: Node.Expression, targetType: Type, context: Context): Node.Expression {
	const expressionType = evaluateExpressionType(expression, { ...context, expectedType: targetType })

	if (expressionType == targetType)
		return expression

	if (!typeIsCompatibleWith(expressionType, targetType))
		throw new Error(`${Type[expressionType]} is not compatible with ${Type[targetType]}`)

	if (expression.kind == NodeKind.SignedInteger) {
		if (targetType == Type.I64)
			return { kind: NodeKind.SignedInteger, value: expression.value, bits: 64 }

		if (targetType == Type.F64)
			return { kind: NodeKind.Float, value: Number(expression.value), bits: 64 }
	}

	return { kind: NodeKind.To, left: expression, right: typeToTypeNode(targetType) }
}

function printType(type: Type): string {
	switch (type.type) {
		case TypeType.SignedInteger:
			return `i${type.bits}`

		case TypeType.UnsignedInteger:
			return `u${type.bits}`

		case TypeType.Float:
			return `f${type.bits}`

		case TypeType.Null:
			return `null`

		case TypeType.Object:
			return `{ ${[ ...type.properties ].map(([ name, type ]) => `${name}: ${printType(type)}`).join(`, `)} }`

		case TypeType.Union:
			return type.members.map(type => printType(type)).join(` | `)
	}
}
