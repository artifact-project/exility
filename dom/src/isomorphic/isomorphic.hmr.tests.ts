import {
	core as stdlib,
	dom as stddom,
} from '@exility/stdlib';
import createDOMCompiler from '../compiler/compiler';

const domCompiler = createDOMCompiler({
	scope: ['x', 'y', 'z'],
	isomorphic: true,
});


function compile(tpl) {
	return domCompiler(tpl)({
		stdlib,
		stddom,
	});
}

function newScope() {
	let scope = {};

	return (patch = {}) => {
		scope = {...scope, ...patch};
		return scope;
	};
}

function fromString(tpl, data?, debug?) {
	const domTemplate = compile(tpl);

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

		function updateCtx(ctx, vnode, el) {
			if (!ctx.__vmap__) {
				ctx.__vmap__ = true;
				Object.keys(ctx).forEach((id) => {
					if (+id > 0) {
						ctx[id].el.__id__ = id;
					}
				});
			}

			if (vnode.__id__) {
				ctx[vnode.__id__].el = el;
			}
		}

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

			updateCtx(ctx, vnode, el);

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

		newView.container = view.container;
		updateChildren(view.container, root, newView.ctx);

		Object['assign'](view, newView);
		// console.log(scope);
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
	const view = fromString('h1\n\t| ${x}\n\tif (x) > i | ${y}', scope({x: 1, y: '!'}));

	expect(view.container.innerHTML).toBe('<h1>1<i>!</i></h1>');

	console.log(view.ctx);
	// view.reload(compile('h1 | -${y}-'), scope());
	// expect(view.container.innerHTML).toBe('<h1>-!-</h1>');
});
