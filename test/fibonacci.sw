function generateFibonacciNumber n: u
	let a: u = 0
	let b: u = 1

	while n
		let sum = a +% b

		a = b
		b = sum

		n--

	return a
