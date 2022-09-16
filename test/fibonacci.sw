function generateFibonacciNumber n: u
	let a = 0
	let b = 1

	while n
		let sum = a + b

		a = b
		b = sum

		n--

	return a
