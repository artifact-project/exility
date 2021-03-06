import COMMON_TEST from '@exility/compile/src/COMMON_TEST/COMMON_TEST';
import {core as stdlib} from '@exility/stdlib';
import compilerFactory from './compiler';

function fromString(input: string, scope?: string[], pure?: boolean, blocks?) {
	if (blocks) {
		scope['__blocks__'] = blocks;
	}

	const compiler = compilerFactory({
		debug: true,
		pure,
		scope,
		blocks: Object.keys(blocks || {}),
	});

	return compiler(input);
}

it('doctype', () => {
	const factory = fromString(`!html`);

	expect(factory).toMatchSnapshot();
	expect(factory()()).toBe('<!DOCTYPE html>');
});

it('page / prettify', () => {
	const prettifyCompiler = compilerFactory({
		debug: true,
		prettify: true,
		scope: [],
	});
	const factory = prettifyCompiler(`html\n\thead > title | foo\n\tbody > h1.title | Bar`);

	expect(factory).toMatchSnapshot();
	expect(factory()()).toMatchSnapshot();
});

it('interpolate', () => {
	const factory = fromString('h1.title-${size} | Hi, ${user}!', ['user', 'size']);

	expect(factory).toMatchSnapshot();
	expect(factory({stdlib})({user: '%name%', size: 'xxl'})).toMatchSnapshot();
});

it('ignore @events attributes', () => {
	const factory = fromString('form[@submit]');
	expect(factory({stdlib})()).toBe('<form></form>');
});

describe('meta-comments for isomorphic', () => {
	const withMetaCommentsCompiler = compilerFactory({
		scope: ['x', 'y'],
		metaComments: true,
	});

	it('value', () => {
		const template = withMetaCommentsCompiler('| ${x} ${y}?')({stdlib});

		expect(template({x: '', y: 'bar'})).toBe('<!--(--><!--)--> <!--(-->bar<!--)-->?');
		expect(template({x: 'foo', y: 'bar'})).toBe('<!--(-->foo<!--)--> <!--(-->bar<!--)-->?');
	});

	it('if', () => {
		const template = withMetaCommentsCompiler('if (x) > | \${y}?')({stdlib});

		expect(template({x: false})).toBe('<!--if1--><!--/if1-->');
		expect(template({x: true, y: 'ok'})).toBe('<!--if1--><!--(-->ok<!--)-->?<!--/if1-->');
	});

	it('if/else', () => {
		const template = withMetaCommentsCompiler(`
			if (x) > | \${y}?
			else > b | \${y}
		`)({stdlib});

		expect(template({x: false, y: 'hmm'})).toBe('<!--if1--><b><!--(-->hmm<!--)--></b><!--/if1-->');
		expect(template({x: true, y: 'ok'})).toBe('<!--if1--><!--(-->ok<!--)-->?<!--/if1-->');
	});

	it('for', () => {
		const template = withMetaCommentsCompiler('for (i in x) > | ${i}')({stdlib});

		expect(template({})).toBe('<!--for1--><!--/for1-->');
		expect(template({x: [1, 2]})).toBe('<!--for1--><!--(-->1<!--)--><!--(-->2<!--)--><!--/for1-->');
	});
});

it('html encoding', () => {
	const factory = fromString('| ${value}', ['value']);
	const template = factory({stdlib});
	const date = new Date();

	expect(factory).toMatchSnapshot();
	expect(template({})).toBe('');
	expect(template({value: null})).toBe('');
	expect(template({value: date})).toBe(date.toString());
	expect(template({value: 123})).toBe('123');
	expect(template({value: '<'})).toBe('&lt;');
	expect(template({value: '>'})).toBe('&gt;');
	expect(template({value: '&'})).toBe('&amp;');
	expect(template({value: '"'})).toBe('&quot;');
	expect(template({value: '<script>alert("&")</script>'})).toBe('&lt;script&gt;alert(&quot;&amp;&quot;)&lt;/script&gt;');
});

it('inherit', () => {
	const factory = fromString('.btn > .&__icon');
	expect(factory).toMatchSnapshot();
});

it('inherit + interpolate', () => {
	const factory = fromString('.${x} > .&__text', ['x']);

	expect(factory).toMatchSnapshot();
	expect(factory({stdlib})({x: 'btn'})).toMatchSnapshot();
});

it('panel = [title] + default slot', () => {
	const factory = fromString([
		'panel = [title]',
		'  h1 | ${title}',
		'  p > children()',
		'panel[title="?!"]',
		'panel[title="Wow!"]',
		'  | Done',
	].join('\n'));

	expect(factory).toMatchSnapshot();
	expect(factory({stdlib})()).toMatchSnapshot();
});

it('panel = [title] + content slot', () => {
	const factory = fromString([
		'panel = [title]',
		'  content(title.toUpperCase(), "?")',
		'panel[title="wow!"]',
		'  content = (text, chr)',
		'    p | ${text}${chr}',
	].join('\n'));

	expect(factory({stdlib})()).toBe('<p>WOW!?</p>');
});

it('panel = [title] + content slot (+ default)', () => {
	const factory = fromString([
		'panel = [title]',
		'  content(title.toUpperCase(), "?")',
		'  content = (text, chr)',
		'    | ${text}${chr}',
		'h1 > panel[title="wow"]',
		'h2 > panel[title="xyz"]',
		'  content = (text)',
		'    | ${text.split("").reverse().join("")}',
	].join('\n'));

	expect(factory({stdlib})()).toBe('<h1>WOW?</h1><h2>ZYX</h2>');
});

it('panel = [title] + super', () => {
	const factory = fromString([
		'panel = [title]',
		'  content(title)',
		'  content = (text)',
		'    | ${text}',
		'panel[title="xyz"]',
		'  content = (text)',
		'    p > super.content(text.toUpperCase()) + | !'
	].join('\n'));

	expect(factory({stdlib})()).toBe('<p>XYZ!</p>');
});

it('pure', () => {
	const factory = fromString('h1 | Hi!', [], true);

	expect(factory).toMatchSnapshot();
	expect(factory({})()).toBe('<h1>Hi!</h1>');
});

it('pure + expression', () => {
	const factory = fromString('i.foo | ${text}!', ['text'], true);

	expect(factory).toMatchSnapshot();
	expect(factory({stdlib})({text: '&bar'})).toBe('<i class="foo">&amp;bar!</i>');
});

it('innerHTML / static', () => {
	const factory = fromString('.foo[innerHTML="<i>OK</i>"] | FAIL', []);

	expect(factory).toMatchSnapshot();
	expect(factory({stdlib})({text: '&bar'})).toBe('<div class="foo"><i>OK</i></div>');
});

it('innerHTML / var', () => {
	const factory = fromString('.foo[innerHTML=${text}] | FAIL', ['text']);

	expect(factory).toMatchSnapshot();
	expect(factory({stdlib})({text: '<i>raw</i>'})).toBe('<div class="foo"><i>raw</i></div>');
});

it('input', () => {
	const factory = fromString(`
		input[
			checked=\${elem.checked}
			placeholder=\${elem.placeholder}
		]
	`, ['elem']);

	expect(factory({stdlib})({elem: {}})).toBe('<input/>');
	expect(factory).toMatchSnapshot();

	expect(factory({stdlib})({elem: {checked: true}})).toBe('<input checked/>');
	expect(factory({stdlib})({elem: {placeholder: 123}})).toBe('<input placeholder="123"/>');
});

describe('COMMON_TEST', () => {
	COMMON_TEST.forEach(({title, template, data, results, snapshot}) => {
		results = [].concat(results);

		describe(title, () => {
			[].concat(data).forEach((scope, idx) => {
				const templateFactory = fromString(template, Object.keys(scope));

				it(JSON.stringify(scope), () => {
					if (!idx && snapshot) {
						expect(templateFactory).toMatchSnapshot();
					}

					expect(templateFactory({stdlib})(scope).replace(' href=""', '')).toBe(results[idx]);
				});
			});
		});
	});
});
