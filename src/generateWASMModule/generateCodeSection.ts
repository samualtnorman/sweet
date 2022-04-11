import { Opcode, SectionType, toLEB128, WASMFunction } from "./shared"

export function generateCodeSection(functions: WASMFunction[]): number[] {
	const section = [ ...toLEB128(functions.length) ]

	for (const { instructions, locals } of functions) {
		const function_ = [ ...toLEB128(locals.length) ]

		for (const { type, count } of locals)
			function_.push(count, type)

		function_.push(...instructions, Opcode.End)
		section.push(...toLEB128(function_.length), ...function_)
	}

	return [ SectionType.Code, ...toLEB128(section.length), ...section ]
}

export default generateCodeSection
