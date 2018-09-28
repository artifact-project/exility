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

	expect(fooMap[':host']).toBe('--host-mujwv');
	expect(barMap.root).toBe('root-168fhco');

	expect(getUsedCSS(true)).toEqual({
		names: ['mujwv', '168fhco'],
		cssText: `._mujwv,.--host-mujwv{color:red;}\n._168fhco,.root-168fhco{color:black;}\n`,
	});
});
