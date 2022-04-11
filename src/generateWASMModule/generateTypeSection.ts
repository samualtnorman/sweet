import { SectionType, toLEB128, Type } from "./shared"

export function generateTypeSection(types: Type[]): number[] {
	const section = [ ...toLEB128(types.length) ]

	for (const { type, parameters, result } of types) {
		section.push(
			type,
			...toLEB128(parameters.length),
			...parameters,
			...toLEB128(result.length),
			...result
		)
	}

	return [ SectionType.Type, ...toLEB128(section.length), ...section ]
}

export default generateTypeSection
