import css, {getUsedCSS, resetCSS} from './css';

beforeEach(() => {
	resetCSS();
	process.env.NODE_ENV = 'production';
});

it('used', () => {
	process.env.RUN_AT = 'server';

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


it('dev', () => {
	process.env.NODE_ENV = 'dev';

	const a = css({'foo': {color: 'red'}});
	const b = css({'bar': {color: 'red'}});

	expect(a.foo).not.toBe(b.bar);
});

it('production', () => {
	const a = css({'foo': {color: 'red'}});
	const b = css({'bar': {color: 'red'}});

	expect(a.foo).toBe(b.bar)
});

it(':pseudo', () => {
	const link = css({
		'main': {color: 'black'},
		'root': {color: 'black'},
		'root:hover': {color: 'green'},
	});

	expect(link.main).toBe('_3uavnk');
	expect(link.root).toBe('_3uavnk _1p346d8');

	expect(getUsedCSS(true)).toEqual({
		names: ['_3uavnk', '_yjvk7w'],
		cssText: '._3uavnk{color:black}\n._1p346d8:hover,._yjvk7w{color:green}\n',
	});
});

it.skip('&:pseudo', () => {
	const link = css({
		'root': {
			color: 'black',
			'&:hover': {color: 'green'},
		},
	});

	expect(link.root).toBe('_3uavnk _3uavnk-_yjvk7w-hover');

	expect(getUsedCSS(true)).toEqual({
		names: ['_3uavnk', '_yjvk7w'],
		cssText: '._3uavnk{color:black}\n._3uavnk-_yjvk7w-hover:hover,._yjvk7w{color:green}\n',
	});
});
