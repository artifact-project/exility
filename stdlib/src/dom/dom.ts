const ATTR_TO_PROPS = {
	'id': 'id',
	'dir': 'dir',
	'lang': 'lang',
	'href': 'href',
	'class': 'className',
	'className': 'className',
	'checked': 'checked',
	'disabled': 'disabled',
	'readonly': 'readOnly',
	'readOnly': 'readOnly',
	'title': 'title',
	'tabindex': 'tabIndex',
	'tabIndex': 'tabIndex',
	'autofocus': 'autoFocus',
	'autoFocus': 'autoFocus',
	'innerHTML': 'innerHTML',
	'maxlength': 'maxLength',
	'maxLength': 'maxLength',
};

const BOOL_ATTRS = {
	'checked': true,
	'autofocus': true,
};

let ISOMORPHIC_FRAG: any = null;

function ISOMORPHIC(frag) {
	frag && (frag.__iso = 0);
	ISOMORPHIC_FRAG = frag;
}

function ISOMORPHIC_CUT(parentNode, anchor, label) {
	let el;

	while ((el = anchor.nextSibling).data !== label) {
		parentNode.removeChild(el);
	}

	return el;

}

function ISOMORPHIC_APPEND(parent, node) {
	if (!parent.click) {
		if (node.frag) {
			node = node.frag;

			if (node.length === 1) {
				ISOMORPHIC_APPEND(parent, node);
			} else {
				for (let i = 0; i < node.length; i++) {
					ISOMORPHIC_APPEND(parent, node[i]);
				}
			}
		} else {
			parent[parent.length++] = node;
		}
	}
}

function GET_ISOMORPHIC_NEXT(parentNode) {
	return parentNode.childNodes[parentNode.__iso++];
}

function GET_PARENT_NODE(frag) {
	return frag == null ? ISOMORPHIC_FRAG : (frag.click ? frag : GET_PARENT_NODE(frag.parentNode));
}

function HANDLE_EVENT(evt) {
	const {type} = evt;
	const handle = this.events[type];

	if (this.eventsMods.hasOwnProperty(type)) {
		this.eventsMods[type].forEach(name => {
			// todo: Переделать
			if (name === 'prevent') {
				evt.preventDefault();
			}
		});
	}

	if (handle.hasOwnProperty('fn')) {
		const {ctx} = handle;
		const fnName = handle.fn;
		const detail = handle.detail == null ? null : handle.detail;

		if (ctx.dispatchEvent) {
			ctx.dispatchEvent(fnName, detail, evt);
		} else {
			ctx[`@${fnName}`].call(ctx, evt, detail);
		}
	} else {
		handle(evt);
	}
}

function MOUNT_TO(container) {
	this.parentNode = container;

	if (ISOMORPHIC_FRAG === null) {
		for (let i = 0; i < this.length; i++) {
			APPEND(container, this[i]);
		}
	}
}

function LIFECYCLE(ctx, name: 'connectedCallback' | 'disconnectedCallback') {
	ctx.connected = name === 'connectedCallback';

	let cursor = ctx.first;

	if (cursor != null) {
		do {
			LIFECYCLE(cursor, name);
		} while (cursor = cursor.next);
	}

	const {blocks} = ctx;
	let idx = blocks.length;

	while (idx--) {
		const cmp = blocks[idx];
		cmp[name] && cmp[name]();
	}
}

function ATTR(el, name, value) {
	if (ISOMORPHIC_FRAG) return;
	(value != null) && el.setAttribute(name, value);
}

function D_ATTR(node, name, value) {
	if (node.attrs[name] !== value) {
		if (value == null) {
			node.el.removeAttribute(name);
		} else {
			node.el.setAttribute(name, value);
		}

		node.attrs[name] = value;
	}
}

function PROP(el, name, value) {
	if (ISOMORPHIC_FRAG) return;
	el[name] = value;
}

function D_PROP(node, name, value) {
	value = value == null ? '' : value;

	if (node.attrs[name] !== value) {
		node.el[name] = value;
		node.attrs[name] = value;
	}
}

function ON(node, name, listener) {
	if (!node.events.hasOwnProperty(name)) {
		node.el.addEventListener(name, node, false);
	}

	node.events[name] = listener;
}

function APPEND(parent, el) {
	parent.appendChild(el);
	return el;
}

function APPEND_CHILD(child) {
	this[this.length++] = child;
}

function TEXT(parent, value) {
	let el;

	if (ISOMORPHIC_FRAG) {
		const parentNode = GET_PARENT_NODE(parent);

		el = GET_ISOMORPHIC_NEXT(parentNode);
		ISOMORPHIC_APPEND(parent, el);

		const nodeValue = el.nodeValue;

		if (nodeValue !== value) {
			const length = (el.__len || 0) + value.length;

			if (nodeValue.length !== length) {
				el.__len = length;
				parentNode.__iso--;
			}
		}
	} else {
		el = APPEND(parent, document.createTextNode(value == null ? '' : value));
	}

	return el;
}

function VALUE(parent, ctx, id, value) {
	let el;

	if (ISOMORPHIC_FRAG) {
		const parentNode = GET_PARENT_NODE(parent);
		const anchor = GET_ISOMORPHIC_NEXT(parentNode);

		el = anchor.nextSibling;
		value = value == null ? '' : value;

		if (el.nodeType === anchor.TEXT_NODE) {
			(el.nodeValue !== value) && (el.nodeValue = value);
		} else {
			const txt = document.createTextNode(value);

			parentNode.insertBefore(txt, el);
			el = txt;
		}

		parentNode.__iso += 2;
		(parent !== parentNode) && APPEND(parent, el);
	} else {
		el = TEXT(parent, value);
	}

	ctx[id] = {el, value};
	return el;
}

function UPD_VALUE(node, value) {
	value = value == null ? '' : value;

	if (node.value !== value) {
		node.value = value;
		node.el.nodeValue = value;
	}
}

function APPEND_TO_BEFORE(frag, before) {
	const parentNode = GET_PARENT_NODE(frag);
	const refNode = before.hasOwnProperty('frag') ? (before.frag[0] || before.anchor) : before;

	this.parentNode = frag;

	if (this.length === 1) {
		parentNode.insertBefore(this[0], refNode);
	} else if (this.length > 1) {
		for (let i = 0; i < this.length; i++) {
			parentNode.insertBefore(this[i], refNode);
		}
	}
}

function REMOVE() {
	const parentNode = GET_PARENT_NODE(this);

	if (this.length === 1) {
		parentNode.removeChild(this[0]);
	} else if (this.length > 1) {
		for (let i = 0; i < this.length; i++) {
			parentNode.removeChild(this[i]);
		}
	}
}

function APPEND_TO(parent) {
	this.parentNode = parent;

	if (this.length === 1) {
		parent.appendChild(this[0]);
	} else if (this.length > 1) {
		for (let i = 0; i < this.length; i++) {
			parent.appendChild(this[i]);
		}
	}
}

function REPLACE_CHILD_FRAG(oldFrag, newFrag) {
	const domParent = GET_PARENT_NODE(this);

	if (newFrag.length === 1) {
		this[0] = newFrag[0];
		domParent.insertBefore(newFrag[0], oldFrag[0]);
		domParent.removeChild(oldFrag[0]);

		for (let idx = 0; idx < this.parentNode.length; idx++) {
			if (this.parentNode[idx] === oldFrag[0]) {
				this.parentNode[idx] = newFrag[0];
			}
		}
	} else {
		throw 'todo';
	}
}

function FRAGMENT(parentNode?) {
	return {
		length: 0,
		nodeType: 0,
		parentNode,
		appendChild: APPEND_CHILD,
		appendTo: APPEND_TO,
		appendToBefore: APPEND_TO_BEFORE,
		replaceChildFrag: REPLACE_CHILD_FRAG,
		remove: REMOVE,
		mountTo: MOUNT_TO,
	}
}

function CONTEXT(parent?) {
	return {
		connected: parent ? parent.connected : false,
		blocks: [],
		next: null,
		prev: null
	};
}


function ADD_CHILD_CONTEXT(parent, child) {
	const {last} = parent;

	child.connected = parent.connected;
	child.parent = parent;

	if (last == null) {
		parent.first = parent.last = child;
	} else {
		last.next = child;
		child.prev = last;
		parent.last = child;
	}

	return child;
}

function REMOVE_CONTEXT(ctx) {
	const {parent, prev, next} = ctx;

	(parent.first === ctx) && (parent.first = next);
	(parent.last === ctx) && (parent.last = prev);

	(prev !== null) && (prev.next = next);
	(next !== null) && (next.prev = prev);
}

function NODE(parent, name: string) {
	if (ISOMORPHIC_FRAG) {
		const parentNode = GET_PARENT_NODE(parent);
		const el = GET_ISOMORPHIC_NEXT(parentNode);

		el.__iso = 0;
		ISOMORPHIC_APPEND(parent, el);

		return el;
	} else {
		return APPEND(parent, document.createElement(name));
	}
}

function LIVE_NODE(parent, ctx, id, name) {
	const el = NODE(parent, name);

	ctx[id] = {
		el,
		name,
		parent,
		attrs: {},
		events: {},
		eventsMods: {},
		handleEvent: HANDLE_EVENT,
		pool: {},
	};

	return el;
}

function UPD_LIVE_NODE(node, name) {
	if (node.name !== name) {
		const parent = GET_PARENT_NODE(node.parent);
		const attrs = node.attrs;
		const pool = node.pool;
		let oldEl = node.el;
		let el;

		pool[node.name] = oldEl;
		node.name = name;

		if (pool.hasOwnProperty(name)) {
			el = pool[name];
		} else {
			el = document.createElement(name);
		}

		for (let key in attrs) {
			if (ATTR_TO_PROPS.hasOwnProperty(key)) {
				el[key] = attrs[key];
			} else {
				el.setAttribute(key, attrs[key]);
			}
		}

		node.el = el;
		parent.insertBefore(el, oldEl);
		parent.removeChild(oldEl);

		let child;
		while (child = oldEl.firstChild) {
			el.appendChild(child);
		}
	}
}

function IF(parent, ctx, id, items) {
	const length = items.length;
	const nodes = {};
	let ISO_FRAG = ISOMORPHIC_FRAG;
	let ISO_PARENT;
	let node;
	let anchor;
	let isIsoEmpty;
	let tmpEl;

	if (ISOMORPHIC_FRAG) {
		ISO_PARENT = GET_PARENT_NODE(parent);
		anchor = GET_ISOMORPHIC_NEXT(ISO_PARENT);
		tmpEl = anchor.nextSibling;

		if (tmpEl.data === `/${anchor.data}`) {
			anchor = tmpEl;
			isIsoEmpty = true;
			ISOMORPHIC_FRAG = null;
		} else {
			ISOMORPHIC_FRAG = ISO_PARENT;
		}
	}

	for (let i = 0; i < length; i++) {
		node = nodes[i] = items[i]();

		if (node !== null) {
			break;
		}
	}

	if (ISO_FRAG) {
		ISOMORPHIC_FRAG = ISO_FRAG;

		if (node !== null) {
			ADD_CHILD_CONTEXT(ctx, node.ctx);

			if (isIsoEmpty) {
				node.frag.appendToBefore(ISO_PARENT, anchor);
				ISO_PARENT.__iso += node.frag.length;
			}

			node.frag.parentNode = parent;
			ISOMORPHIC_APPEND(parent, node);
		} else if (!isIsoEmpty) {
			anchor = ISOMORPHIC_CUT(ISO_PARENT, anchor, `/${anchor.data}`);
		}

		ISO_PARENT.__iso++;
	} else {
		if (node !== null) {
			ADD_CHILD_CONTEXT(ctx, node.ctx);
			node.frag.appendTo(parent);
		}

		anchor = TEXT(parent, '');
	}

	ctx[id] = {
		node,
		anchor,
		parent,
		items,
		length,
		nodes,
		fx: null,
	};
}

function UPD_IF(ctx, id) {
	const condition = ctx[id];
	const length = condition.length;
	const items = condition.items;
	const fx = condition.fx;
	let nodes = condition.nodes;
	let node = condition.node;
	let newNode;
	let update = false;

	for (let i = 0; i < length; i++) {
		newNode = items[i](nodes[i]);

		if (newNode !== null) {
			update = nodes[i] != null;
			nodes[i] = newNode;
			break;
		}
	}

	if (node !== newNode) {
		if (fx !== null) {
			if (node && newNode) {
				fx.replace(condition, node, newNode);
			} else {
				node && fx.remove([node]);

				if (newNode) {
					newNode.frag.appendToBefore(condition.parent, condition.anchor);
					fx.append([newNode]);
				}
			}
		} else {
			(node !== null) && node.frag.remove();
			(newNode !== null) && newNode.frag.appendToBefore(condition.parent, condition.anchor);
		}

		if (node !== null) {
			REMOVE_CONTEXT(node.ctx);
			LIFECYCLE(node.ctx, 'disconnectedCallback');
		}

		if (newNode !== null) {
			ADD_CHILD_CONTEXT(ctx, newNode.ctx);
			LIFECYCLE(newNode.ctx, 'connectedCallback');
		}

		condition.node = newNode;
	}

	update && newNode.update();
}

function FOR(parent, ctx, id, data, idProp, iterator) {
	const index = idProp ? {} : null;
	let ISO_FRAG = ISOMORPHIC_FRAG;
	let isoParentNode;
	let anchor;
	let nodes;
	let node;
	let item;
	let isoEnd;

	if (ISO_FRAG) {
		isoParentNode = GET_PARENT_NODE(parent);
		ISOMORPHIC_FRAG = isoParentNode;
		anchor = GET_ISOMORPHIC_NEXT(isoParentNode);
		isoEnd = `/${anchor.data}`;
	}

	if (data != null) {
		if (data instanceof Array) {
			const length = data.length;
			nodes = new Array(length);

			for (let i = 0; i < length; i++) {
				item = data[i];

				if (ISO_FRAG) {
					if (ISOMORPHIC_FRAG && isoParentNode.childNodes[isoParentNode.__iso].data === isoEnd) {
						anchor = isoParentNode.childNodes[isoParentNode.__iso];
						ISOMORPHIC_FRAG = null;
					}

					node = iterator(ctx, item, i);

					if (ISOMORPHIC_FRAG === null) {
						isoParentNode.__iso += node.frag.length;
						node.frag.appendToBefore(isoParentNode, anchor);
					} else {
						node.frag.parentNode = parent;
					}
				} else {
					node = iterator(ctx, item, i);
					node.frag.appendTo(parent);
				}

				ADD_CHILD_CONTEXT(ctx, node.ctx);
				nodes[i] = node;

				if (index !== null) {
					index[item[idProp]] = node;
				}
			}
		} else {
			// todo
		}
	} else {
		nodes = [];
	}

	if (ISO_FRAG) {
		ISOMORPHIC_FRAG = ISO_FRAG;
		anchor = ISOMORPHIC_CUT(isoParentNode, isoParentNode.childNodes[isoParentNode.__iso - 1], isoEnd);
		isoParentNode.__iso++;
	} else {
		anchor = TEXT(parent, '');
	}

	ctx[id] = {
		anchor,
		parent,
		nodes,
		index,
		length: nodes.length,
		pool: [],
		fx: null,
	};
}

function UPD_FOR(ctx, id, data, idProp, iterator) {
	const foreach = ctx[id];
	const pool = foreach.pool;
	const parent = foreach.parent;
	const anchor = foreach.anchor;
	const oldNodes = foreach.nodes;
	const oldLength = foreach.length;
	const fx = foreach.fx;
	const oldIndex = foreach.index;
	const newIndex = idProp ? {} : null;
	let pivotIdx = 0;
	let newNodes;
	let node;
	let item;
	let idValue;

	if (data != null) {
		if (data instanceof Array) {
			const length = data.length;
			newNodes = new Array(length);

			for (let i = 0; i < length; i++) {
				item = data[i];

				if (newIndex !== null) {
					idValue = item[idProp];

					if (oldIndex.hasOwnProperty(idValue)) {
						node = oldIndex[idValue];
						node.update(item, i);
						node.reused = true;

						if (pivotIdx < node.index) {
							pivotIdx = node.index;
						} else {
							node.frag.appendToBefore(parent, oldNodes[pivotIdx + 1] || anchor);
						}
					} else {
						if (pool.length) {
							node = pool.pop();
							node.update(item, i);
						} else {
							node = iterator(ctx, item, i);
						}

						ADD_CHILD_CONTEXT(ctx, node.ctx);
						LIFECYCLE(node.ctx, 'connectedCallback');

						node.frag.appendToBefore(parent, oldNodes[pivotIdx + 1] || anchor);
						fx && fx.append && fx.append([node]);
					}

					newIndex[idValue] = node;
				} else if (i < oldLength) {
					node = oldNodes[i];
					node.reused = true;
					node.update(item, i);
				} else {
					if (pool.length) {
						node = pool.pop();
						node.update(item, i);
					} else {
						node = iterator(ctx, item, i);
					}

					ADD_CHILD_CONTEXT(ctx, node.ctx);
					LIFECYCLE(node.ctx, 'connectedCallback');

					node.frag.appendToBefore(parent, anchor);
				}

				node.index = i;
				newNodes[i] = node;
			}
		} else {
			// todo
		}
	} else {
		newNodes = [];
	}

	let idx = oldLength;
	let useAnim = fx && fx.remove;

	while (idx--) {
		node = oldNodes[idx];

		if (!node.reused) {
			node.update(node.data, idx);

			if (useAnim) {
				fx.remove([node], pool);
			} else {
				node.frag.remove();
				pool.push(node);
			}

			REMOVE_CONTEXT(node.ctx);
			LIFECYCLE(node.ctx, 'disconnectedCallback');
		}

		node.reused = false;
	}

	foreach.index = newIndex;
	foreach.nodes = newNodes;
	foreach.length = newNodes.length;
}


function CMP_INLINE(store, name, block) {
	block.inline = true;
	store[name] = block;
}

function CMP_CREATE_INLINE(store, parentFrag, parentThis, ctx, name, attrs, events) {
	const node = store[name](attrs, ctx);

	node.__parent__ = parentThis;
	node.__events__ = events;

	node.frag.appendTo(parentFrag);

	return node;
}

function CMP_DUMMY_STATE(el, state, stateText?) {
	el.className = `block-dummy block-dummy-${state}`;
	stateText && el.setAttribute('data-block-error', stateText);
}

function CMP_CREATE_DUMMY(name, attrs) {
	const dummy = ISOMORPHIC_FRAG ? GET_ISOMORPHIC_NEXT(ISOMORPHIC_FRAG) : document.createElement('div');

	ATTR(dummy, 'data-block', name);
	CMP_DUMMY_STATE(dummy, 'loading');

	const node = {
		frag: {
			0: dummy,
			length: 1,
			appendTo(parent) {
				parent.appendChild(dummy);
			}
		},
		attrs,
		update(attrs) {
			node.attrs = attrs;
		}
	};

	return node;
}

function CMP_BLOCK_FACTORY(XBlock, context, attrs, parent, events, slots) {
	return new XBlock(attrs, {
		context,
		parent,
		events,
		slots,
	})
}

function CMP_CREATE(ctx, blocks, parentFrag, parentThis, context, name, attrs, events, slots) {
	const ISO_FRAG = ISOMORPHIC_FRAG;
	let isoParentNode;
	let node;
	let Block = blocks[name];

	if (ISO_FRAG) {
		isoParentNode = GET_PARENT_NODE(parentFrag);
		ISOMORPHIC_FRAG = isoParentNode;
	}

	if (Block == null) {
		node = CMP_CREATE_DUMMY(name, attrs);
		CMP_DUMMY_STATE(node.frag[0], 'failed', 'Undefined Block');
	} else if (Block.then) {
		node = CMP_CREATE_DUMMY(name, attrs);

		Block
			.then((XBlock) => {
				const cmpNode = CMP_BLOCK_FACTORY(
					XBlock,
					context,
					node.attrs,
					parentThis,
					events,
					slots,
				);
				const view = cmpNode['__view__'];

				ctx.blocks.push(cmpNode);
				ADD_CHILD_CONTEXT(ctx, view.ctx);

				if (parentFrag.replaceChildFrag) {
					parentFrag.replaceChildFrag(node.frag, view.frag);
				} else {
					parentFrag.insertBefore(view.frag[0], node.frag[0]);
					parentFrag.removeChild(node.frag[0]);
				}

				node.frag = view.frag;
				node.update = (attrs) => cmpNode.update(attrs);

				ctx.connected && cmpNode['connectedCallback'] && cmpNode['connectedCallback']();
			})
			.catch(err => {
				CMP_DUMMY_STATE(node.frag[0], 'failed', err.stack || err.toString());
			});
	} else {
		const cmpNode = CMP_BLOCK_FACTORY(
			Block,
			context,
			attrs,
			parentThis,
			events,
			slots,
		);

		node = {
			frag: cmpNode['__view__'].frag,
			update(attrs, context) {
				cmpNode.update(attrs, context);
			},
		};

		ctx.blocks.push(cmpNode);
		ADD_CHILD_CONTEXT(ctx, cmpNode['__view__'].ctx);

		ctx.connected && cmpNode['connectedCallback'] && cmpNode['connectedCallback']();
	}

	if (ISO_FRAG) {
		ISOMORPHIC_APPEND(parentFrag, node);
		ISOMORPHIC_FRAG = ISO_FRAG;
	} else {
		node.frag.appendTo(parentFrag);
	}

	return node;
}

let CMP_COMPILER: {compileBlock: Function;} = null;

function CMP_SET_COMPILER(X) {
	CMP_COMPILER = X;
}

function CMP_INIT(blocks, names) {
	const compileBlock = CMP_COMPILER
		? CMP_COMPILER.compileBlock
		: function (block) { return block; };

	names.forEach(name => {
		const block = blocks[name];

		if (block.length === 0 && !block.prototype.isBlock) {
			let promise;

			try {
				promise = block();

				if (promise.then) {
					promise = promise.then(asyncBlock => (blocks[name] = compileBlock(asyncBlock, {isomorphic: false})));
				} else {
					promise = Promise.reject(new Error(`«${name}» — если это блок, то должен быть хотя бы один аргумент`));
				}
			} catch (err) {
				promise = Promise.reject(err);
			}

			blocks[name] = promise;
		} else {
			blocks[name] = compileBlock(block, {isomorphic: false});
		}
	});
}


// All
export default {
	BOOL_ATTRS,
	ATTR_TO_PROPS,

	MOUNT_TO,
	LIFECYCLE,
	APPEND,
	APPEND_TO,
	APPEND_CHILD,
	HANDLE_EVENT,
	GET_PARENT_NODE,
	REMOVE,
	APPEND_TO_BEFORE,
	REPLACE_CHILD_FRAG,

	FRAGMENT,
	CONTEXT,
	ADD_CHILD_CONTEXT,
	REMOVE_CONTEXT,

	NODE,
	LIVE_NODE,
	UPD_LIVE_NODE,

	TEXT,
	VALUE,
	UPD_VALUE,

	ATTR,
	D_ATTR,

	PROP,
	D_PROP,

	ON,

	IF,
	UPD_IF,

	FOR,
	UPD_FOR,

	CMP_INIT,
	CMP_COMPILER,
	CMP_SET_COMPILER,

	CMP_INLINE,
	CMP_CREATE_INLINE,
	CMP_BLOCK_FACTORY,
	CMP_CREATE,

	ISOMORPHIC,
	ISOMORPHIC_FRAG,
	GET_ISOMORPHIC_NEXT,
};
