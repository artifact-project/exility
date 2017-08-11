import css, {getUsedCSS, resetCSS, setStyleNode} from './css';

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
		},

		'bar': {
			marginLeft: 10,
		},
	});

	expect(cx.foo).toBe('_rs');
	expect(cx.bar).toBe('_rt');
	expect(getUsedCSS().cssText.trim().split('\n')).toEqual([
		`.${cx.foo} + .${cx.foo},.${cx.bar}{margin-left:10px;}`,
		`.${cx.foo}.${cx.bar}{opacity:0.5;}`,
		`.${cx.foo}{color:red;}`
	]);
});

it('dev', () => {
	process.env.NODE_ENV = 'dev';

	const cx = css({'foo': {color: 'red'}});

	expect(cx.foo).toBe('foo-nnolt3');
	expect(getUsedCSS(true)).toEqual({
		names: ['nnolt3'],
		cssText: '.nnolt3,.foo-nnolt3{color:red;}\n',
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
	expect(__css__.sheet['cssRules'][0].selectorText).toBe('.nnolt3,.foo-nnolt3');

	// Client: add class (deduplicate)
	process.env.RUN_AT = 'client';
	cx = css({'bar': {color: 'red'}});

	await pause();

	expect(__css__.sheet['cssRules'].length).toBe(1);
	expect(__css__.sheet['cssRules'][0].selectorText).toBe('.nnolt3,.foo-nnolt3,.bar-nnolt3');

	// Client: add class
	process.env.RUN_AT = 'client';
	cx = css({'qux': {color: 'green'}});

	await pause();

	expect(__css__.sheet['cssRules'].length).toBe(2);
	expect(__css__.sheet['cssRules'][1].selectorText).toBe('.g8rsf,.qux-g8rsf');

	// Client: change class
	process.env.RUN_AT = 'client';
	cx = css({'foo': {color: 'green'}});

	await pause();

	expect(__css__.sheet['cssRules'].length).toBe(2);
	expect(__css__.sheet['cssRules'][1].selectorText).toBe('.g8rsf,.qux-g8rsf,.foo-g8rsf');

	// Client: revert class
	process.env.RUN_AT = 'client';
	cx = css({'foo': {color: 'red'}});

	await pause();

	expect(__css__.sheet['cssRules'].length).toBe(2);
	expect(__css__.sheet['cssRules'][0].selectorText).toBe('.nnolt3,.foo-nnolt3,.bar-nnolt3');
	expect(__css__.sheet['cssRules'][1].selectorText).toBe('.g8rsf,.qux-g8rsf,.foo-g8rsf');
});
