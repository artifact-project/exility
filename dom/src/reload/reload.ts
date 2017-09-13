import {dom} from '@exility/stdlib';

type VMap = WeakMap<VElement, HTMLElement>;

const {ATTR_TO_PROPS, LIFECYCLE} = dom;
const {createElement, createTextNode} = document;

class VElement {
	tagName: string;
	nodeValue: string;
	childNodes: VElement[] = [];

	events: Array<[string, EventListenerOrEventListenerObject, object|boolean]> = [];
	attributes: {[name: string]: string} = {};

	constructor(name) {
		this.tagName = name.toUpperCase();
	}

	appendChild(node) {
		this.childNodes.push(node);
	}

	setAttribute(name, value) {
		this.attributes[name] = value;
	}

	hasAttribute(name) {
		return this.attributes.hasOwnProperty(name);
	}

	addEventListener(name, fn, capture) {
		this.events.push([name, fn, capture]);
	}
}

Object.keys(dom.ATTR_TO_PROPS).forEach(key => {
	Object.defineProperty(VElement.prototype, key, {
		get() {
			return this.attributes[ATTR_TO_PROPS[key]];
		},

		set(value) {
			this.attributes[ATTR_TO_PROPS[key]] = value;
		},
	});
});

function updateAttributes(el: HTMLElement, vnode: VElement, onlySet?) {
	const {attributes, events} = vnode;

	for (const attrName in attributes) {
		if (attributes.hasOwnProperty(attrName)) {
			const value = attributes[attrName];

			if (ATTR_TO_PROPS.hasOwnProperty(attrName)) {
				el[attrName] = value;
			} else if (value == null) {
				el.removeAttribute(attrName);
			} else {
				el.setAttribute(attrName, value);
			}
		}
	}

	if (onlySet !== true) {
		const oldAttributes = el.attributes;
		let idx = oldAttributes.length;

		while (idx--) {
			const {name} = oldAttributes[idx];

			if ((attributes.hasOwnProperty(name) || attributes.hasOwnProperty(ATTR_TO_PROPS[name]))) {
				continue;
			}

			el.removeAttribute(name);
		}
	}

	events.forEach(args => {
		el.addEventListener(args[0], args[1], <boolean>args[2]);
	});
}

function createNode(vnode: VElement): HTMLElement {
	let el;

	if (vnode.tagName) {
		el = createElement.call(document, vnode.tagName);
		updateAttributes(el, vnode, true);
	} else {
		el = createTextNode.call(document, vnode.nodeValue);
	}

	return el;
}

function updateNode(map: VMap, parentNode: HTMLElement, el: HTMLElement, vnode: VElement) {
	let isNew = false;

	if (el) {
		if (el.tagName !== vnode.tagName) {
			const newEl = createNode(vnode);

			parentNode.replaceChild(newEl, el);
			el = newEl;
			isNew = true;
		}
	} else {
		el = createNode(vnode);
		isNew = true;
		parentNode.appendChild(el);
	}

	if (vnode.tagName) {
		if (isNew || !vnode.hasAttribute('--freezed')) {
			updateChildren(map, el, vnode.childNodes);
			updateAttributes(el, vnode); // todo: innerHTML
		}
	} else {
		el.nodeValue = vnode.nodeValue;
	}

	map.set(vnode, el);
}

function updateChildren(map: VMap, el: HTMLElement, newChildren: VElement[]) {
	const newLength = newChildren.length;

	if (newLength) {
		let oldChildren = el.childNodes;
		let oldLength = oldChildren.length;
		let idx = 0;
		let oldIdx = 0;

		if (oldLength > 0 && oldChildren[0].nodeType === 10) {
			oldIdx++;
		}

		for (; idx < newLength; idx++) {
			let child;

			if (oldIdx < oldLength) {
				child = <HTMLElement>oldChildren[oldIdx++];

				if (child.nodeType === child.COMMENT_NODE) { // COMMENT_NODE
					el.removeChild(child);
					idx--;
					oldIdx--;
					oldLength--;
					continue;
				}
			}

			updateNode(map, el, child, newChildren[idx]);
		}

		for (; oldIdx < oldLength; oldIdx++) {
			el.removeChild(oldChildren[oldIdx]);
		}
	} else {
		el.textContent = '';
	}
}

function relinking(map: VMap, frag, ctx) {
	Object.keys(ctx).forEach(id => {
		if (+id > 0) {
			const item = ctx[id];

			if (map.has(item.el)) {
				item.el = map.get(item.el);
			}

			if (map.has(item.anchor)) {
				item.anchor = map.get(item.anchor);
			}

			if (map.has(item.parent)) {
				item.parent = map.get(item.parent);
			}

			if (item.node) { // IF
				relinking(map, item.node.frag, item.node.ctx);
			} else if (!item.el && item.pool) { // FOR
				item.nodes.forEach(node => {
					relinking(map, node.frag, node.ctx);
				});
			}
		}
	});

	if (map.has(frag.parentNode)) {
		frag.parentNode = map.get(frag.parentNode);
	}

	let idx = frag.length;
	while (idx--) {
		frag[idx] = map.get(frag[idx]);
	}

	ctx.blocks && ctx.blocks.forEach(({__view__:{ctx, frag}}) => {
		relinking(map, frag, ctx);
	});
}

function removeOldListeners(ctx) {
	Object.keys(ctx).forEach(id => {
		const node = ctx[id];

		if (node && node.handleEvent) {
			Object.keys(node.events).forEach(name => {
				node.el.removeEventListener(name, node);
			});
		}
	});

	ctx.blocks.forEach(block => {
		removeOldListeners(block.__view__.ctx);
	});
}

export default function reload(view, template, scope) {
	document.createElement = (name) => <any>new VElement(name);
	document.createTextNode = (value) => <any>({nodeValue: value});

	const map: VMap = new WeakMap<VElement, HTMLElement>();
	const newView = template(scope, {});

	newView.container = view.container;

	removeOldListeners(view.ctx);
	updateChildren(map, view.container, newView.frag);
	relinking(map, newView.frag, newView.ctx);

	LIFECYCLE(view.ctx, 'disconnectedCallback');
	LIFECYCLE(newView.ctx, 'connectedCallback');

	Object['assign'](view, newView);

	document.createElement = createElement;
	document.createTextNode = createTextNode;
}

export function reloadBlock(block, XBlock) {
	const scope = block.__scope__;

	scope.__blocks__ = XBlock.blocks;
	scope.__classNames__ = XBlock.classNames;

	reload(
		block.__view__,
		XBlock.prototype.__template__,
		scope,
	);
}


// 	const allBlocks = {};
//
// 	(function _collect(ctx) {
// 		ctx.blocks.forEach(block => {
// 			const id = block.__id__;
// 			(allBlocks[id] || (allBlocks[id] = [])).push(block);
// 		});
// 	})(view.ctx);
//
// 	stddom.CMP_BLOCK_FACTORY = function (XBlock, attrs, parent, events, slots) {
// 		const id = XBlock.prototype.__id__;
// 		let inst = (allBlocks[id] || []).pop();
//
// 		if (inst) {
// 			inst.disconnectedCallback();
// 			inst.update(attrs);
// 			inst.__init__({
// 				...inst.__options__,
// 				parent,
// 				events,
// 				slots,
// 			});
// 		} else {
// 			inst = CMP_BLOCK_FACTORY(XBlock, attrs, parent, events, slots);
// 		}
//
// 		return inst;
// 	};
//
