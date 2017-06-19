import stringifyObjectKey from './stringifyObjectKey';

it('foo', () => {
	expect(stringifyObjectKey('foo')).toBe('foo');
});

it('foo-bar', () => {
	expect(stringifyObjectKey('foo-bar')).toBe('"foo-bar"');
});

it('-baz', () => {
	expect(stringifyObjectKey('-baz')).toBe('"-baz"');
});

it(`-q"u'x`, () => {
	expect(stringifyObjectKey(`-q"u'x`)).toBe(`"-q\\"u'x"`);
});
