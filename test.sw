function generateFibonacciNumber(n: i32) i32
	let a: i32 = 0
	let b: i32 = 1

	while n
		let sum: i32 = a +% b

		a = b
		b = sum

		n--

	return a
