import css, {getUsedCSS} from './css';

it('css / used', () => {
	const a = css({
		'foo': {color: 'red'},
		'bar': {color: 'green'},
		'baz': {color: 'blue'},
		'qux': {color: 'magenta'},
	});

	expect(!!a.foo).toBe(true);
	expect(!!a.qux).toBe(true);

	expect(getUsedCSS()).toEqual({
		names: ['_1l237tg', '_ksuaeq'],
		cssText: '._1l237tg{color:red}\n._ksuaeq{color:magenta}\n',
	});
});


it('css / dev', () => {
	process.env.NODE_ENV = 'dev';

	const a = css({'foo': {color: 'red'}});
	const b = css({'bar': {color: 'red'}});

	expect(a.foo).not.toBe(b.bar);
});

it('css / production', () => {
	process.env.NODE_ENV = 'production';

	const a = css({'foo': {color: 'red'}});
	const b = css({'bar': {color: 'red'}});

	expect(a.foo).toBe(b.bar)
});
