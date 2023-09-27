export function getIntegerLength(number: bigint) {
	let length = 1

	number = number < 0n ? -number : number

	while ((number >>= 1n))
		length++

	return length
}

export function assert(value: any, message: string, fileName: string, location: Location): asserts value {
	if (!value)
		error(message, fileName, location)
}

export function error(message: string, fileName: string, location?: Location): never {
	if (location)
		throw Error(`${message} at ${fileName}:${location.line}:${location.column}`)

	throw Error(`${message} in ${fileName}`)
}

export type Location = { index: number, line: number, column: number }
