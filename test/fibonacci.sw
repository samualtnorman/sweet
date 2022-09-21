function generateFibonacciNumber n: u
	let a: u32 = 0
	let b: u32 = 1

	while n
		let sum = a + b

		if sum > u32
			return error.Overflow

		a = b
		b = sum

		n--

	return a
