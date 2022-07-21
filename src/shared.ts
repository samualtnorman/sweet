export function getIntegerLength(number: bigint) {
	let length = 1

	number = number < 0n ? -number : number

	while ((number >>= 1n))
		length++

	return length
}
