import expressionParser from './expression';

describe('syntax / expression', () => {
	function testSyntax(name: string, cases: string[], debug?: boolean | 'trace') {
		describe(name, () => {
			cases.forEach((expr) => {
				it(expr, () => {
					let actual = null;
					let expected = null;

					if (debug && debug !== 'trace') {
						debugger;
					}

					try {
						expressionParser(expr);
					} catch (err) {
						actual = err;
					}

					try {
						eval(expr);
					} catch (err) {
						if (!(err instanceof ReferenceError)) {
							expected = err;
						}
					}

					if (debug === 'trace') {
						console.log(actual, expected);
					}

					if (actual === expected) {
						expect(actual).toBe(expected);
					} else {
						expect(actual && actual.toString()).toBe(expected && expected.toString());
					}
				});
			});
		});
	}

	// expressionParser('/s/""');
	// return;

	describe('number', () => {
		function testMe(tpl, res) {
			const frag = expressionParser(tpl);

			it(`${tpl}`, () => {
				expect(frag.length).toBe(1);
				expect(frag.first.type).toBe('number');
				expect(frag.first.raw).toBe(res);
			});
		}

		testMe('0', '0');
		testMe('0.', '0.');
		testMe('.0', '.0');
	});


	it('core', () => {
		const frag = expressionParser('+1 - 2.3');

		expect(frag.length).toBe(4);
		expect(frag.nodes[0].type).toBe('sign');
		expect(frag.nodes[0].raw).toBe('+');

		expect(frag.nodes[1].type).toBe('number');
		expect(frag.nodes[1].raw).toBe('1');

		expect(frag.nodes[2].type).toBe('sign');
		expect(frag.nodes[2].raw).toBe('-');

		expect(frag.nodes[3].type).toBe('number');
		expect(frag.nodes[3].raw).toBe('2.3');
	});

	testSyntax(
		'without errors',
		['x()', 'x ()', '(+1)', '[+1]', '"foo"', '""', '{}', '[]', '(1, 2)']
	);

	testSyntax(
		'numbers without errors',
		['0', '.0', '-1', '+2', '3.4', '+5.6', '-7.8', '.9', '-1.0', '+1.1']
	);

	testSyntax(
		'string:single',
		["''", "'xy'", "'x\\'y'"]
	);

	testSyntax(
		'string:quote',
		['""', '"xy"', '"x\\"y"']
	);

	testSyntax(
		'Invalid regular expression: missing /',
		['/']
	);

	testSyntax(
		'Invalid or unexpected token',
		['@', '#', "'", '"', '\\']
	);

	testSyntax(
		'Unexpected end of input',
		[
			'~', '+', '-', '(', '{', '[', '!',
			'x/', 'x-', 'x*', '""['
		]
	);

	testSyntax(
		'Unexpected token ) [PARENTHESIS]',
		['()', '-()']
	);

	testSyntax(
		'Unexpected token . [DOTS]',
		['..']
	);

	testSyntax(
		'Unexpected token',
		[
			',', '.', '*', '&', '|', '^', ']', '}', ')', '%', '&', '=', '?', ':', '>', '<',
			'[+]', '(+)', '(1,)'
		]
	);

	testSyntax(
		'Unexpected string',
		['1""', 'f""', '/s/""', '(1)""', '[]""']
	);

	testSyntax(
		'Unexpected number',
		["''1", '(1)2', '[]3', '12.3.', '.0.']
	);

	testSyntax(
		'Unexpected identifier',
		["''x", '(1)x', '[]y']
	);

	testSyntax(
		'Conditional operator',
		['true ? 1 : 2', '1 ? 2 : 3, 4']
	);

	testSyntax(
		'Conditional operator error: Unexpected token',
		['true ? : 2', '(1 ? 2 : )']
	);

	testSyntax(
		'Conditionals: without errors',
		[
			'1 == 2', '1 === 2', '1 < 2', '1 <= 2', '1 > 2', '1 >= 2',
			'1 || 2', '1 && 2'
		]
	);

	// testSyntax(
	// 	'Unexpected token +',
	// 	['.0.+2']
	// );

	//QUnit.test('error', function () {
	//	try {
	//		debugger;
	//		expressionParser('123 + 123 + ([+])')
	//	} catch (err) {
	//		console.log(err);
	//		debugger;
	//	}
	//});
});
