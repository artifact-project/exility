import {dom} from '@exility/stdlib';

type VMap = WeakMap<VElement, HTMLElement>;

const {ATTR_TO_PROPS, LIFECYCLE} = dom;
const {createElement, createTextNode} = document;

class VElement {
	tagName: string;
	nodeValue: string;
	childNodes: VElement[] = [];
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
}

Object.keys(dom.ATTR_TO_PROPS).forEach(key => {
	const proto = VElement.prototype;

	Object.defineProperty(proto, key, {
		get() {
			return this.attributes[ATTR_TO_PROPS[key]];
		},

		set(value) {
			this.attributes[ATTR_TO_PROPS[key]] = value;
		},
	});
});

function updateAttributes(el: HTMLElement, vnode: VElement, onlySet?) {
	const {attributes} = vnode;

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
			const attrName = oldAttributes[idx].name;
			attributes.hasOwnProperty(attrName) || el.removeAttribute(attrName);
		}
	}
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
		updateChildren(map, el, vnode.childNodes);
	} else {
		el.nodeValue = vnode.nodeValue;
	}

	map.set(vnode, el);
}

function updateChildren(map: VMap, el: HTMLElement, newChildren: VElement[]) {
	const newLength = newChildren.length;

	if (newLength) {
		const oldChildren = el.childNodes;
		let oldLength = oldChildren.length;
		let idx = 0;

		for (; idx < newLength; idx++) {
			updateNode(map, el, <HTMLElement>oldChildren[idx], newChildren[idx]);
		}

		idx = oldLength;
		while (idx > newLength) {
			el.removeChild(oldChildren[--idx]);
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

export default function reload(view, template, scope) {
	document.createElement = (name) => <any>new VElement(name);
	document.createTextNode = (value) => <any>({nodeValue: value});

	const map: VMap = new WeakMap<VElement, HTMLElement>();
	const newView = template(scope, {});

	newView.container = view.container;

	updateChildren(map, view.container, newView.frag);
	relinking(map, newView.frag, newView.ctx);

	LIFECYCLE(view.ctx, 'disconnectedCallback');
	LIFECYCLE(newView.ctx, 'connectedCallback');

	Object['assign'](view, newView);

	document.createElement = createElement;
	document.createTextNode = createTextNode;
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
