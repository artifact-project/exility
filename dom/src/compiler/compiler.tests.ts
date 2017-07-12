import {stdlib, COMMON_TEST} from '@exility/compile';

import compilter from './compiler';
import stddom from './../stddom/stddom';

function serialize(view) {
	if (view.mountTo) {
		const container = document.createElement('div');
		view.mountTo(container);
		return container.innerHTML;
	} else {
		return view.toString();
	}
}

export function fromString(template, scope = {}, pure?: boolean) {
	const compile = compilter({
		pure,
		debug: true,
		scope: Object.keys(scope),
	});
	const templateFactory = compile(template);
	const view = templateFactory(pure ? null : {stddom, stdlib})(scope);

	view.templateFactory = templateFactory;

	if (view.mountTo) {
		view.mountTo(document.createElement('div'));
	} else {
		throw view.toString();
	}

	return view;
}

it('empty', () => {
	const compile = compilter({debug: true, scope: []});
	const templateFactory = compile('');

	expect(templateFactory).toMatchSnapshot();
	expect(serialize(templateFactory({stddom, stdlib})())).toBe('')
});

it('text node', () => {
	const compile = compilter({debug: true, scope: []});
	const templateFactory = compile('| foo');

	expect(serialize(templateFactory({stddom, stdlib})())).toBe('foo');
});

it('text + interpolate', () => {
	const compile = compilter({debug: true, scope: ['x']});
	const templateFactory = compile('| foo-${x}');
	const view = templateFactory({stddom, stdlib})({}).mountTo(document.createElement('div'));

	expect(templateFactory.toString()).toMatchSnapshot();
	expect(view.container.innerHTML).toBe('foo-');

	view.update({x: 'bar'});
	expect(view.container.innerHTML).toBe('foo-bar');

	view.update({x: null});
	expect(view.container.innerHTML).toBe('foo-');
});

it('статичная текстовая нода', () => {
	const view = fromString('|foo');
	expect(view.container.innerHTML).toBe('foo');
});

it('динамическая текстовая нода', () => {
	const view = fromString('|Hi, ${x}!', {'x': 'foo'});

	expect(view.container.childNodes.length).toBe(3);
	expect(view.container.innerHTML).toBe('Hi, foo!');

	view.update({x: 'bar'});
	expect(view.container.innerHTML).toBe('Hi, bar!');
});

it('тег + текст', () => {
	const view = fromString('h1 | ${x}', {x: 'foo'});

	expect(view.container.innerHTML).toBe('<h1>foo</h1>');

	view.update({x: 'bar'});
	expect(view.container.innerHTML).toBe('<h1>bar</h1>');
});

it('атрибуты', () => {
	const view = fromString('.is-${x}', {x: 'foo'});

	expect(view.container.innerHTML).toBe('<div class="is-foo"></div>');

	view.update({});
	expect(view.container.innerHTML).toBe('<div class="is-"></div>');

	view.update({x: 'bar'});
	expect(view.container.innerHTML).toBe('<div class="is-bar"></div>');
});

it('if + текст',() => {
	const view = fromString('if (x)\n  | ${x}', {x: false});

	expect(view.templateFactory).toMatchSnapshot();
	expect(view.container.textContent).toBe('');
	expect(view.container.childNodes.length).toBe(1);

	view.update({x: 'bar'});
	expect(view.container.textContent).toBe('bar');
	expect(view.container.childNodes.length).toBe(2);

	view.update({x: 'baz'});
	expect(view.container.textContent).toBe('baz');

	view.update({x: false});
	expect(view.container.textContent).toBe('');
	expect(view.container.childNodes.length).toBe(1);
});

it('if + if + if + текст',() => {
	const view = fromString('if (a)\n  if (b)\n    if (c)\n      | ${txt}', {
		a: 0,
		b: 0,
		c: 0,
		txt: 'foo'
	});

	view.update({a: 1, b: 1, c: 1, txt: 'foo'});
	expect(view.container.textContent).toBe('foo');

	view.update({a: 1, b: 0, c: 1, txt: 'foo'});
	expect(view.container.textContent).toBe('');

	view.update({a: 1, b: 1, c: 1, txt: 'bar'});
	expect(view.container.textContent).toBe('bar');

	view.update({a: 0, b: 1, c: 1, txt: 'bar'});
	expect(view.container.textContent).toBe('');

	view.update({a: 1, b: 1, c: 1, txt: 'baz'});
	expect(view.container.textContent).toBe('baz');
});

it('if + else + текст',() => {
	const view = fromString('if (txt)\n  | ${txt}\nelse\n  | none', {txt: null});

	expect(view.container.textContent).toBe('none');

	view.update({txt: 'foo'});
	expect(view.container.textContent).toBe('foo');

	view.update({txt: false});
	expect(view.container.textContent).toBe('none');
});

it('for + текст',() => {
	const view = fromString('for (txt in data)\n  | ${txt}', {data: [1]});

	expect(view.container.textContent).toBe('1');

	view.update({data: [1, 2, 3]});
	expect(view.container.textContent).toBe('123');

	view.update({data: [1, 2]});
	expect(view.container.textContent).toBe('12');

	view.update({data: [2]});
	expect(view.container.textContent).toBe('2');

	view.update({data: ['ok']});
	expect(view.container.textContent).toBe('ok');
});

it('for + текст track by id',() => {
	const cases:any = [
		{input: [1, 2, 3, 4, 5], result: '12345'},
		{input: [3, 4, 1, 2, 5], result: '34125'},
		{input: [4, 1, 0, 2, 5], result: '41025', added: ['0']},
		{input: [5, 1, 2, 3], result: '5123'},
		{input: [3, 2, 1, 5], result: '3215'},
		{input: [0], result: '0', added: ['0']},
		{input: [1, 2, 3, 0], result: '1230', added: ['0', '1', '2', '3']},
	];

	cases.forEach((spec) => {
		spec.input = spec.input.map((id) => ({id: id}));
	});

	const view = fromString('for (item in data) track by id\n  | ${item.id}', {data: cases[0].input});
	const cache = {};

	[].forEach.call(view.container.childNodes, (el) => {
		cache[el.textContent] = el;
	});

	expect(view.container.innerHTML).toBe(cases[0].result);

	cases.slice(1).forEach((spec) => {
		view.update({data: spec.input});

		expect(view.container.innerHTML).toBe(spec.result);

		[].forEach.call(view.container.childNodes, (el) => {
			if (cache[el.textContent] !== el) {
				if (!spec.added || spec.added.indexOf(el.textContent) === -1) {
					expect('no cached: ' + el.textContent + ' in ' + spec.result).toBe(null);
				}
			}
		});
	});
});

it('ссылка + текст',() => {
	const view = fromString('a.foo[href="${url}"][data-id="1"] | bar', {url: '#'});

	expect(view.container.innerHTML).toBe('<a class=\"foo\" href=\"#\" data-id=\"1\">bar</a>');

	view.update({url: '#baz'});
	expect(view.container.innerHTML).toBe('<a class=\"foo\" href=\"#baz\" data-id=\"1\">bar</a>');

	view.update({url: null});
	expect(view.container.innerHTML).toBe('<a class=\"foo\" href=\"\" data-id=\"1\">bar</a>');
});

it('динамический тег',() => {
	const view = fromString('${name} | ${text}', {name: 'a', text: 'foo'});
	const a = view.container.firstChild;
	const txt = view.container.firstChild.firstChild;

	expect(view.container.innerHTML).toBe('<a>foo</a>');

	view.update({name: 'b', text: 'foo'});
	expect(view.container.innerHTML).toBe('<b>foo</b>');
	expect(view.container.firstChild.firstChild).toBe(txt);

	view.update({name: 's', text: 'bar'});
	expect(view.container.innerHTML).toBe('<s>bar</s>');
	expect(view.container.firstChild.firstChild === txt);

	view.update({name: 'a', text: 'bar'});
	expect(view.container.innerHTML).toBe('<a>bar</a>');
	expect(view.container.firstChild).toBe(a);
});

it('динамический тег + атрибуты',() => {
	const view = fromString('${name}.is-${state}[data-id="123"]', {name: 'i', state: 'foo'});

	expect(view.container.innerHTML).toBe('<i class="is-foo" data-id="123"></i>');

	view.update({name: 'b', state: 'bar'});
	expect(view.container.innerHTML).toBe('<b class="is-bar" data-id="123"></b>');

	view.update({name: 'i', state: 'bar'});
	expect(view.container.innerHTML).toBe('<i class="is-bar" data-id="123"></i>');
});

it('todos',() => {
	const view = fromString(`
		ul > for (todo in todos)
			li
				if (todo.completed)
					a | \${todo.title}
				else
					b | \${todo.title}
	`, {todos: []});

	expect(view.container.innerHTML).toBe('<ul></ul>');

	view.update({todos: [{title: 'foo', completed: false}]});
	expect(view.container.innerHTML).toBe('<ul><li><b>foo</b></li></ul>');

	view.update({todos: [{title: 'bar', completed: true}]});
	expect(view.container.innerHTML).toBe('<ul><li><a>bar</a></li></ul>');

	view.update({todos: [{title: 'bar', completed: true}, {title: 'foo', completed: false}]});
	expect(view.container.innerHTML).toBe('<ul><li><a>bar</a></li><li><b>foo</b></li></ul>');
});


describe('COMMON_TEST', () => {
	COMMON_TEST.forEach(({title, template, data, results, snapshot}) => {
		results = [].concat(results);

		describe(title, () => {
			[].concat(data).forEach((scope, idx) => {
				it(JSON.stringify(scope), () => {
					const view = fromString(template, scope, true);
					expect(view.container.innerHTML).toBe(results[idx]);
				});
			});
		});
	});
});

// it('anim: append',() => {
// 	var done = assert.async();
// 	const view = fromString('fx("fade") > .foo | append:far');
//
// 	window.sandbox.appendChild(view.container);
// 	expect(view.container.firstChild.style.opacity).toBe(0);
//
// 	setTimeout(() => {
// 		expect(view.container.firstChild.style.opacity).toBe(1);
// 		done();
// 	}, 10);
// });
//
// it('anim: if',() => {
// 	var done = assert.async();
// 	const view = fromString('fx("fade") > if (x) > .foo | bar', {x: false});
//
// 	window.sandbox.appendChild(view.container);
// 	expect(view.container.innerHTML).toBe('');
//
//
// 	setTimeout(() => {
// 		view.update({x: true});
// 		expect(view.container.firstChild.style.opacity).toBe(1);
// 		done();
// 	}, 1);
// });
