import Block from '@exility/block';
import {
	core as stdlib,
	dom as stddom,
} from '@exility/stdlib';

import compilter from './compiler';

export function fromString(template, scope = {}, pure?: boolean, blocks?) {
	if (blocks) {
		scope['__blocks__'] = blocks;
	}

	const compile = compilter({
		pure,
		debug: true,
		scope: Object.keys(scope),
		blocks: Object.keys(blocks || {}),
	});
	const templateFactory = compile(template);

	// console.log(templateFactory.toString());

	const view = templateFactory(pure ? null : {stddom, stdlib})(scope);

	view.templateFactory = templateFactory;

	if (view.mountTo) {
		view.mountTo(document.createElement('div'));
	} else {
		throw view.toString();
	}

	return view;
}

export async function pause(ms: number = 16) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

it('Icon', () => {
		const view = fromString(`
		Icon = [name]
			i.icon-\${name}

		Icon[name=\${x}]
	`, {x: 'foo'});

	expect(view.templateFactory).toMatchSnapshot();
	expect(view.container.innerHTML).toBe('<i class="icon-foo"></i>');

	view.update({x: 'bar'});
	expect(view.container.innerHTML).toBe('<i class="icon-bar"></i>');
});

it('Icon (short)', () => {
	const view = fromString(`
		Icon = [name] > i.icon-\${name}

		Icon[name=\${x}]
	`, {x: 'foo'});

	expect(view.templateFactory).toMatchSnapshot();
	expect(view.container.innerHTML).toBe('<i class="icon-foo"></i>');

	view.update({x: 'bar'});
	expect(view.container.innerHTML).toBe('<i class="icon-bar"></i>');
});

it('XIf', () => {
	const view = fromString(`
		XIf = [expr] > if (expr) > b
		
		XIf[expr=\${val}]
	`, {val: false});

	expect(view.container.innerHTML).toBe('');

	view.update({val: true});
	expect(view.container.innerHTML).toBe('<b></b>');

	view.update({val: false});
	expect(view.container.innerHTML).toBe('');
});

it('Btn -> Sync', () => {
	const view = fromString('Btn[value=${val}]', {val: 'Wow'}, null, {
		'Btn': {
			template: 'button | ${attrs.value}',
		}
	});

	expect(view.templateFactory).toMatchSnapshot();
	expect(view.container.innerHTML).toBe('<button>Wow</button>');

	view.update({val: 'Wow!1'});
	expect(view.container.innerHTML).toBe('<button>Wow!1</button>');
});

it('Btn / Events', () => {
	const events = [];
	const view = fromString('Btn[value=\${val}]', {val: 'Wow'}, null, {
		'Btn': {
			template: 'button[@click @mousedown="down" @mouseup="up ${attrs}"]',
			connectedCallback() { events.push('connected'); },
			'@click'(evt) { events.push(evt); },
			'@down'(evt) { events.push(evt); },
			'@up'(evt) { events.push(evt); },
		}
	});

	expect(events[0]).toBe('connected');

	view.container.firstChild.dispatchEvent(new Event('click'));
	expect(events[1].type).toBe('click');
	expect(events[1].detail).toBe(null);

	view.container.firstChild.dispatchEvent(new Event('mousedown'));
	expect(events[2].type).toBe('down');
	expect(events[2].detail).toBe(null);

	view.container.firstChild.dispatchEvent(new Event('mouseup'));
	expect(events[3].type).toBe('up');
	expect(events[3].detail).toEqual({attrs: {value: 'Wow'}});

	expect(events.length).toBe(4);
});

it('Btn -> Async', async () => {
	const log = [];
	const view = fromString('Btn[value=${val}]', {val: 'Wow'}, null, {
		'Btn': () => Promise.resolve({
			template: 'button | ${attrs.value}',
			connectedCallback() { log.push('connected'); }
		}),
	});

	expect(log).toEqual([]);
	expect(view.container.innerHTML).toBe('<div data-block=\"Btn\" class=\"block-dummy block-dummy-loading\"></div>');

	await pause();

	expect(log[0]).toBe('connected');
	expect(view.container.innerHTML).toBe('<button>Wow</button>');

	view.update({val: 'Wow!1'});

	expect(log.length).toBe(1);
	expect(view.container.innerHTML).toBe('<button>Wow!1</button>');
});

it('Pseudo Elements', () => {
	const view = fromString(`Pseudo[value=\${text}]`, {text: 'Original'}, null, {
		'Pseudo': {
			template: 'div > ::children | ${attrs.value}',
		},
	});

	expect(view.container.innerHTML).toBe('<div>Original</div>');

	view.update({text: 'Wow!'});
	expect(view.container.innerHTML).toBe('<div>Wow!</div>');
});

it('Pseudo Elements: override by default', () => {
	const view = fromString(`Pseudo | \${text}`, {text: 'Wow'}, null, {
		'Pseudo': {
			template: 'div > ::children | Fail'
		},
	});

	expect(view.container.innerHTML).toBe('<div>Wow</div>');

	view.update({text: 'WowWow!'});
	expect(view.container.innerHTML).toBe('<div>WowWow!</div>');
});

it('Pseudo Elements: override by name', () => {
	const view = fromString(
		`Pseudo > ::children | \${text}`,
		{text: 'Wow'}, null, {
		'Pseudo': {
			template: 'div > ::children | Fail'
		}
	});

	expect(view.container.innerHTML).toBe('<div>Wow</div>');

	view.update({text: 'WowWow!'});
	expect(view.container.innerHTML).toBe('<div>WowWow!</div>');
});

it('Pseudo Elements: super', () => {
	const Pseudo = Block.classify({
		template: 'div > ::children | Original:${attrs.value}'
	});
	const view = fromString(
		'Pseudo[value=${x}] > ::children\n  | ${text}:\n  ::super.children',
		{x: 1, text: 'OK'}, null,
		{Pseudo}
	);

	expect(Pseudo.prototype['__template__']).toMatchSnapshot();
	expect(view.container.innerHTML).toBe('<div>OK:Original:1</div>');

	view.update({text: 'Wow', x: 2});
	expect(view.container.innerHTML).toBe('<div>Wow:Original:2</div>');
});

it('__attrs__', () => {
	const Nested = Block.classify({
		template: 'div | ${attrs.foo} + ${attrs.bar} + ${attrs.baz}'
	});
	const view = fromString(
		'Nested[__attrs__=${attrs} baz=${val}]',
		{attrs: {foo: 1, bar: 'OK'}, val: '!'},
		null,
		{Nested}
	);

	expect(view.templateFactory).toMatchSnapshot();
	expect(view.container.innerHTML).toBe('<div>1 + OK + !</div>');

	view.update({attrs: {foo: 'X', bar: 'Y'}, val: '?'});
	expect(view.container.innerHTML).toBe('<div>X + Y + ?</div>');
});

it('Inner blocks', () => {
	const log = [];
	const Link = class extends Block<{}> {
		static template = 'a[href=${attrs.href}] > ::children';
		connectedCallback() { log.push('Link:connected'); }
		disconnectedCallback() { log.push('Link:disconnected'); }
	};

	const Alert = class extends Block<{}> {
		static blocks = {Link};
		static template = '.alert > ::children';
		connectedCallback() { log.push('Alert:connected'); }
		disconnectedCallback() { log.push('Alert:disconnected'); }
	};

	const view = fromString(
		'if (x) > Alert > #|Wow, <Link href="#">click me!</Link>|#',
		{x: true},
		null,
		{Alert, Link},
	);

	expect(view.container.innerHTML).toBe('<div class=\"alert\">Wow, <a href=\"#\">click me!</a></div>');

	view.update({});

	expect(view.container.innerHTML).toBe('');
	expect(log).toEqual(['Alert:connected', 'Link:connected', 'Alert:disconnected', 'Link:disconnected']);
});

it('CSS Module', () => {
	class Foo extends Block<{}> {
		static template = '.alert.${attrs.x}.is-${attrs.y} > ::children';
		static classNames: object = {
			'alert': '_$a',
			'warn': '_$w',
			'info': '_$i',
			'is-active': '_$ia',
			'is-disabled': '_$id',
			'and': '_$1',
			'detailed': '_$2',
		};
	}

	const view = fromString(
		'Foo[x=${x} y=${y}]',
		{x: 'warn', y: 'active'},
		null,
		{Foo}
	);

	expect(Foo.prototype['__template__']).toMatchSnapshot();
	expect(view.container.innerHTML).toBe('<div class=\"_$a _$w _$ia\"></div>');

	view.update({x: 'info', y: 'disabled'});
	expect(view.container.innerHTML).toBe('<div class=\"_$a _$i _$id\"></div>');

	view.update({x: 'info and detailed', y: 'disabled'});
	expect(view.container.innerHTML).toBe('<div class=\"_$a _$i _$1 _$2 _$id\"></div>');

	Foo.classNames = {'alert': '__$alert$__'};
	view.update({});
	expect(view.container.innerHTML).toBe('<div class=\"__$alert$__ [warn: null] [warn: is-null]\"></div>');
});
