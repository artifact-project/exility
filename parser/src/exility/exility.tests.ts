import exilityParser from './exility';

// todo: ошибки на закрытие тега + onend
describe('syntax / exility', () => {

	describe('empty', () => {
		function testMe(tpl) {
			it(JSON.stringify(tpl), () => {
				const frag = exilityParser(tpl);
				expect(frag.length).toBe(0);
			});
		}

		testMe('');
		testMe(' ');
		testMe('\t');
		testMe('\n');
		testMe('\t \n');
	});

	it('!html', () => {
		const frag = exilityParser('!html');
		
		expect(frag.length).toBe(1);
		expect(frag.first.type).toBe('dtd');
		expect(frag.first.length).toBe(0);
		expect(frag.first.raw).toEqual({value: 'html'});
	});

	it('| foo-bar', () => {
		const frag = exilityParser('| foo-bar');
		
		expect(frag.length).toBe(1);
		expect(frag.first.type).toBe('text');
		expect(frag.first.length).toBe(0);
		expect(frag.first.raw).toEqual({multiline: false, value: 'foo-bar'});
	});

	describe('| foo${bar}', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.type).toBe('text');
				expect(frag.first.length).toBe(0);
				expect(frag.first.raw).toEqualFrag({multiline: false, value: tpl.substr(1).trim()});
			});
		}

		testMe('|${bar}');
		testMe('| ${bar}');
		testMe('| foo${bar}');
		testMe('| ${bar}foo');
		testMe('| foo${bar}baz');
		testMe('| foo${bar}baz${qux}');
	});

	describe('b', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.type).toBe('tag');
				expect(frag.first.length).toBe(0);
				expect(frag.first.raw).toEqual({name: 'b', attrs: {}});
			});
		}

		testMe('b');
		testMe(' b ');
		testMe(' b{}');
		testMe(' b {}');
	});

	describe('tag-${x}', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.type).toBe('tag');
				expect(frag.first.length).toBe(0);
				expect(frag.first.raw).toEqualFrag({name: tpl, attrs: {}});
			});
		}

		testMe('${x}');
		testMe('${x}-postfix');
		testMe('prefix-${x}');
		testMe('prefix-${x}-postfix');
	});

	describe('b | foo', () => {
		function testMe(tpl) {
			const frag = exilityParser(tpl);
			
			expect(frag.length).toBe(1);
			expect(frag.first.type).toBe('tag');
			expect(frag.first.length).toBe(1);
			expect(frag.first.first.type).toBe('text');
			expect(frag.first.raw).toEqual({name: 'b', attrs: {}});
			expect(frag.first.first.raw).toEqual({multiline: false, value: 'foo'});
		}

		testMe('b|foo');
		testMe('b |foo');
		testMe('b| foo');
		testMe('b | foo');
		testMe('b | foo');
		testMe('b{| foo\n}');
		testMe('b {| foo\n}');
		testMe('b\n  | foo');
	});

	describe('#foo', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.type).toBe('tag');
				expect(frag.first.raw).toEqualFrag({name: 'div', attrs: {id: 'foo'}});
			});
		}

		testMe('#foo');
		testMe('#foo{}');
		testMe('#foo {}');
	});

	describe('#${foo}', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.type).toBe('tag');
				expect(frag.first.raw).toEqualFrag({name: 'div', attrs: {id: tpl.substr(1)}});
			});
		}

		testMe('#${foo}');
		testMe('#x${foo}');
		testMe('#${foo}y');
		testMe('#${foo}${bar}');
	});

	describe('.foo', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.type).toBe('tag');
				expect(frag.first.raw).toEqualFrag({name: 'div', attrs: {class: 'foo'}});
			});
		}

		testMe('.foo');
		testMe('.foo{}');
		testMe('.foo {}');
	});

	it('error syntax: .foo.', () => {
		try {
			exilityParser('.foo.');
			expect(false).toBe('ERROR');
		} catch (err) {
			expect(err.pretty).toBe('.foo.\n----^');
		}
	});

	describe('div | #foo | .foo + comment', () => {
		function testMe(tpl, attrs) {
			it(`${tpl} + ${JSON.stringify(attrs)}`, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(2);
				expect(frag.first.type).toBe('tag');
				expect(frag.first.raw).toEqualFrag({name: 'div', attrs: attrs});

				expect(frag.last.type).toBe('comment');
				expect(frag.last.raw).toEqualFrag({value: 'bar'});
			});
		}

		testMe('div//bar', {});

		testMe('#foo//bar', {id: 'foo'});
		testMe('#foo // bar', {id: 'foo'});

		testMe('.foo//bar', {class: 'foo'});
		testMe('.foo // bar', {class: 'foo'});
	});

	describe('.${foo}', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.type).toBe('tag');
				expect(frag.first.raw).toEqualFrag({name: 'div', attrs: {class: tpl.replace(/\./g, ' ').trim()}});
			});
		}

		testMe('.${foo}');
		testMe('.x${foo}');
		testMe('.${foo}y');
		testMe('.${foo}${bar}');
		testMe('.${foo}.${bar}');
	});

	it('.foo.bar', () => {
		const frag = exilityParser('.foo.bar');
		
		expect(frag.length).toBe(1);
		expect(frag.first.raw).toEqualFrag({name: 'div', attrs: {class: 'foo bar'}});
	});

	it('i.foo.bar', () => {
		const frag = exilityParser('i.foo.bar');
		
		expect(frag.length).toBe(1);
		expect(frag.first.raw).toEqualFrag({name: 'i', attrs: {class: 'foo bar'}});
	});

	describe('#foo.bar', () => {
		function testMe(tpl, tag?) {
			it(`${tpl}, tag: ${tag}`, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.raw).toEqualFrag({name: tag || 'div', attrs: {id: 'foo', class: 'bar'}});
			});
		}

		testMe('#foo.bar');
		testMe('.bar#foo');

		testMe('i#foo.bar', 'i');
		testMe('i.bar#foo', 'i');
	});

	it('tag-${i}#id-${foo}.cls-${bar}', () => {
		const frag = exilityParser('tag-${i}#id-${foo}.cls-${bar}');
		
		expect(frag.length).toBe(1);
		expect(frag.first.raw).toEqualFrag({name: 'tag-${i}', attrs: {id: 'id-${foo}', class: 'cls-${bar}'}});
	});

	it('#foo.bar#baz (Duplicate attribute \"id\" is not allowed)', () => {
		try {
			exilityParser('#foo.bar#baz');
			expect(false).toBe('ERROR');
		} catch (err) {
			expect(err.message).toBe('Duplicate attribute \"id\" is not allowed');
		}
	});

	it('.foo.bar[baz][qux][qux="1-${2}-3"][quxx="z"]', () => {
		const frag = exilityParser('.foo.bar[baz][qux][qux="-${x}"][qux="!"][quxx="z"]');
		
		expect(frag.length).toBe(1);
		expect(frag.first.raw.attrs).toEqualFrag({
			class: 'foo bar',
			baz: 'true',
			qux: 'true-${x}!',
			quxx: 'z'
		});
	});

	it('.foo > .&-bar', () => {
		const frag = exilityParser('.foo > .&-bar');
		
		expect(frag.first.raw.attrs).toEqual({class: [['foo']]});
		expect(frag.first.first.raw.attrs).toEqual({class: [[{type: 'inherit', raw: 'parent'}, '-bar']]});
	});

	it('.foo > %-bar > .&-baz', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.first.first.type).toBe('hidden:class');
				expect(frag.first.raw.attrs).toEqual({class: [['foo']]});
				expect(frag.first.first.raw.attrs).toEqual({class: [[{type: 'inherit', raw: 'parent'}, '-bar']]});
				expect(frag.first.first.first.raw.attrs).toEqual({
					class: [[{
						type: 'inherit',
						raw: 'parent'
					}, '-baz']]
				});
			});
		}

		testMe('.foo>%-bar>.&-baz');
		testMe('.foo > %-bar > .&-baz');
	});

	describe('i.foo.bar | qux', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.raw).toEqualFrag({name: 'i', attrs: {class: 'foo bar'}});

				expect(frag.first.length).toBe(1);
				expect(frag.first.first.raw).toEqual({multiline: false, value: 'qux'});
			});
		}

		testMe('i.foo.bar|qux');
		testMe('i.foo.bar | qux');
		testMe('i.foo.bar{|qux\n}');
	});

	describe('i > b', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.raw).toEqual({name: 'i', attrs: {}});

				expect(frag.first.length).toBe(1);
				expect(frag.first.first.raw).toEqual({name: 'b', attrs: {}});
			});
		}

		testMe('i>b');
		testMe('i >b');
		testMe('i> b');
		testMe('i > b');
	});

	describe('h1 > i\nh2 > em', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(2);
				expect(frag.first.raw.name).toBe('h1');
				expect(frag.last.raw.name).toBe('h2');
			});
		}

		testMe('h1>i\nh2>em');
		testMe('h1 > i\nh2 > em');
		testMe('h1 > i.foo\nh2 > em.bar');
		testMe('h1 > i[foo]\nh2 > em[bar]');
	});

	describe('div\n  i > b (multiple)', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.length).toBe(2);
			});
		}

		testMe('div\n  i>b\n  i>b');
		testMe('div\n  i > b\n  i > b');
	});

	it('i > b | foo', () => {
		const frag = exilityParser('i > b | foo');
		
		expect(frag.length).toBe(1);
		expect(frag.first.raw).toEqual({name: 'i', attrs: {}});
		
		expect(frag.first.length).toBe(1);
		expect(frag.first.first.raw).toEqual({name: 'b', attrs: {}});
		
		expect(frag.first.first.length).toBe(1);
		expect(frag.first.first.first.raw).toEqual({multiline: false, value: 'foo'});
	});

	describe('i > b + em | foo', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.raw).toEqual({name: 'i', attrs: {}});

				expect(frag.first.length).toBe(2);
				expect(frag.first.first.raw).toEqual({name: 'b', attrs: {}});
				expect(frag.first.last.raw).toEqual({name: 'em', attrs: {}});

				expect(frag.first.last.length).toBe(1);
				expect(frag.first.last.first.raw).toEqual({multiline: false, value: 'foo'});
			});
		}

		testMe('i>b+em|foo');
		testMe('i > b +em|foo');
		testMe('i > b+ em|foo');
		testMe('i > b + em|foo');
		testMe('i > b + em | foo');
	});

	it('i.foo\\n.bar', () => {
		const frag = exilityParser('i.foo\n.bar');
		
		expect(frag.length).toBe(2);
		expect(frag.first.raw).toEqualFrag({name: 'i', attrs: {class: 'foo'}});
		expect(frag.last.raw).toEqualFrag({name: 'div', attrs: {class: 'bar'}});
	});

	describe('i{}', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.raw).toEqual({name: 'i', attrs: {}});
				expect(frag.first.length).toBe(0);
			});
		}

		testMe('i{}');
		testMe('i {}');
		testMe('i{ }');
		testMe('i { }');
		testMe('i{\n}');
	});

	describe('i { b }', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.raw).toEqual({name: 'i', attrs: {}});
				expect(frag.first.length).toBe(1);
				expect(frag.first.first.raw).toEqual({name: 'b', attrs: {}});
			});
		}

		testMe('i{b}');
		testMe('i{ b }');
		testMe('i{\nb }');
		testMe('i{b\n}');
		testMe('i{\nb\n}');
	});

	describe('i {.bar} em | wow', () => {
		function testMe(tpl) {
			describe(tpl, () => {
				const frag = exilityParser(tpl);

				it('first', () => {
					expect(frag.length).toBe(2);
					expect(frag.first.length).toBe(1);
					expect(frag.first.raw).toEqualFrag({name: 'i', attrs: {}});
					expect(frag.first.first.raw).toEqualFrag({name: 'div', attrs: {class: 'bar'}});
				});

				it('last', () => {
					expect(frag.last.length).toBe(1);
					expect(frag.last.raw).toEqual({name: 'em', attrs: {}});
					expect(frag.last.first.raw).toEqual({multiline: false, value: 'wow'});
				});
			});
		}

		testMe('i{.bar}em|wow');
		testMe('i {.bar} em | wow');
		testMe('i { .bar } em | wow');
	});


	describe('// comment', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.length).toBe(0);
				expect(frag.first.type).toBe('comment');
				expect(frag.first.raw).toEqual({value: 'foo'});
			});
		}

		testMe('//foo');
		testMe('// foo');
	});

	describe('tag // comment', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(2);
				expect(frag.first.type).toBe('tag');
				expect(frag.last.type).toBe('comment');
				expect(frag.last.raw).toEqual({value: 'foo'});
			});
		}

		testMe('div//foo');
		testMe('div // foo');
		testMe('.foo // foo');
		testMe('i.foo // foo');
	});

	it('/* multi comment */', () => {
		const frag = exilityParser('i/*foo\n\tbar*/.foo');
		
		expect(frag.length).toBe(3);
		expect(frag.nodes[0].raw).toEqual({name: 'i', attrs: {}});
		
		expect(frag.nodes[1].type).toBe('comment');
		expect(frag.nodes[1].raw).toEqual({value: 'foo\n\tbar'});
		expect(frag.nodes[2].raw).toEqualFrag({name: 'div', attrs: {class: 'foo'}});
	});

	it('input[checked]', () => {
		const frag = exilityParser('input[checked]');

		expect(frag.length).toBe(1);
		expect(frag.first.raw).toEqualFrag({name: 'input', attrs: {checked: "true"}});
	});

	it('input[checked=${state}]', () => {
		const frag = exilityParser('input[checked=${state}]');

		expect(frag.length).toBe(1);
		expect(frag.first.raw).toEqual({name: 'input', attrs: {checked: [[{type: 'expression', raw: 'state'}]]}});
	});

	describe('input[type="radio"][checked] / input[type="radio" checked]', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.raw).toEqualFrag({name: 'input', attrs: {type: 'radio', checked: "true"}});
			});
		}

		testMe('input[type="radio"][checked]');
		testMe('input[checked type="radio"]');
		testMe('input[type="radio" checked]');
		testMe('input[ type="radio" checked ]');
		testMe('input[\n  type="radio"\n  checked\n]');
		testMe('input[type="radio"\n\t\t\tchecked]');
		testMe('input[type="radio"\n\t\t\t\t\tchecked]');
	});

	describe('a[href=".."] | link', () => {
		function testMe(tpl, mode?) {
			it(`${tpl} + ${mode}`, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(mode || 1);
				expect(frag.first.raw).toEqualFrag({name: 'a', attrs: {href: '..'}});

				if (mode === 0) {
					expect(frag.first.length).toBe(0);
				} else if (mode === 2) {
					expect(frag.first.length).toBe(0);
					expect(frag.last.raw).toEqual({multiline: false, value: 'link'});
				} else {
					expect(frag.first.length).toBe(1);
					expect(frag.first.first.raw).toEqual({multiline: false, value: 'link'});
				}
			});
		}

		testMe('a[href=".."]|link');
		testMe('a[href=".."] | link');
		testMe('a[href=".."]{| link\n}');
		testMe('a[href=".."]\n  | link');
		testMe('a[href=".."]', 0);
		testMe('a[href=".."]\n| link', 2);
	});

	it('i[v="/"]', () => {
		const frag = exilityParser('i[v="/"]');

		expect(frag.length).toBe(1);
		expect(frag.first.raw).toEqualFrag({name: 'i', attrs: {v: '/'}});
	});

	describe('indent', () => {
		function testMe(space) {
			it(space, () => {
				const frag = exilityParser([
					'b',
					space + 'i',
					space + space + 'a',
					'div',
					space + 'u',
					space + 'em',
					space + space + '| ok'
				].join('\n'));

				expect(frag.length).toBe(2);
				expect(frag.nodes[0].length).toBe(1);
				expect(frag.nodes[0].raw).toEqual({name: 'b', attrs: {}});
				expect(frag.nodes[0].first.raw).toEqual({name: 'i', attrs: {}});

				expect(frag.nodes[0].first.length).toBe(1);
				expect(frag.nodes[0].first.first.raw).toEqual({name: 'a', attrs: {}});

				expect(frag.nodes[1].length).toBe(2);
				expect(frag.nodes[1].raw).toEqual({name: 'div', attrs: {}});
				expect(frag.nodes[1].first.raw).toEqual({name: 'u', attrs: {}});
				expect(frag.nodes[1].last.raw).toEqual({name: 'em', attrs: {}});
				expect(frag.nodes[1].last.first.raw).toEqual({multiline: false, value: 'ok'});
			});
		}

		testMe('\t');
		testMe('  ');
	});

	it('indent + levels', () => {
		const frag = exilityParser([
			'i > em > b',
			'  div',
			'span'
		].join('\n'));

		expect(frag.length).toBe(2);
		expect(frag.nodes[0].raw.name).toBe('i');
		expect(frag.nodes[1].raw.name).toBe('span');

		expect(frag.nodes[0].length).toBe(1);
		expect(frag.nodes[0].nodes[0].raw.name).toBe('em');
		
		expect(frag.nodes[0].nodes[0].length).toBe(1);
		expect(frag.nodes[0].nodes[0].nodes[0].raw.name).toBe('b');

		expect(frag.nodes[0].nodes[0].nodes[0].length).toBe(1);
		expect(frag.nodes[0].nodes[0].nodes[0].nodes[0].raw.name).toBe('div');
	});

	it('indent + levels (with text)', () => {
		const frag = exilityParser([
			'i',
			'  x > em | foo',
			'  y > em | bar',
		].join('\n'));

		expect(frag.length).toBe(1);
		expect(frag.nodes[0].raw.name).toBe('i');

		expect(frag.nodes[0].length).toBe(2);
		expect(frag.nodes[0].nodes[0].raw.name).toBe('x');
		expect(frag.nodes[0].nodes[1].raw.name).toBe('y');
		
		expect(frag.nodes[0].nodes[0].length).toBe(1);
		expect(frag.nodes[0].nodes[0].nodes[0].raw.name).toBe('em');
		expect(frag.nodes[0].nodes[0].nodes[0].first.raw.value).toBe('foo');

		expect(frag.nodes[0].nodes[1].length).toBe(1);
		expect(frag.nodes[0].nodes[1].nodes[0].raw.name).toBe('em');
		expect(frag.nodes[0].nodes[1].nodes[0].first.raw.value).toBe('bar');
	});

	it('indent + empty lines', () => {
		const frag = exilityParser([
			'i',
			'	b',
			'',
			'		em',
			'',
			'		b'
		].join('\n'));

		expect(frag.length).toBe(1);
		expect(frag.first.length).toBe(1);
		expect(frag.first.first.length).toBe(2);
	});

	it('indent + // comment', () => {
		const frag = exilityParser('i\n  b\n    em\n//comment\n    | foo');

		expect(frag.length).toBe(1);
		expect(frag.first.first.length).toBe(3);
		expect(frag.first.first.nodes[1].type).toBe('comment');
	});

	describe('indent + {}', () => {
		const frag = exilityParser([
			'div',
			'  b { i + i }',
			'  u {',
			'    | foo',
			'  }',
			'  em',
			'span'
		].join('\n'));

		expect(frag.length).toBe(2);
		expect(frag.nodes[0].raw).toEqual({name: 'div', attrs: {}});
		
		expect(frag.nodes[0].length).toBe(3);
		expect(frag.nodes[0].nodes[0].raw).toEqual({name: 'b', attrs: {}});
		
		expect(frag.nodes[0].nodes[0].length).toBe(2);
		expect(frag.nodes[0].nodes[0].nodes[0].raw).toEqual({name: 'i', attrs: {}});
		expect(frag.nodes[0].nodes[0].nodes[1].raw).toEqual({name: 'i', attrs: {}});
		expect(frag.nodes[0].nodes[1].raw).toEqual({name: 'u', attrs: {}});
		
		expect(frag.nodes[0].nodes[1].length).toBe(1);
		expect(frag.nodes[0].nodes[1].nodes[0].raw).toEqual({multiline: false, value: 'foo'});
		expect(frag.nodes[0].nodes[2].raw).toEqual({name: 'em', attrs: {}});
		expect(frag.nodes[1].raw).toEqual({name: 'span', attrs: {}});
	});

	describe('form', () => {
		const frag = exilityParser([
			'form {',
			'  // list',
			'  h1 | Todos',
			'  ul.list {',
			'  }',
			'}'
		].join('\n'));

		expect(frag.length).toBe(1);
		expect(frag.first.length).toBe(3);
		expect(frag.first.raw).toEqualFrag({name: 'form', attrs: {}});
		expect(frag.first.nodes[0].type).toBe('comment');
		
		expect(frag.first.nodes[1].type).toBe('tag');
		expect(frag.first.nodes[1].raw).toEqual({name:'h1', attrs: {}});
		expect(frag.first.nodes[1].first.raw).toEqual({multiline: false, value: 'Todos'});
		
		expect(frag.first.nodes[2].type).toBe('tag');
		expect(frag.first.nodes[2].raw).toEqualFrag({name: 'ul', attrs: {class: 'list'}});
	});

	describe('const', () => {
		it('base', () => {
			const frag = exilityParser('const value = 123 * 2 + "!"');

			expect(frag.length).toBe(1);
			expect(frag.first.raw).toEqualFrag({
				name: 'const',
				attrs: {
					name: 'value',
					expr: '123 * 2 + "!"',
				},
			});
		});
	});

	describe('if', () => {
		function testMe(val, tpl, length?) {
			it(`val: ${val}, tpl: ${tpl}, length: ${length}`, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.type).toBe('keyword');
				expect(frag.first.length).toBe(length || 1);
				expect(frag.first.raw).toEqualFrag({name: 'if', attrs: {test: val}});
				expect(frag.first.first.raw).toEqualFrag({name: 'div', attrs: {class: 'foo'}});

				if (length == 2) {
					expect(frag.first.last.raw).toEqualFrag({name: 'span', attrs: {class: 'bar'}});
				}
			});
		}

		testMe('.5', 'if(.5){.foo}');
		testMe('.5', 'if(.5) > .foo');
		testMe('true', 'if (true) {.foo}');
		testMe('1.2', 'if (1.2)\n\t.foo\n\tspan.bar', 2);
		testMe('-8', 'if ( -8 ) {.foo}');
		testMe('foo.bar', 'if(foo.bar){.foo}');
		testMe('foo.bar', 'if(foo.bar) { .foo }');
		testMe('foo.bar', 'if(foo.bar){div.foo}');
		testMe('foo.bar', 'if (foo.bar) { div.foo }');
	});

	describe('if else', () => {
		function testMe(tpl, elseIf?) {
			it(`${tpl}, elseIf: ${elseIf}`, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(2 + +!!elseIf);

				expect(frag.first.type).toBe('keyword');
				expect(frag.first.length).toBe(1);
				expect(frag.first.raw).toEqualFrag({name: 'if', attrs: {test: '1'}});
				expect(frag.first.first.raw).toEqualFrag({name: 'div', attrs: {class: 'foo'}});

				if (elseIf) {
					expect(frag.nodes[1].type).toBe('keyword');
					expect(frag.nodes[1].length).toBe(1);
					expect(frag.nodes[1].raw).toEqualFrag({name: 'else', attrs: {test: '-1'}});
					expect(frag.nodes[1].first.raw).toEqualFrag({name: 'i', attrs: {class: 'baz'}});
				}

				expect(frag.last.type).toBe('keyword');
				expect(frag.last.length).toBe(1);
				expect(frag.last.raw).toEqual({name: 'else', attrs: {}});
				expect(frag.last.first.raw).toEqualFrag({name: 'b', attrs: {class: 'bar'}});
			});
		}

		testMe('if(1){.foo}else{b.bar}');
		testMe('if(1)\n\t.foo\nelse\n\tb.bar');
		testMe('if(1) > .foo\nelse > b.bar');
		testMe('if(1)  \n\t.foo\nelse  \n\tb.bar');
		testMe('if(1){.foo}else if(-1){i.baz}else{b.bar}', true);
		testMe('if(1) { .foo } else if (-1) { i.baz } else { b.bar }', true);
	});

	describe('else / errors', () => {
		function testMe(tpl) {
			it(tpl, () => {
				try {
					exilityParser(tpl);
					expect(false).toBe('ERROR');
				} catch (err) {
					expect(err.message).toBe('Unexpected token else');
				}
			});
		}

		testMe('else{}');
		testMe('if(1){}else{}else{}');
	});

	describe('for (val in data)', () => {
		function testMe(tpl, trackBy?) {
			it(`${tpl}, trackBy: ${trackBy}`, () => {
				const frag = exilityParser(tpl);
				const forAttrs = {as: 'val', data: 'foo.bar'};

				trackBy && (forAttrs['id'] = 'id');

				expect(frag.length).toBe(1);
				expect(frag.first.type).toBe('keyword');
				expect(frag.first.length).toBe(1);
				expect(frag.first.raw).toEqualFrag({name: 'for', attrs: forAttrs});
				expect(frag.first.first.raw).toEqualFrag({name: 'div', attrs: {class: 'foo'}});
			});
		}

		testMe('for(val in foo.bar){.foo}');
		testMe('for (val in foo.bar) {.foo}');
		testMe('for ( val in foo.bar ) {.foo}');
		testMe('for ( val in foo.bar ) track by id {.foo}', true);
		testMe('for ( val in foo.bar )\n  .foo');
		testMe('for ( val in foo.bar ) track by id\n  .foo', true);
	});

	describe('for ([idx, val] in data)', () => {
		function testMe(tpl, trackBy?) {
			it(`${tpl}, trackBy: ${trackBy}`, () => {
				const frag = exilityParser(tpl);
				const forAttrs = {as: 'val', key: 'idx', data: '[1,2]'};

				trackBy && (forAttrs['id'] = 'id');

				expect(frag.length).toBe(1);
				expect(frag.first.type).toBe('keyword');
				expect(frag.first.length).toBe(1);
				expect(frag.first.raw).toEqualFrag({name: 'for', attrs: forAttrs});
				expect(frag.first.first.raw).toEqualFrag({name: 'div', attrs: {class: 'foo'}});
			});
		}

		testMe('for([idx, val] in [1,2]){.foo}');
		testMe('for ( [ idx , val ] in [1,2] ) { .foo }');
		testMe('for ( [ idx , val ] in [1,2] ) track by id { .foo }', true);
		testMe('for ( [ idx , val ] in [1,2] )\n  .foo');
		testMe('for ( [ idx , val ] in [1,2] ) track by id\n  .foo', true);
	});

	describe('foo = [..]/{..}/(..)', () => {
		function testMe(tpl, type, attrs) {
			it(`${tpl}, type: ${type}, attrs: ${JSON.stringify(attrs)}`, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.type).toBe('define');
				expect(frag.first.raw.name).toBe('foo');
				expect(frag.first.raw.type).toBe(type);
				expect(frag.first.raw.attrs).toEqual(attrs);
			});
		}

		const types = {
			'brace': '{}',
			'bracket': '[]',
			'parenthesis': '()'
		};

		Object.keys(types).forEach(function (type) {
			const [open, close] = types[type].split('');

			testMe('foo=' + open + close, type, []);
			testMe('foo = ' + open + ' ' + close, type, []);
			testMe('foo = ' + open + 'bar' + close, type, ['bar']);
			testMe('foo = ' + open + ' bar ' + close, type, ['bar']);
			testMe('foo = ' + open + ' bar , qux ' + close, type, ['bar', 'qux']);
		});
	});

	it('foo = (..) + text', () => {
		const frag = exilityParser('foo = []\n  | ok\nfoo');
		
		expect(frag.length).toBe(2);
		expect(frag.first.type).toBe('define');
		expect(frag.last.raw).toEqual({name: 'foo', attrs: {}});
		
		expect(frag.first.length).toBe(1);
		expect(frag.first.first.type).toBe('text');
	});

	describe('foo(..)', () => {
		function testMe(tpl, args) {
			it(`${tpl}, attrs: ${JSON.stringify(args)}`, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.type).toBe('call');
				expect(frag.first.raw.name).toBe('foo');
				expect(frag.first.raw.args).toEqual(args);
			});
		}

		testMe('foo()', []);
		testMe('foo(a,b)', ['a', 'b']);
		testMe('foo(a, b)', ['a', 'b']);
		testMe('foo( a , b )', ['a', 'b']);
		testMe('foo( a , b, c, d )', ['a', 'b', 'c', 'd']);
		testMe('foo(Date.now())', ['Date.now()']);
		testMe('foo(12.toString(36))', ['12.toString(36)']);
		testMe('foo(factory(null, now()), name)', ['factory(null, now())', 'name']);
	});

	it('super.method()', () => {
		const frag = exilityParser('super.method(a, b)');
		
		expect(frag.length).toBe(1);
		expect(frag.first.type).toBe('call');
		expect(frag.first.raw).toEqual({
			name: 'super.method',
			args: ['a', 'b'],
			attrs: {}
		});
	});

	it('h1 > method() + .foo', () => {
		const frag = exilityParser('h1 > method() + .foo');
		
		expect(frag.length).toBe(1);
		expect(frag.first.length).toBe(2);
		expect(frag.first.first.type).toBe('call');
		expect(frag.first.last.type).toBe('tag');
	});

	describe('Nesting > comment + tag', () => {
		const frag = exilityParser('a > b\n  //foo\n  i');

		it('root', () => expect(frag.length).toBe(1));
		it('first', () => expect(frag.first.length).toBe(1));
		it('first.first', () => expect(frag.first.first.length).toBe(2));
		it('first.first.first', () => {
			expect(frag.first.first.first.length).toBe(0);
			expect(frag.first.first.first.type).toBe('comment')
		});
		it('last', () => expect(frag.first.first.last.raw.name).toBe('i'));
	});

	describe('div[class.foo]', () => {
		function testMe(tpl, classes) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(1);
				expect(frag.first.length).toBe(0);
				expect(frag.first.raw).toEqual({name: 'div', attrs: {class: classes}});
			});
		}

		testMe('div[class.foo=${attrs.yes}]', [[{
			type: 'group',
			test: 'attrs.yes',
			raw: ['foo']
		}]]);

		testMe('.foo[class.bar=${attrs.yes}]', [['foo'], [{
			type: 'group',
			test: 'attrs.yes',
			raw: ['bar']
		}]]);

		testMe('.foo[class.${name}=${attrs.yes}]', [['foo'], [{
			type: 'group',
			test: 'attrs.yes',
			raw: [{type: 'expression', raw: 'name'}]
		}]]);

		testMe('.foo[class.x-${name}=${attrs.yes}]', [['foo'], [{
			type: 'group',
			test: 'attrs.yes',
			raw: ['x-', {type: 'expression', raw: 'name'}]
		}]]);

		testMe('.foo[class.x-${name}-y=${attrs.yes}]', [['foo'], [{
			type: 'group',
			test: 'attrs.yes',
			raw: ['x-', {type: 'expression', raw: 'name'}, '-y']
		}]]);

		testMe('.foo[class.${name}-y=${attrs.yes}]', [['foo'], [{
			type: 'group',
			test: 'attrs.yes',
			raw: [{type: 'expression', raw: 'name'}, '-y']
		}]]);
	});

	describe('Whitespaces around tag', () => {
		function testMe(tpl, before, after?, attrs?) {
			it(`${tpl}, before: ${before}, after: ${after}`, () => {
				const frag = exilityParser(tpl);
				const raw = {
					name: 'a',
					attrs: attrs || {}
				};

				before && (raw['wsBefore'] = before);
				after && (raw['wsAfter'] = after);

				expect(frag.length).toBe(1);
				expect(frag.first.length).toBe(0);
				expect(frag.first.raw).toEqual(raw);
			});
		}

		testMe('a[<]', true);
		testMe('a[>]', false, true);
		testMe('a[<>]', true, true);
		testMe('a[><]', true, true);
		testMe('a[>][href=".."]', false, true, {href: [['..']]});
		testMe('a[href=".."][>]', false, true, {href: [['..']]});
		testMe('a[href=".."][>][alt="!"]', false, true, {href: [['..']], alt: [['!']]});
		testMe('a[href=".."][<>][alt="!"]', true, true, {href: [['..']], alt: [['!']]});
	});

	describe('Multiline text', () => {
		function testMe(tpl, withoutParent?, interpolate?) {
			it(`${tpl}, withoutParent: ${withoutParent}, interpolate: ${interpolate}`, () => {
				const frag = exilityParser(tpl);
				let text;

				if (withoutParent) {
					text = frag.first;
				} else {
					expect(frag.length).toBe(1);
					expect(frag.first.length).toBe(1);
					text = frag.first.first;
				}

				expect(text.type).toBe('text');

				if (interpolate) {
					expect(text.raw).toEqual({
						multiline: true,
						value: [
							' Foo\n',
							{type: 'expression', raw: 'Bar'},
							'\n\t\tBaz '
						]
					});
				} else {
					expect(text.raw).toEqual({
						multiline: true,
						value: ' Foo\nBar\n\t\tBaz '
					});
				}
			});
		}

		testMe('|> Foo\nBar\n\t\tBaz <|', true);
		testMe('p |> Foo\nBar\n\t\tBaz <|');
		testMe('p\n\t|> Foo\nBar\n\t\tBaz <|');
		testMe('p{|> Foo\nBar\n\t\tBaz <|}');
		testMe('p |> Foo\n${Bar}\n\t\tBaz <|', false, true);
	});

	describe('HTML fragment', () => {
		function testMe(tpl) {
			it(tpl, () => {
				const frag = exilityParser(tpl);

				expect(frag.length).toBe(3);
				expect(frag.nodes[0].raw).toEqual({value: 'foo '});
				expect(frag.nodes[1].raw).toEqual({
					name: 'a', attrs: {
						href: [['..']],
						class: [['foo'], ['bar']]
					}
				});
				expect(frag.nodes[2].raw).toEqual({value: ' qux'});
			});
		}

		testMe('#|foo <a href=".." class="foo bar">bar</a> qux|#');
	});

	it('div + HTML fragment', () => {
		const attrs = {};
		const frag = exilityParser(`div > #|<b>Foo</b>-bar|#`);

		expect(frag.length).toBe(1);
		expect(frag.first.length).toBe(2);
		expect(frag.first).toMatchSnapshot();
	});

	it('elem = [] + slot without default content', () => {
		const frag = exilityParser([
			'elem = []',
			'  p > content()',
			'elem'
		].join('\n'));
		
		expect(frag.length).toBe(2);
		expect(frag.first.length).toBe(1);
		expect(frag.first.first.length).toBe(1);
		expect(frag.last.length).toBe(0);
	});

	describe('valid @attribute', () => {
		function testIt(tpl, attrs) {
			it(tpl, () => {
				const frag = exilityParser(tpl);
				expect(frag.first.raw.attrs).toEqual(attrs);
			});
		}

		testIt('div[lower.Upper]', {'lower.Upper': [[true]]});
		testIt('div[Upper.lower]', {'Upper.lower': [[true]]});
		testIt('div[ns:Upper="lower"]', {'ns:Upper': [['lower']]});
		testIt('div[@foo.bar-Baz="qux"]', {'@foo.bar-Baz': [['qux']]});
	});

	it('import', () => {
		const frag = exilityParser('import elem from "path/to"\nelem[foo="yes"]');
		expect(frag.first.raw.attrs).toEqual({name: 'elem', from: '"path/to"'});
	});

	it('pseudo', () => {
		const frag = exilityParser(`div > ::children\n	::icon > i\n	::value | Foo-bar`);

		expect(frag.first.length).toBe(1);
		expect(frag.first.first.length).toBe(2);
		expect(frag.first.first.type).toEqual('pseudo');
		expect(frag.first.first.raw.name).toEqual('children');
	});

	it('super pseudo', () => {
		const frag = exilityParser(`div > ::super.children | text`);

		expect(frag.first.length).toBe(1);
		expect(frag.first.first.length).toBe(1);
		expect(frag.first.first.type).toEqual('pseudo');
		expect(frag.first.first.raw.name).toEqual('super.children');
	});
});
