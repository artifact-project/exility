import {COMMON_TEST} from '@exility/compile';
import {core as stdlib} from '@exility/stdlib';
import compilerFactory from './compiler';

const fromString = function (input: string, scope?: string[], pure?: boolean) {
	const compiler = compilerFactory({
		debug: true,
		pure,
		scope,
	});

	return compiler(input);
};

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
		'  p > __default()',
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
	const factory = fromString('i.foo | ${text}!', ['text'], true);

	expect(factory).toMatchSnapshot();
	expect(factory()({text: '&bar'})).toBe('<i class="foo">&amp;bar!</i>');
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
