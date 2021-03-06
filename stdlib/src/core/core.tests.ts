import core from './core';

it('NOOP', () => {
	expect(core.NOOP()).toBe(void 0);
});

it('TO_STRING', () => {
	const date = new Date();

	expect(core.TO_STRING()).toBe('');
	expect(core.TO_STRING(null)).toBe('');
	expect(core.TO_STRING(123)).toBe('123');
	expect(core.TO_STRING(true)).toBe('true');
	expect(core.TO_STRING(date)).toBe(date + '');
});

it('RETURN_EMPTY_STRING', () => {
	expect(core.RETURN_EMPTY_STRING()).toBe('');
});

it('HTML_ENCODE', () => {
	expect(core.HTML_ENCODE()).toBe('');
	expect(core.HTML_ENCODE(null)).toBe('');
	expect(core.HTML_ENCODE(true)).toBe('true');
	expect(core.HTML_ENCODE('Wow!')).toBe('Wow!');
	expect(core.HTML_ENCODE('<')).toBe('&lt;');
	expect(core.HTML_ENCODE('"')).toBe('&quot;');
	expect(core.HTML_ENCODE('&')).toBe('&amp;');
	expect(core.HTML_ENCODE('>')).toBe('&gt;');
	expect(core.HTML_ENCODE('<"&>')).toBe('&lt;&quot;&amp;&gt;');
});

it('EACH(null)', () => {
	let fail = false;

	core.EACH(null, () => (fail = true));
	expect(fail).toBe(false);
});

it('EACH(array)', () => {
	const result = [];

	core.EACH([1, 2, 3], (val) => result.push(val));
	expect(result).toEqual([1, 2, 3]);
});

it('EACH(object)', () => {
	const result = {};

	core.EACH({x: 1, y: 2}, (val, key) => {result[val] = key;});
	expect(result).toEqual({1: 'x', 2: 'y'});
});

it('NEXT_CONTEXT', () => {
	const result = core.NEXT_CONTEXT({context: {foo: 1}});
	expect(result).toEqual({foo: 1});
});

it('NEXT_CONTEXT: getContextForNested', () => {
	const result = core.NEXT_CONTEXT({
		context: {foo: 1},
		getContextForNested() {
			return {bar: 2};
		}
	});

	expect(result).toEqual({bar: 2});
	expect(result.foo).toEqual(1);
	expect(result.bar).toEqual(2);
});

it('CSS_MODULE: {}', () => {
	const cx = core.CSS_MODULE({});

	expect(cx('foo')).toBe('[warn: foo]');
	expect(cx('foo bar')).toBe('[warn: foo] [warn: bar]');
});
