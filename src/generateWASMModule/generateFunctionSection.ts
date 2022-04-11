import { SectionType, toLEB128 } from "./shared"

export function generateFunctionSection(signatureIndexes: number[]): number[] {
	const section = [ ...toLEB128(signatureIndexes.length), ...signatureIndexes ]

	return [ SectionType.Function, ...toLEB128(section.length), ...section ]
}

export default generateFunctionSection
