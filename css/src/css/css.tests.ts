import css, {fx, getUsedCSS, resetCSS, setStyleNode} from './css';

function pause(ms = 30) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

beforeEach(() => {
	resetCSS(1000);

	process.env.RUN_AT = 'client';
	process.env.NODE_ENV = 'production';
});

it('used', () => {
	process.env.RUN_AT = 'server';

	const cx = css({
		'foo': {color: 'red'},
		'bar': {color: 'green'},
		'baz': {color: 'blue'},
		'qux': {color: 'magenta'},
	});

	expect(cx.foo).toBe('_rs');
	expect(cx.qux).toBe('_rv');
	expect(getUsedCSS().cssText).toEqual(`.${cx.foo}{color:red;}\n.${cx.qux}{color:magenta;}\n`);
});

it('used with nested', () => {
	process.env.RUN_AT = 'server';

	const cx = css({
		'foo': {
			color: 'red',

			'& + &': {
				marginLeft: 10,
			},

			'&.bar': {
				opacity: .5
			},

			'&.qux': {
				opacity: .1
			},
		},

		'bar': {
			marginLeft: 10,
		},
	});

	expect(cx.foo).toBe('_rs');
	expect(cx.bar).toBe('_rt');
	expect(cx.qux).toBe('_ru');

	expect(getUsedCSS().cssText.trim().split('\n')).toEqual([
		`.${cx.foo} + .${cx.foo},.${cx.bar}{margin-left:10px;}`,
		`.${cx.foo}.${cx.bar}{opacity:0.5;}`,
		`.${cx.foo}.${cx.qux}{opacity:0.1;}`,
		`.${cx.foo}{color:red;}`
	]);
});

it('dev', () => {
	process.env.NODE_ENV = 'dev';

	const cx = css({'foo': {color: 'red'}});

	expect(cx.foo).toBe('foo-mujwv');
	expect(getUsedCSS(true)).toEqual({
		names: ['mujwv'],
		cssText: '._mujwv,.foo-mujwv{color:red;}\n',
	});
});

it('production', () => {
	const cx = css({'foo': {color: 'red'}});
	expect(cx.foo).toBe('_rs');
});

it('deduplicate', () => {
	const cx = css({
		'foo': {color: 'red'},
		'bar': {color: 'red'},
	});

	expect(cx.foo).toBe('_rs');
	expect(cx.bar).toBe('_rt');
	expect(getUsedCSS(true).cssText).toEqual(`.${cx.foo},.${cx.bar}{color:red;}\n`);
});

it('&:pseudo', () => {
	const link = css({
		'root': {
			color: 'black',
			'&:hover': {color: 'green'},
		},
	});

	expect(getUsedCSS(true).cssText).toEqual(
		`.${link.root}:hover{color:green;}\n.${link.root}{color:black;}\n`,
	);
});

it('fx/@keyframes', () => {
	process.env.RUN_AT = 'server';

	const colorFx = css.fx({
		from: {color: 'red'},
		to: {color: 'black'},
	});

	const text = css({
		'root': {
			opacity: .5,
			animation: colorFx('.8s'),
		},
	});

	const sel = text.root;
	const fxRule = colorFx('').computedRule;

	expect(getUsedCSS().cssText).toEqual(
		`@keyframes _${fxRule.name}{${fxRule.cssText}}\n.${sel}{opacity:0.5;animation:_${fxRule.name} .8s;}\n`,
	);
});

it('hrm', async () => {
	process.env.RUN_AT = 'server';
	process.env.NODE_ENV = 'dev';

	// Server
	let cx = css({'foo': {color: 'red'}});
	const __css__ = document.createElement('style');
	const usedCSS = getUsedCSS(true);

	__css__.textContent = usedCSS.cssText;
	__css__.setAttribute('data-names', usedCSS.names.join(','));

	document.body.appendChild(__css__);

	setStyleNode(__css__);

	expect(__css__.sheet['cssRules'].length).toBe(1);
	expect(__css__.sheet['cssRules'][0].selectorText).toBe('._mujwv,.foo-mujwv');

	// Client: add class (deduplicate)
	process.env.RUN_AT = 'client';
	cx = css({'bar': {color: 'red'}});

	await pause();

	expect(__css__.sheet['cssRules'].length).toBe(1);
	expect(__css__.sheet['cssRules'][0].selectorText).toBe('.mujwv,.foo-mujwv,.bar-mujwv');

	// Client: add class
	process.env.RUN_AT = 'client';
	cx = css({'qux': {color: 'green'}});

	await pause();

	expect(__css__.sheet['cssRules'].length).toBe(2);
	expect(__css__.sheet['cssRules'][1].selectorText).toBe('._10hl3mm,.qux-10hl3mm');

	// Client: change class
	process.env.RUN_AT = 'client';
	cx = css({'foo': {color: 'green'}});

	await pause();

	expect(__css__.sheet['cssRules'].length).toBe(2);
	expect(__css__.sheet['cssRules'][1].selectorText).toBe('.10hl3mm,.qux-10hl3mm,.foo-10hl3mm');

	// Client: revert class
	process.env.RUN_AT = 'client';
	cx = css({'foo': {color: 'red'}});

	await pause();

	expect(__css__.sheet['cssRules'].length).toBe(2);
	expect(__css__.sheet['cssRules'][0].selectorText).toBe('.mujwv,.foo-mujwv,.bar-mujwv');
	expect(__css__.sheet['cssRules'][1].selectorText).toBe('.10hl3mm,.qux-10hl3mm,.foo-10hl3mm');
});

it(':host', () => {
	process.env.RUN_AT = 'server';

	const cx = css({
		':host': {
			color: 'red',
			'&:focus': {color: 'blue'},
		},
		':host + :host': {marginTop: 3},
		'item': {color: 'red'},
	});

	expect(cx[':host']).toBe('_rs');
	expect(getUsedCSS()).toEqual({
		names: ['t7j1ge', 'mujwv', 'a4h9z4'],
		cssText: '._rs:focus{color:blue;}\n._rs,._rt{color:red;}\n._rs + ._rs{margin-top:3px;}\n',
	});
});
