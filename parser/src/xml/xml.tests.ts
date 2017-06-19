import xmlParser from './xml';

function padTest(tpl, expectedFrag) {
	describe(tpl, () => {
		let first;

		['', ' ', '    '].forEach(pad => {
			const html = tpl.replace(/\[pad\]/, pad);

			it(`${html}x${pad.length}`, () => {
				const frag = xmlParser(html);

				if (first) {
					expect(frag).toEqual(first);
				} else {
					first = frag;
					expect(frag.first.raw).toEqualFrag(expectedFrag);
				}
			});
		});
	});
}

describe('syntax / xml', () => {
	it('empty', () => {
		const frag = xmlParser('');
		expect(frag.length).toBe(0);
	});

	it('одна текстовая нода', () => {
		const frag = xmlParser('foo-bar');

		expect(frag.length).toBe(1);
		expect(frag.first.length).toBe(0);
		expect(frag.first.type).toBe('text');
		expect(frag.first.raw.value).toBe('foo-bar');
	});

	describe('text + ${x}', () => {
		function testMe(tpl, values, length = 1) {
			it(tpl, () => {
				const frag = xmlParser(tpl);

				expect(frag.length).toBe(length);
				expect(frag.nodes[0].type).toBe('text');
				expect(frag.nodes[0].raw).toEqual({value: values});
			});
		}

		testMe('${x}', [{raw: 'x', type: 'expression'}]);
		testMe('foo-${x}', ['foo-', {raw: 'x', type: 'expression'}]);
		testMe('${x}-bar', [{raw: 'x', type: 'expression'}, '-bar']);
		testMe('${x}<i/>', [{raw: 'x', type: 'expression'}], 2);
	});

	describe('<${x}/>', () => {
		function testMe(tpl, values) {
			it(tpl, () => {
				const frag = xmlParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.nodes[0].type).toBe('tag');
				expect(frag.nodes[0].raw).toEqual({name: values, attrs: {}});
			});
		}

		testMe('<${x}/>', [{raw: 'x', type: 'expression'}]);
		testMe('<foo-${x}/>', ['foo-', {raw: 'x', type: 'expression'}]);
		testMe('<${x}-bar/>', [{raw: 'x', type: 'expression'}, '-bar']);
	});

	padTest('<img[pad]/>', {
		name: 'img',
		attrs: {}
	});

	padTest('<img src="foo.gif"[pad]/>', {
		name: 'img',
		attrs: {src: 'foo.gif'},
	});

	describe('<img="${src}"/>', () => {
		function testMe(src, parsedSrc) {
			it(src, () => {
				const frag = xmlParser('<img src="' + src + '"/>');

				expect(frag.length).toBe(1);
				expect(frag.first.length).toBe(0);
				expect(frag.first.type).toBe('tag');
				expect(frag.first.raw).toEqual({
					name: 'img',
					attrs: {src: [parsedSrc]}
				});
			});
		}

		testMe('${url}', [{type: 'expression', raw: 'url'}]);
		testMe('http://${url}', ['http://', {type: 'expression', raw: 'url'}]);
		testMe('  foo bar  ', ['  foo bar  ']);
	});

	// <img src align/>
	it('<img src=".." align=".."/>', () => {
		const frag = xmlParser('<img src="foo.gif" align="bottom"/>');
		expect(frag).toMatchSnapshot();
	});

	// <input type checked/> + text
	['<input type="checkbox" checked/>!', '<input checked type="checkbox"/>!'].forEach((html) => {
		it(html, () => {
			const frag = xmlParser(html);
			expect(frag.length).toMatchSnapshot();
		});
	});

	it('<b></b>', () => {
		const frag = xmlParser('<b></b>');
		expect(frag).toMatchSnapshot();
	});

	describe('<b class="..."/>', () => {
		function testMe(classes, parsedClasses) {
			const frag = xmlParser('<b class="' + classes + '"/>');

			expect(frag).toMatchSnapshot();
			expect(frag.first.raw).toEqual({
				name: 'b',
				attrs: {class: parsedClasses}
			});
		}

		testMe('foo', [['foo']]);
		testMe('foo bar', [['foo'], ['bar']]);
		testMe('${foo} b${a}r', [[{type: 'expression', raw: 'foo'}], ['b', {type: 'expression', raw: 'a'}, 'r']]);
		testMe('  ${foo}   b${a}r  ', [[{type: 'expression', raw: 'foo'}], ['b', {type: 'expression', raw: 'a'}, 'r']]);
	});

	it('<b>foo</b>', () => {
		const frag = xmlParser('<b>foo</b>');
		expect(frag).toMatchSnapshot()
	});

	it('foo<b>bar</b>qux', () => {
		const frag = xmlParser('foo<b>bar</b>qux');
		expect(frag).toMatchSnapshot();
	});

	describe('errors', () => {
		function testMe(html, rules) {
			it(html, () => {
				try {
					xmlParser(html);
					expect('Этот тест должен проволиться!').toEqual('ERRORS');
				} catch (err) {
					Object.keys(rules).forEach(key => {
						expect(err[key]).toBe(rules[key]);
					});
				}
			});
		}

		testMe('<b>', {details: '<b>', line: 1, message: '<b/> must be closed'});
		testMe('\n--<b>', {details: '--<b>', line: 2});
		testMe('\n--<b =', {details: '--<b =', line: 2, column: 6});
		testMe('<b>\n  <i>\n</b>', {details: '</b>', line: 3, column: 4, message: 'Wrong closing tag \"b\", must be \"i\"'});
	});

	// todo: незактрытый комментарий
	describe('comment', () => {
		[['', ''], [' ', ''], ['', ' '], [' ', ' ']].forEach((pad) => {
			const value = pad[0] + 'foo' + pad[1];
			const html = '<!--' + value + '-->';

			it(html, () => {
				const frag = xmlParser(html);
				expect(frag.length).toBe(1);
				expect(frag.first.length).toBe(0);
				expect(frag.first.type).toBe('comment');
				expect(frag.first.raw).toEqual({value: value.trim()});
			});
		});
	});

	// todo: незакрытая cdata
	it('<![CDATA[foo]]>', () => {
		const frag = xmlParser('<![CDATA[foo]]>');
		expect(frag).toMatchSnapshot();
	});

	it('form', () => {
		const frag = xmlParser(`
			<form action="/foo">
				<!-- list -->
				<h1>Todos</h1>
				<ul>
					<li>
						<input type="checkbox" checked/>
						item <b>2</b>
					</li>
					<li><![CDATA[ details ]]></li>
				</ul>
			</form>
		`);

		expect(frag).toMatchSnapshot();
	});

	it('@valid attribute', () => {
		const frag = xmlParser('<div @foo.bar-Baz="qux"/>');
		expect(frag.first.raw.attrs).toEqual({"@foo.bar-Baz": [["qux"]]});
	});
});
