import { SectionType, toLEB128 } from "./shared"

export type Export = { name: string, functionIndex: number }

export function generateExportSection(exports: Export[]): number[] {
	const section = [ ...toLEB128(exports.length) ]

	for (const { name, functionIndex } of exports) {
		section.push(
			...toLEB128(name.length),
			...name.split(``).map(character => character.charCodeAt(0)),
			0x00,
			functionIndex
		)
	}

	return [ SectionType.Export, ...toLEB128(section.length), ...section ]
}

export default generateExportSection
