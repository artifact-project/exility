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
		theme.for(foo, {'root': {color: 'red'}}),
		theme.for(bar, {'root': {color: 'black'}}),
	);

	const fooMap = factory(foo);
	const barMap = factory(bar);

	expect(getUsedCSS(true).names).toEqual([
		fooMap.root.split('-')[1],
		barMap.root.split('-')[1],
	]);
});
