import {
	core as stdlib,
	dom as stddom,
} from '@exility/stdlib';
import Block from '@exility/block';
import createDOMCompiler from '../compiler/compiler';

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

	view.mountTo(document.createElement('div'));
	view.reload = function (template, scope) {
		const doc = {
			createElement(name) {
				return {
					tagName: name.toUpperCase(),
					childNodes: [],
					appendChild(node) {
						this.childNodes.push(node);
					}
				};
			},
			createTextNode(value) {
				return {
					nodeValue: value,
				};
			}
		};

		stddom.SET_DOCUMENT(doc);

		const root = doc.createElement('div');
		const newView = template(scope, {}).mountTo(root);
		const nodeMap = new WeakMap();

		function updateNode(parentNode, el, vnode, ctx) {
			if (el) {
				if (el.tagName !== vnode.tagName) {
					const newEl = createNode(vnode);
					parentNode.replaceChild(newEl, el);
					el = newEl;
				}
			} else {
				el = createNode(vnode);
				parentNode.appendChild(el);
			}

			if (vnode.tagName) {
				updateAttributes(el, vnode);
				updateChildren(el, vnode, ctx);
			} else {
				el.nodeValue = vnode.nodeValue;
			}

			nodeMap.set(vnode, el);

			return el;
		}

		function updateAttributes(el, vnode) {
			const {attributes} = el;
			let idx = attributes.length;

			// while (idx--) {
			// 	el.removeAttribute(attributes[idx].name);
			// }

			// throw 'todo: updateAttributes';
		}

		function updateChildren(el, vnode, ctx) {
			const newChildren = vnode.childNodes;
			const newLength = newChildren.length;

			if (newLength) {
				const oldChildren = el.childNodes;
				let oldLength = oldChildren.length;
				let idx = 0;

				for (; idx < newLength; idx++) {
					updateNode(el, oldChildren[idx], newChildren[idx], ctx);
				}

				idx = oldLength;
				while (idx > newLength) {
					el.removeChild(oldChildren[--idx]);
				}
			} else {
				el.textContent = '';
			}
		}

		function createNode(vnode) {
			let el;

			if (vnode.tagName) {
				el = document.createElement(vnode.tagName);
				// todo: set attrs;
			} else {
				el = document.createTextNode(vnode.nodeValue);
			}

			return el;
		}

		// console.log(view.ctx);
		// console.log(newView.ctx[3].nodes);

		newView.container = view.container;
		updateChildren(view.container, root, newView.ctx);

		Object['assign'](view, newView);

		(function _next(frag, ctx) {
			Object.keys(ctx).forEach(id => {
				if (+id > 0) {
					const item = ctx[id];

					if (item.el) {
						item.el = nodeMap.get(item.el);
					} else {
						item.anchor = nodeMap.get(item.anchor);

						if (nodeMap.has(item.parent)) {
							item.parent = nodeMap.get(item.parent);
						}

						if (item.node) { // IF
							_next(item.node.frag, item.node.ctx);
						} else if (item.hasOwnProperty('pool')) { // FOR
							item.nodes.forEach(node => {
								_next(node.frag, node.ctx);
							});
						}
					}
				}
			});

			let idx = frag.length;

			if (nodeMap.has(frag.parentNode)) {
				frag.parentNode = nodeMap.get(frag.parentNode);
			}

			while (idx--) {
				frag[idx] = nodeMap.get(frag[idx]);
			}
		})(newView.frag, newView.ctx);

		stddom.SET_DOCUMENT(document);
	};

	return view;
}

it('iso / hmr / value', () => {
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

it('iso / hmr / if', () => {
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

it('iso / hmr / for', () => {
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

it('iso / hmr / blocks', () => {
	class Foo extends Block<null> {
		static template = `i | OK`;
	}

	let scope = newScope({Foo});
	const view = fromString('div > Foo', scope());

	expect(view.container.innerHTML).toBe('<div></div>');
});
