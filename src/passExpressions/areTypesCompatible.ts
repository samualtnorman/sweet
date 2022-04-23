import { Type, TypeKind } from "."

export function areTypesCompatible(subject: Type, target: Type): boolean {
	if (target.kind == TypeKind.Any)
		return true

	if (target.kind == TypeKind.Union)
		return target.members.some(target => areTypesCompatible(subject, target))

	switch (subject.kind) {
		case TypeKind.Null:
			return target.kind == TypeKind.Null

		case TypeKind.True:
			return target.kind == TypeKind.True

		case TypeKind.False:
			return target.kind == TypeKind.False

		case TypeKind.UnsignedInteger: {
			if (target.kind == TypeKind.UnsignedInteger)
				return subject.bits <= target.bits

			// the extra bit is needed because signed integers use 1 bit for the sign
			if (target.kind == TypeKind.SignedInteger)
				return subject.bits < target.bits

			// IEEE half floating point numbers have 11 bits precision
			if (target.kind == TypeKind.Float16)
				return subject.bits <= 11

			if (target.kind == TypeKind.Float32)
				return subject.bits <= 24

			if (target.kind == TypeKind.Float64)
				return subject.bits <= 53

			return target.kind == TypeKind.Float128 && subject.bits <= 113
		}

		case TypeKind.SignedInteger: {
			if (target.kind == TypeKind.SignedInteger)
				return subject.bits <= target.bits

			// we can get away with an extra bit here because signed integers use 1 bit for the sign
			if (target.kind == TypeKind.Float16)
				return subject.bits <= 12

			if (target.kind == TypeKind.Float32)
				return subject.bits <= 25

			if (target.kind == TypeKind.Float64)
				return subject.bits <= 54

			return target.kind == TypeKind.Float128 && subject.bits <= 114
		}

		case TypeKind.Float16: {
			if (target.kind == TypeKind.Float16 || target.kind == TypeKind.Float32)
				return true

			return target.kind == TypeKind.Float64 || target.kind == TypeKind.Float128
		}

		case TypeKind.Float32: {
			if (target.kind == TypeKind.Float32 || target.kind == TypeKind.Float64 || target.kind == TypeKind.Float128)
				return true

			return false
		}

		case TypeKind.Float64:
			return target.kind == TypeKind.Float64 || target.kind == TypeKind.Float128

		case TypeKind.Float128:
			return target.kind == TypeKind.Float128

		case TypeKind.Union:
			return subject.members.every(subject => areTypesCompatible(subject, target))

		case TypeKind.Object: {
			if (target.kind != TypeKind.Object)
				return false

			return [ ...target.properties ].every(([ propertyName, target ]) => {
				if (subject.properties.has(propertyName))
					return areTypesCompatible(subject.properties.get(propertyName)!, target)

				return false
			})
		}

		case TypeKind.Function: {
			if (target.kind != TypeKind.Function || subject.parameters.length > target.parameters.length)
				return false

			for (const [ parameterIndex, parameterType ] of subject.parameters.entries()) {
				if (!areTypesCompatible(parameterType, target.parameters[parameterIndex]!))
					return false
			}

			return areTypesCompatible(subject.returnType, target.returnType)
		}

		case TypeKind.Any:
			throw new Error(HERE)
	}
}

export default areTypesCompatible
