import { assert } from "@samual/lib"
import { assertTypesAreCompatible, Type, TypeKind } from "."
import printType from "./printType"

export function resolveTypes(...types: Type[]): Type {
	const typeKinds = new Set(types.map(({ kind }) => kind))

	if (typeKinds.has(TypeKind.Float128)) {
		for (const type of types)
			assertTypesAreCompatible(type, { kind: TypeKind.Float128 })

		return { kind: TypeKind.Float128 }
	}

	if (typeKinds.has(TypeKind.Float64)) {
		for (const type of types)
			assertTypesAreCompatible(type, { kind: TypeKind.Float64 })

		return { kind: TypeKind.Float64 }
	}

	if (typeKinds.has(TypeKind.Float32)) {
		for (const type of types)
			assertTypesAreCompatible(type, { kind: TypeKind.Float32 })

		return { kind: TypeKind.Float32 }
	}

	if (typeKinds.has(TypeKind.Float16)) {
		for (const type of types)
			assertTypesAreCompatible(type, { kind: TypeKind.Float16 })

		return { kind: TypeKind.Float16 }
	}

	if (typeKinds.has(TypeKind.SignedInteger)) {
		let bits = 0

		for (const type of types) {
			switch (type.kind) {
				case TypeKind.UnsignedInteger: {
					bits = Math.max(bits, type.bits + 1)
				} break

				case TypeKind.SignedInteger: {
					bits = Math.max(bits, type.bits)
				} break

				default:
					throw new Error(`${HERE} ${printType(type)}`)
			}
		}

		return { kind: TypeKind.SignedInteger, bits }
	}

	if (typeKinds.has(TypeKind.UnsignedInteger)) {
		let bits = 0

		for (const type of types) {
			assert(type.kind == TypeKind.UnsignedInteger, `${HERE} ${printType(type)}`)
			bits = Math.max(bits, type.bits)
		}

		return { kind: TypeKind.UnsignedInteger, bits }
	}

	throw new Error(HERE)
}

export default resolveTypes
