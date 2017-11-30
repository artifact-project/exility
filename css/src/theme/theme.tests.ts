import {theme} from './theme';
import {getUsedCSS, resetCSS} from '../css/css';

beforeEach(() => {
	resetCSS(1000);

	process.env.RUN_AT = 'client';
	process.env.NODE_ENV = 'dev';
});

it('create', () => {
	const foo = {};
	const bar = {};
	const factory = theme.create(
		theme.for(foo, {':host': {color: 'red'}}),
		theme.for(bar, {'root': {color: 'black'}}),
	);

	const fooMap = factory(foo);
	const barMap = factory(bar);

	expect(fooMap[':host']).toBe('--host-nnolt3');
	expect(barMap.root).toBe('root-1p7yqyb');

	expect(getUsedCSS(true)).toEqual({
		names: ['nnolt3', '1p7yqyb'],
		cssText: `._nnolt3,.--host-nnolt3{color:red;}\n._1p7yqyb,.root-1p7yqyb{color:black;}\n`,
	});
});
