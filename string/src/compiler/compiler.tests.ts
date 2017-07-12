import {COMMON_TEST} from '@exility/compile';
import {core as stdlib} from '@exility/stdlib';
import compilerFactory from './compiler';

const prettifyCompiler = compilerFactory({debug: true, prettify: true, scope: []});
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
	const factory = prettifyCompiler(`html\n\thead > title | foo\n\tbody > h1.title | Bar`);

	expect(factory).toMatchSnapshot();
	expect(factory()()).toMatchSnapshot();
});

it('interpolate', () => {
	const factory = fromString('h1.title-${size} | Hi, ${user}!', ['user', 'size']);

	expect(factory).toMatchSnapshot();
	expect(factory({stdlib})({user: '%name%', size: 'xxl'})).toMatchSnapshot();
});

it('html encoding', () => {
	const factory = fromString('| ${value}', ['value']);
	const date = new Date();

	expect(factory).toMatchSnapshot();
	expect(factory({stdlib})({})).toBe('');
	expect(factory({stdlib})({value: null})).toBe('');
	expect(factory({stdlib})({value: date})).toBe(date.toString());
	expect(factory({stdlib})({value: 123})).toBe('123');
	expect(factory({stdlib})({value: '<'})).toBe('&lt;');
	expect(factory({stdlib})({value: '>'})).toBe('&gt;');
	expect(factory({stdlib})({value: '&'})).toBe('&amp;');
	expect(factory({stdlib})({value: '"'})).toBe('&quot;');
	expect(factory({stdlib})({value: '<script>alert("&")</script>'})).toBe('&lt;script&gt;alert(&quot;&amp;&quot;)&lt;/script&gt;');
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
	var factory = fromString([
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
