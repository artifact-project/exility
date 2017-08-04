import {
	core as stdlib,
	dom as stddom,
} from '@exility/stdlib';
import {createCompiler as createStringCompiler} from '@exility/string';

import createDOMCompiler from '../compiler/compiler';
import {pause} from '../compiler/compiler.blocks.tests';

const stringCompiler = createStringCompiler({
	scope: ['x', 'y', 'z'],
	metaComments: true,
});

const domCompiler = createDOMCompiler({
	scope: ['x', 'y', 'z'],
	isomorphic: true,
});

const stringCompilerWithBlocks = createStringCompiler({
	blocks: ['XFoo'],
	scope: ['x', 'y', 'z', '__blocks__'],
	metaComments: true,
});

const domCompilerWithBlocks = createDOMCompiler({
	blocks: ['XFoo'],
	scope: ['x', 'y', 'z', '__blocks__'],
	isomorphic: true,
});

function fromString(tpl, initialData, actualData, debug?) {
	const stringTemplate = stringCompiler(tpl)({stdlib});
	const domTemplate = domCompiler(tpl)({stdlib, stddom});
	const container = document.createElement('div');

	container.innerHTML = stringTemplate(initialData);
	debug && console.log(domTemplate.toString());

	const view = domTemplate(actualData, {isomorphic: container});

	view.mountTo(container);

	return {view, container};
}

function fromStringWithBlocks(tpl, initialData, actualData, debug?) {
	const stringTemplate = stringCompilerWithBlocks(tpl)({stdlib});
	const domTemplate = domCompilerWithBlocks(tpl)({stdlib, stddom});
	const container = document.createElement('div');

	initialData.__blocks__ = {...initialData.__blocks__};
	container.innerHTML = stringTemplate(initialData);
	debug && console.log(domTemplate.toString());

	const view = domTemplate(actualData, {isomorphic: container});

	view.mountTo(container);

	return {view, container};
}

it('iso / value', () => {
	const {view, container} = fromString(
		'h1 | ${x}?\n.is-${y} | Hi, ${z}, how are you?',
		{z: 'fail'},
		{x: 'Wow!', y: 'user', z: 'Zorro'},
	);

	expect(container.innerHTML).toBe('<h1><!--(-->Wow!<!--)-->?</h1><div class=\"is-user\">Hi, <!--(-->Zorro<!--)-->, how are you?</div>');

	view.update({x: 'ok', y: 'super-user', z: 'RubaXa'});
	expect(container.innerHTML).toBe('<h1><!--(-->ok<!--)-->?</h1><div class=\"is-super-user\">Hi, <!--(-->RubaXa<!--)-->, how are you?</div>');
});

it('iso / if / false -> false', () => {
	const {view, container} = fromString(
		'if (x)\n  | ${y}\nb | ${z}',
		{z: 1},
		{z: 1},
	);

	expect(container.innerHTML).toBe('<!--if1--><!--/if1--><b><!--(-->1<!--)--></b>');

	view.update({x: true, y: 'foo'});
	expect(container.innerHTML).toBe('<!--if1-->foo<!--/if1--><b><!--(--><!--)--></b>');

	view.update({x: true, y: 'bar', z: 11});
	expect(container.innerHTML).toBe('<!--if1-->bar<!--/if1--><b><!--(-->11<!--)--></b>');
});

it('iso / if / false -> true', () => {
	const {view, container} = fromString(
		'if (x)\n  | ${y}\nb | ${z}',
		{z: 2},
		{x: true, y: 'foo', z: 2},
	);

	expect(container.innerHTML).toBe('<!--if1-->foo<!--/if1--><b><!--(-->2<!--)--></b>');

	view.update({x: true, y: 'bar', z: 22});
	expect(container.innerHTML).toBe('<!--if1-->bar<!--/if1--><b><!--(-->22<!--)--></b>');

	view.update({});
	expect(container.innerHTML).toBe('<!--if1--><!--/if1--><b><!--(--><!--)--></b>');
});

it('iso / if / true -> true', () => {
	const {view, container} = fromString(
		'if (x)\n  | ${y}\nb | ${z}',
		{x: true, z: 3},
		{x: true, y: 'foo'},
	);

	expect(container.innerHTML).toBe('<!--if1--><!--(-->foo<!--)--><!--/if1--><b><!--(--><!--)--></b>');

	view.update({x: true, y: 'bar', z: 33});
	expect(container.innerHTML).toBe('<!--if1--><!--(-->bar<!--)--><!--/if1--><b><!--(-->33<!--)--></b>');

	view.update({});
	expect(container.innerHTML).toBe('<!--if1--><!--(--><!--)--><!--/if1--><b><!--(--><!--)--></b>');

	view.update({x: true, y: 'qux'});
	expect(container.innerHTML).toBe('qux<!--if1--><!--(--><!--)--><!--/if1--><b><!--(--><!--)--></b>');
});

it('iso / if / true -> false', () => {
	const {view, container} = fromString(
		'if (x)\n  | ${y}\nb | ${z}',
		{x: true, y: 'foo', z: 4},
		{},
	);

	expect(container.innerHTML).toBe('<!--if1--><!--/if1--><b><!--(--><!--)--></b>');

	view.update({x: true, y: 'bar', z: 44});
	expect(container.innerHTML).toBe('<!--if1-->bar<!--/if1--><b><!--(-->44<!--)--></b>');
});

it('iso / for / [] -> []', () => {
	const {view, container} = fromString(
		'for (i in x)\n  | ${i}\nb | ${y}',
		{y: 1},
		{y: 1},
	);

	expect(container.innerHTML).toBe('<!--for1--><!--/for1--><b><!--(-->1<!--)--></b>');

	view.update({x: ['a', 'b'], y: 11});
	expect(container.innerHTML).toBe('<!--for1-->ab<!--/for1--><b><!--(-->11<!--)--></b>');
});

it('iso / for / [] -> [a, b]', () => {
	const {view, container} = fromString(
		'for (i in x)\n  | ${i}\nb | ${y}',
		{y: 2},
		{x: ['a', 'b'], y: 22},
	);

	expect(container.innerHTML).toBe('<!--for1-->ab<!--/for1--><b><!--(-->22<!--)--></b>');

	view.update({x: ['c'], y: 222});
	expect(container.innerHTML).toBe('<!--for1-->c<!--/for1--><b><!--(-->222<!--)--></b>');

	view.update({x: [], y: 2222});
	expect(container.innerHTML).toBe('<!--for1--><!--/for1--><b><!--(-->2222<!--)--></b>');

	view.update({x: ['a']});
	expect(container.innerHTML).toBe('<!--for1-->a<!--/for1--><b><!--(--><!--)--></b>');
});

it('iso / for / [a, b] -> [a, b, c]', () => {
	const {view, container} = fromString(
		'for (i in x)\n  | ${i}\nb | ${y}',
		{x: ['a', 'b'], y: 3},
		{x: ['a', 'b', 'c'], y: 33},
	);

	expect(container.innerHTML).toBe('<!--for1--><!--(-->a<!--)--><!--(-->b<!--)-->c<!--/for1--><b><!--(-->33<!--)--></b>');

	view.update({x: ['a', 'b', 'c', 'd'], y: 333});
	expect(container.innerHTML).toBe('<!--for1--><!--(-->a<!--)--><!--(-->b<!--)-->cd<!--/for1--><b><!--(-->333<!--)--></b>');

	view.update({x: [], y: 3333});
	expect(container.innerHTML).toBe('<!--for1--><!--(--><!--)--><!--(--><!--)--><!--/for1--><b><!--(-->3333<!--)--></b>');

	view.update({x: ['a'], y: 3333});
	expect(container.innerHTML).toBe('<!--for1--><!--(--><!--)--><!--(--><!--)-->a<!--/for1--><b><!--(-->3333<!--)--></b>');
});

it('iso / for / [a, b, c] -> [a, b]', () => {
	const {view, container} = fromString(
		'for (i in x)\n  | ${i}\nb | ${y}',
		{x: ['a', 'b', 'c'], y: 4},
		{x: ['a', 'b'], y: 44},
	);

	expect(container.innerHTML).toBe('<!--for1--><!--(-->a<!--)--><!--(-->b<!--)--><!--/for1--><b><!--(-->44<!--)--></b>');

	view.update({x: ['a', 'x', 'c', 'd'], y: 444});
	expect(container.innerHTML).toBe('<!--for1--><!--(-->a<!--)--><!--(-->x<!--)-->cd<!--/for1--><b><!--(-->444<!--)--></b>');

	view.update({x: [], y: 4444});
	expect(container.innerHTML).toBe('<!--for1--><!--(--><!--)--><!--(--><!--)--><!--/for1--><b><!--(-->4444<!--)--></b>');

	view.update({x: ['a', 'b'], y: 4444});
	expect(container.innerHTML).toBe('<!--for1--><!--(--><!--)--><!--(--><!--)-->ab<!--/for1--><b><!--(-->4444<!--)--></b>');
});

it('iso / for / [a, b] -> []', () => {
	const {view, container} = fromString(
		'for (i in x)\n  | ${i}\nb | ${y}',
		{x: ['a', 'b'], y: 5},
		{x: [], y: 55},
	);

	expect(container.innerHTML).toBe('<!--for1--><!--/for1--><b><!--(-->55<!--)--></b>');

	view.update({x: ['a', 'b'], y: 555});
	expect(container.innerHTML).toBe('<!--for1-->ab<!--/for1--><b><!--(-->555<!--)--></b>');
});

it('iso / if + for', () => {
	const {view, container} = fromString(
		`
			form > if (x) > fieldset > for (i in y)
				if (i % 2) > b | Item: \${i}
				else > | Text: \${i}
			b | \${z}
		`,
		{x: true, y: [1, 2]},
		{x: true, y: [1, 2, 3]},
	);

	expect(container.innerHTML).toBe(
		'<form><!--if3--><fieldset><!--for2-->' +
		'<!--if1--><b>Item: <!--(-->1<!--)--></b><!--/if1-->' +
		'<!--if1-->Text: <!--(-->2<!--)--><!--/if1-->' +
		'<b>Item: 3</b>' +
		'<!--/for2--></fieldset><!--/if3--></form>' +
		'<b><!--(--><!--)--></b>'
	);

	view.update({x: true, y: [5], z: 'wow'});
	expect(container.innerHTML).toBe(
		'<form><!--if3--><fieldset><!--for2-->' +
		'<!--if1--><b>Item: <!--(-->5<!--)--></b><!--/if1-->' +
		'<!--if1--><!--(--><!--)--><!--/if1-->' +
		'<!--/for2--></fieldset><!--/if3--></form>' +
		'<b><!--(-->wow<!--)--></b>'
	);

	view.update({z: 'ok'});
	expect(container.innerHTML).toBe(
		'<form><!--if3--><!--/if3--></form>' +
		'<b><!--(-->ok<!--)--></b>'
	);

	view.update({x: true, y: [7, 8, 9]});
	expect(container.innerHTML).toBe(
		'<form><fieldset><!--for2-->' +
		'<!--if1--><b>Item: <!--(-->7<!--)--></b><!--/if1-->' +
		'<!--if1--><!--(--><!--)--><!--/if1-->' +
		'Text: 8' +
		'<b>Item: 9</b>' +
		'<!--/for2--></fieldset><!--if3--><!--/if3--></form>' +
		'<b><!--(--><!--)--></b>'
	);
});

it('iso / XFooSync', () => {
	const log = [];
	const __blocks__ = {
		XFoo: {
			template: 'h1 | ${attrs.name}',
			connectedCallback() { log.push('connected'); },
		},
	};
	const {view, container} = fromStringWithBlocks(
		'XFoo[name=${x}]',
		{__blocks__, x: 'fail'},
		{__blocks__, x: 'Exility'},
	);

	expect(log).toEqual(['connected']);
	expect(container.innerHTML).toBe('<h1><!--(-->Exility<!--)--></h1>');

	view.update({__blocks__, x: 'OK'});
	expect(container.innerHTML).toBe('<h1><!--(-->OK<!--)--></h1>');
});

it('iso / XFooAsync', async () => {
	const log = [];
	const __blocks__ = {
		XFoo: () => Promise.resolve({
			template: 'h1 | ${attrs.name}',
			connectedCallback() { log.push('connected'); },
		}),
	};
	const {view, container} = fromStringWithBlocks(
		'XFoo[name=${x}]',
		{__blocks__, x: 'fail'},
		{__blocks__, x: 'Exility'},
	);

	expect(log).toEqual([]);
	expect(container.innerHTML).toBe('<div data-block="XFoo" class="block-dummy block-dummy-loading"></div>');

	await pause();
	expect(log).toEqual(['connected']);

	expect(container.innerHTML).toBe('<h1>Exility</h1>');

	view.update({__blocks__, x: 'OK'});
	expect(container.innerHTML).toBe('<h1>OK</h1>');
});

it('iso / XFooSuper', () => {
	const XFoo = {template: 'div > ::children | Original:${attrs.value}'};
	const __blocks__ = {XFoo};
	const {view, container} = fromStringWithBlocks(
		'XFoo[value=${x}] > ::children\n  | ${y}:\n  ::super.children',
		{__blocks__, x: 1, y: 'fail'},
		{__blocks__, x: 2, y: 'OK'},
	);

	expect(container.innerHTML).toBe('<div><!--(-->OK<!--)-->:Original:<!--(-->2<!--)--></div>');

	view.update({__blocks__, x: 3, y: 'Yes'});

	expect(container.innerHTML).toBe('<div><!--(-->Yes<!--)-->:Original:<!--(-->3<!--)--></div>');
});

it('iso / page', async () => {
	const sandboxFactory = document.createElement('iframe');

	document.body.appendChild(sandboxFactory);
	await pause();

	const sandbox = sandboxFactory.contentDocument;

	sandbox.open();
	sandbox.write(createStringCompiler({
		scope: ['title', 'content', 'state'],
		metaComments: true,
	})(`
		!html
		html
			head > title[innerHTML=\${title}]
			body.is-\${state} | \${content}
	`)({stdlib})({
		state: 'backend',
		title: 'Initial',
		content: 'Ready',
	}));
	sandbox.close();

	expect(sandbox.title).toBe('Initial');
	expect(sandbox.body.className).toBe('is-backend');
	expect(sandbox.body.innerHTML).toBe('<!--(-->Ready<!--)-->');

	const view = createDOMCompiler({
		scope: ['title', 'content', 'state'],
		isomorphic: true,
	})(`
		!html
		html
			head > title[innerHTML=\${title}]
			body.is-\${state} | \${content}
	`)({stdlib, stddom})({
		state: 'client',
		title: 'Wow!',
		content: 'Norm',
	}, {
		isomorphic: sandbox
	});

	expect(sandbox.title).toBe('Wow!');
	expect(sandbox.body.className).toBe('is-client');
	expect(sandbox.body.innerHTML).toBe('<!--(-->Norm<!--)-->');

	view.update({
		state: 'interactive',
		title: 'Exility',
		content: 'Ultimate isomorphic page!',
	});

	expect(sandbox.title).toBe('Exility');
	expect(sandbox.body.className).toBe('is-interactive');
	expect(sandbox.body.innerHTML).toBe('<!--(-->Ultimate isomorphic page!<!--)-->');
});
