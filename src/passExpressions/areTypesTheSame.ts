import { Type, TypeKind } from "."

export function areTypesTheSame(a: Type, b: Type): boolean {
	if (a.kind != b.kind)
		return false

	switch (a.kind) {
		case TypeKind.Null:
		case TypeKind.True:
		case TypeKind.False:
		case TypeKind.Float16:
		case TypeKind.Float32:
		case TypeKind.Float64:
		case TypeKind.Float128:
		case TypeKind.Any:
			return true

		case TypeKind.UnsignedInteger:
		case TypeKind.SignedInteger:
			return a.bits == (b as Type.UnsignedInteger | Type.SignedInteger).bits

		case TypeKind.Union:
			throw new Error(HERE)

		case TypeKind.Object:
			throw new Error(HERE)

		case TypeKind.Function: {
			if (a.parameters.length != (b as Type.Function).parameters.length)
				return false

			for (const [ index, aParameterType ] of a.parameters.entries()) {
				if (!areTypesTheSame(aParameterType, (b as Type.Function).parameters[index]!))
					return false
			}

			return areTypesTheSame(a.returnType, (b as Type.Function).returnType)
		}
	}
}

export default areTypesTheSame
