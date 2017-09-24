import {core as stdlib} from '@exility/stdlib';
import Block from '@exility/block';
import compilerFactory from './compiler';

function fromString(input: string, scope?: string[], blocks = {}) {
	if (blocks) {
		scope.push('__blocks__');
	}

	const compiler = compilerFactory({
		debug: true,
		scope,
		blocks: Object.keys(blocks),
	});

	const factory = compiler(input);
	const template = factory({stdlib});

	template.factory = factory;

	return template;
}

it('Icon', () => {
	const template = fromString(`
		Icon = [name]
			i.icon-\${name}

		Icon[name=\${x}]
	`, ['x']);

	expect(template.factory).toMatchSnapshot();
	expect(template({x: 'foo'})).toBe('<i class="icon-foo"></i>');
});

it('Icon (short)', () => {
	const template = fromString(`
		Icon = [name] > i.icon-\${name}

		Icon[name=\${x}]
	`, ['x']);

	expect(template.factory).toMatchSnapshot();
	expect(template({x: 'foo'})).toBe('<i class="icon-foo"></i>');
});

it('XIf', () => {
	const template = fromString(`
		XIf = [expr] > if (expr) > b
		
		XIf[expr=\${val}]
	`, ['val']);

	expect(template({val: false})).toBe('');
	expect(template({val: true})).toBe('<b></b>');
});

it('Btn -> Sync', () => {
	const __blocks__ = {'Btn': {template: 'button | ${attrs.value}'}};
	const template = fromString('Btn[value=${val}]', ['val'], __blocks__);

	expect(template({val: 'Wow', __blocks__})).toBe('<button>Wow</button>');
});

it('Btn -> Async', async () => {
	const __blocks__ = {'Btn': () => {}};
	const template = fromString('Btn[value=${val}]', ['val'], __blocks__);

	expect(template({val: 'Wow', __blocks__})).toBe(
		'<div data-block=\"Btn\" class=\"block-dummy block-dummy-loading\"></div>'
	);
});

it('Pseudo Elements', () => {
	const __blocks__ = {'Pseudo': {template: 'div > ::children | ${attrs.value}'}};
	const template = fromString(`Pseudo[value=\${text}]`, ['text'], __blocks__);

	expect(template({text: 'Wow', __blocks__})).toBe('<div>Wow</div>');
	expect(template.factory).toMatchSnapshot();
});

it('Pseudo Elements: override default', () => {
	const __blocks__ = {'Pseudo': {template: 'div > ::children | fail'}};
	const template = fromString(`Pseudo | OK`, [], __blocks__);

	expect(template({__blocks__})).toBe('<div>OK</div>');
	expect(template.factory).toMatchSnapshot();
});

it('Pseudo Elements: override by name', () => {
	const __blocks__ = {'Pseudo': {template: 'div > ::slotik | fail'}};
	const template = fromString(`Pseudo > ::slotik | OK`, [], __blocks__);

	expect(template({__blocks__})).toBe('<div>OK</div>');
	expect(template.factory).toMatchSnapshot();
});

it('Pseudo Elements: super', () => {
	const Pseudo = Block.classify({template: 'div > ::children | Original:${attrs.value}'});
	const __blocks__ = {Pseudo};
	const template = fromString(
		'Pseudo[value=${x}] > ::children\n  | ${text}:\n  ::super.children',
		['x', 'text'],
		__blocks__,
	);

	expect(template.factory).toMatchSnapshot();
	expect(Pseudo.prototype['__template__']).toMatchSnapshot();
	expect(template({x: 1, text: 'OK', __blocks__})).toBe('<div>OK:Original:1</div>');
});

it('CSS Module', () => {
	const Foo = class extends Block<{}, null> {
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
	};
	const __blocks__ = {Foo};
	const template = fromString(
		'Foo[x=${x} y=${y}] > i.icon',
		['x', 'y'],
		__blocks__,
	);


	expect(template({__blocks__, x: 'warn', y: 'active'})).toBe('<div class=\"_$a _$w _$ia\"><i class=\"icon\"></i></div>');
	expect(template({__blocks__, x: 'info', y: 'disabled'})).toBe('<div class=\"_$a _$i _$id\"><i class=\"icon\"></i></div>');
	expect(template({__blocks__, x: 'info and detailed', y: 'disabled'})).toBe('<div class=\"_$a _$i _$1 _$2 _$id\"><i class=\"icon\"></i></div>');

	Foo.classNames = {'alert': '__$alert$__'};
	expect(template({__blocks__})).toBe('<div class=\"__$alert$__ [warn: is-]\"><i class=\"icon\"></i></div>');

	expect(Foo.prototype['__template__']).toMatchSnapshot();
});

it('Context', () => {
	const Qux = class extends Block<{}, {value: string, postfix: string}> {
		static template = 'i | ${context.value}${context.postfix}';
	};

	const Bar = class extends Block<{}, {value: string}> {
		static blocks = {Qux};
		static template = 'Qux';

		getContextForNested() {
			return {postfix: '!'};
		}
	};

	const Foo = class extends Block<{x: string}, null> {
		static blocks = {Bar};
		static template = 'Bar';

		getContextForNested() {
			return {value: this.attrs.x};
		}
	};
	const __blocks__ = {Foo};
	const template = fromString(
		'Foo[x=${x}]',
		['x', 'y'],
		__blocks__,
	);


	expect(template({__blocks__, x: '123'})).toBe('<i>123!</i>');
});
