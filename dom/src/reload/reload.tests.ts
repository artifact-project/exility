import {
	core as stdlib,
	dom as stddom,
} from '@exility/stdlib';
import Block from '@exility/block';
import createDOMCompiler from '../compiler/compiler';
import reload from './reload';

const domCompiler = createDOMCompiler({
	scope: ['x', 'y', 'z'],
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

function newScope(blocks?) {
	let scope = {
		__blocks__: blocks,
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


it('reload / value', () => {
	let scope = newScope();
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
	let scope = newScope();
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
	let scope = newScope();
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
	class Foo extends Block<null> {
		static template = `i | OK`;
	}

	let scope = newScope({Foo});
	const view = fromString('div > Foo', scope());

	expect(view.container.innerHTML).toBe('<div><i>OK</i></div>');

	// Обновляем шаблон!
	Foo.template = `i | \${attrs.val}!`;
	delete Foo.prototype['__template__'];

	view.reload(compile('div > Foo[val=${x}]', true), scope({x: 'Wow'}));

	expect(view.container.innerHTML).toBe('<div><i>Wow!</i></div>');

	view.update(scope({x: 'Yes'}));
	expect(view.container.innerHTML).toBe('<div><i>Wow!</i></div>');
});
