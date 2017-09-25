import {
	core as stdlib,
	dom as stddom,
} from '@exility/stdlib';
import Block from '@exility/block';
import createDOMCompiler from '../compiler/compiler';
import reload from './reload';

const domCompiler = createDOMCompiler({
	scope: ['x', 'y', 'z', '__this__'],
	isomorphic: true,
});

const domCompilerWithBlocks = createDOMCompiler({
	blocks: ['Foo'],
	scope: ['x', 'y', 'z', '__blocks__'],
	isomorphic: true,
});


function compile(tpl, hasBlocks = false) {
	return (hasBlocks ? domCompilerWithBlocks : domCompiler)(tpl)({
		stdlib,
		stddom,
	});
}

function newScope(blocks?, initialScope?) {
	let scope = {
		__blocks__: blocks,
		...Object(initialScope),
	};

	return (patch = {}) => {
		scope = {...scope, ...patch};
		return scope;
	};
}

function fromString(tpl, data?, debug?) {
	const domTemplate = compile(tpl, !!data.__blocks__);

	debug && console.log(domTemplate.toString());

	const view = domTemplate(data, {});
	const root = document.createElement('div');

	view.reload = function (template, scope) {
		reload(view, template, scope);
	};

	view.mountTo(root);

	return view;
}

it('reload / attrs', () => {
	const scope = newScope();
	const view = fromString('h1.is-${x}', scope({x: 'foo'}));

	expect(view.container.innerHTML).toBe('<h1 class="is-foo"></h1>');

	view.reload(compile('h1.has-${x}'), scope());
	expect(view.container.innerHTML).toBe('<h1 class="has-foo"></h1>');

	view.update(scope({x: 'qux'}));
	expect(view.container.innerHTML).toBe('<h1 class="has-qux"></h1>');
});

it('reload / events', () => {
	const log = [];
	const scope = newScope(null, {
		__this__: {
			'@click': ({type}) => log.push(type),
			'@mousedown': ({type}) => log.push(type),
		},
	});
	const view = fromString('h1[@click]', scope({}));

	expect(view.container.innerHTML).toBe('<h1></h1>');
	view.container.firstChild.dispatchEvent(new Event('click'));

	view.reload(compile('h1[@mousedown]'), scope());
	expect(view.container.innerHTML).toBe('<h1></h1>');

	view.container.firstChild.dispatchEvent(new Event('click'));
	view.container.firstChild.dispatchEvent(new Event('mousedown'));

	expect(log).toEqual(['click', 'mousedown']);
});

it('reload / value', () => {
	const scope = newScope();
	const view = fromString('h1 | ${x}\nb', scope({x: 1, y: '!'}));

	expect(view.container.innerHTML).toBe('<h1>1</h1><b></b>');

	view.reload(compile('h1 | -${y}-'), scope());
	expect(view.container.innerHTML).toBe('<h1>-!-</h1>');

	view.update(scope({y: 2}));
	expect(view.container.innerHTML).toBe('<h1>-2-</h1>');

	view.reload(compile('h1 | -${y}-${x}-'), scope());
	expect(view.container.innerHTML).toBe('<h1>-2-1-</h1>');

	view.update(scope({x: 2, y: 1}));
	expect(view.container.innerHTML).toBe('<h1>-1-2-</h1>');

	view.reload(compile('h2 | ${x}-${y}'), scope());
	expect(view.container.innerHTML).toBe('<h2>2-1</h2>');
});

it('reload / if', () => {
	const scope = newScope();
	const view = fromString('h1\n\t| ${x}', scope({x: 1, y: '!'}));

	expect(view.container.innerHTML).toBe('<h1>1</h1>');

	view.reload(compile('h1\n\t| ${x}\n\tif (x) > i | ${y}'), scope());
	expect(view.container.innerHTML).toBe('<h1>1<i>!</i></h1>');

	view.update(scope({y: '?'}));
	expect(view.container.innerHTML).toBe('<h1>1<i>?</i></h1>');

	view.update(scope({x: 0}));
	expect(view.container.innerHTML).toBe('<h1>0</h1>');

	view.update(scope({x: 1, y: 'wow'}));
	expect(view.container.innerHTML).toBe('<h1>1<i>wow</i></h1>');
});

it('reload / for', () => {
	const scope = newScope();
	const view = fromString('div > for (i in x) > | ${i}', scope({x: [1, 2, 3]}));

	expect(view.container.innerHTML).toBe('<div>123</div>');

	view.reload(compile('ul > for (i in x) > li | ${i}'), scope());
	expect(view.container.innerHTML).toBe('<ul><li>1</li><li>2</li><li>3</li></ul>');

	view.update(scope({x: [2, 1]}));
	expect(view.container.innerHTML).toBe('<ul><li>2</li><li>1</li></ul>');

	view.reload(compile('ol > for (i in x) > if (i % 2) > li | ${i}'), scope({x: [3, 2, 1, 0]}));
	expect(view.container.innerHTML).toBe('<ol><li>3</li><li>1</li></ol>');

	view.update(scope({x: [1, 2, 3]}));
	expect(view.container.innerHTML).toBe('<ol><li>1</li><li>3</li></ol>');
});

it('reload / blocks', () => {
	const log = [];

	class Foo extends Block<{val: string}, null> {
		static template = `i | OK`;

		connectedCallback() {
			log.push(`mount:${this.attrs.val}`);
		}

		disconnectedCallback() {
			log.push(`unmount:${this.attrs.val}`);
		}
	}

	const scope = newScope({Foo});
	const view = fromString('div > Foo', scope());

	expect(view.container.innerHTML).toBe('<div><i>OK</i></div>');

	// Обновляем шаблон!
	Foo.template = `b | \${attrs.val}!`;
	delete Foo.prototype['__template__'];

	view.reload(compile('div > Foo[val=${x}]', true), scope({x: 'Wow'}));

	expect(view.container.innerHTML).toBe('<div><b>Wow!</b></div>');

	view.update(scope({x: 'Yes'}));

	expect(view.container.innerHTML).toBe('<div><b>Yes!</b></div>');
	expect(log).toEqual([
		'mount:undefined',
		'unmount:undefined',
		'mount:Wow',
	]);
});
