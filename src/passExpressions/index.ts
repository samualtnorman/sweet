export { areTypesCompatible } from "./areTypesCompatible"
export { areTypesTheSame } from "./areTypesTheSame"
export { castExpression } from "./castExpression"
export { evaluateExpression } from "./evaluateExpression"
export { evaluateExpressionType } from "./evaluateExpressionType"
export { printType } from "./printType"
export { resolveTypes } from "./resolveTypes"
export { typeToExpression } from "./typeToExpression"

import { assert } from "@samual/lib"
import { Expression } from "../parse"
import areTypesCompatible from "./areTypesCompatible"
import passExpressions_ from "./passExpressions"
import printType from "./printType"

export enum TypeKind {
	Null,
	True,
	False,
	UnsignedInteger,
	SignedInteger,
	Float16,
	Float32,
	Float64,
	Float128,
	Union,
	Object,
	Function,
	Any
}

export namespace Type {
	export type Null = { kind: TypeKind.Null }
	export type True = { kind: TypeKind.True }
	export type False = { kind: TypeKind.False }
	export type UnsignedInteger = { kind: TypeKind.UnsignedInteger, bits: number }
	export type SignedInteger = { kind: TypeKind.SignedInteger, bits: number }
	export type Float16 = { kind: TypeKind.Float16 }
	export type Float32 = { kind: TypeKind.Float32 }
	export type Float64 = { kind: TypeKind.Float64 }
	export type Float128 = { kind: TypeKind.Float128 }
	export type Union = { kind: TypeKind.Union, members: Exclude<Type, Union | Any>[] }
	export type Object = { kind: TypeKind.Object, properties: Map<string, Type> }
	export type Function = { kind: TypeKind.Function, parameters: Type[], returnType: Type }
	export type Any = { kind: TypeKind.Any }
	// export type Literal
}

export type Type = Type.Null | Type.True | Type.False | Type.UnsignedInteger | Type.SignedInteger | Type.Float16
	| Type.Float32 | Type.Float64 | Type.Float128 | Type.Union | Type.Object | Type.Function | Type.Any

export type Context = {
	variables: Map<string, { type: Type, isDefined: boolean }>
	constants: Map<string, Type>
	unfinishedReturnTypes: Map<string, Type[]>
} & ({
	returnType: Type
	returnedTypes: undefined
} | {
	returnType: undefined
	returnedTypes: Type[]
})

export function passExpressions(expressions: Expression.Expression[]): void {
	passExpressions_(expressions, createContext())
}

export default passExpressions

export function createContext(): Context {
	return {
		variables: new Map(),
		constants: new Map(),
		unfinishedReturnTypes: new Map(),
		returnType: { kind: TypeKind.Null },
		returnedTypes: undefined
	}
}

export function printContext(context: Context, indentString = `\t`): string {
	let o = `variables:\n`

	for (const [ name, variable ] of context.variables)
		o += `${indentString}${name}: ${printType(variable.type)}\n`

	return o
}

export function assertTypesAreCompatible(subject: Type, target: Type) {
	assert(areTypesCompatible(subject, target), `${printType(subject)} is not compatible with ${printType(target)}`)
}
