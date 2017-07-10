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
};

const BOOL_ATTRS = {
	'checked': true,
	'autofocus': true,
};

function GET_PARENT_NODE(frag) {
	// todo: Не использовать nodeType-геттер
	if (frag.click) {
		return frag;
	} else {
		return GET_PARENT_NODE(frag.parentNode);
	}
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

		if (ctx.dispatchEvent) {
			ctx.dispatchEvent(fnName, handle.detail == null ? null : handle.detail, evt);
		} else {
			let fn = ctx[`@${ctx}`];

			if (handle.hasOwnProperty('detail')) {
				fn.call(ctx, handle.detail);
			} else {
				fn(evt, null);
			}
		}
	} else {
		handle(evt);
	}
}

function MOUNT_TO(container) {
	this.parentNode = container;

	for (let i = 0; i < this.length; i++) {
		container.appendChild(this[i]);
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
	el[name] = value;
}

function D_PROP(node, name, value) {
	if (node.attrs[name] !== value) {
		node.el[name] = value == null ? '' : value;
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
	return APPEND(parent, document.createTextNode(value == null ? '' : value));
}

function VALUE(parent, ctx, id, value) {
	const el = TEXT(parent, value);
	ctx[id] = {el, value};
	return el;
}

function UPD_VALUE(node, value) {
	if (node.value !== value) {
		node.value = value;
		node.el.nodeValue = value == null ? '' : value;
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

function NODE(parent, name:string) {
	return APPEND(parent, document.createElement(name));
}

function LIVE_NODE(parent, ctx, id, name) {
	const el = APPEND(parent, document.createElement(name));

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
	let node;

	for (let i = 0; i < length; i++) {
		node = nodes[i] = items[i]();

		if (node !== null) {
			break;
		}
	}

	ctx[id] = {
		node,
		anchor: TEXT(parent, ''),
		parent,
		items,
		length,
		nodes,
		animator: null,//GlobalAnimator ? new GlobalAnimator() : null,
	};

	if (node !== null) {
		ADD_CHILD_CONTEXT(ctx, node.ctx);
		node.frag.appendTo(parent);
	}
}

function UPD_IF(ctx, id) {
	const condition = ctx[id];
	const length = condition.length;
	const items = condition.items;
	const animator = condition.animator;
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
		if (animator !== null) {
			if (node && newNode) {
				animator.replace(condition, node, newNode);
			} else {
				node && animator.remove([node]);

				if (newNode) {
					newNode.frag.appendToBefore(condition.parent, condition.anchor);
					animator.append([newNode]);
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
	let nodes;
	let node;
	let item;

	if (data != null) {
		if (data instanceof Array) {
			const length = data.length;
			nodes = new Array(length);

			for (let i = 0; i < length; i++) {
				item = data[i];
				node = iterator(ctx, item, i);
				nodes[i] = node;

				node.frag.appendTo(parent);
				ADD_CHILD_CONTEXT(ctx, node.ctx);

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

	ctx[id] = {
		anchor: TEXT(parent, ''),
		parent,
		nodes,
		index,
		length: nodes.length,
		pool: [],
		animator: null, //GlobalAnimator ? new GlobalAnimator() : null,
	};
}

function UPD_FOR(ctx, id, data, idProp, iterator) {
	const foreach = ctx[id];
	const pool = foreach.pool;
	const parent = foreach.parent;
	const anchor = foreach.anchor;
	const oldNodes = foreach.nodes;
	const oldLength = foreach.length;
	const animator = foreach.animator;
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
						animator && animator.append && animator.append([node]);
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
	let useAnim = animator && animator.remove;

	while (idx--) {
		node = oldNodes[idx];

		if (!node.reused) {
			node.update(node.data, idx);

			if (useAnim) {
				animator.remove([node], pool);
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

function CMP_CREATE_INLINE(store, parentFrag, parentThis, name, attrs, events) {
	const node = store[name](attrs);

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
	const dummy = document.createElement('div');

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

function CMP_CREATE(ctx, blocks, parentFrag, parentThis, name, attrs, events, slots) {
	let node;
	let Block = blocks[name];

	if (Block == null) {
		node = CMP_CREATE_DUMMY(name, attrs);
		CMP_DUMMY_STATE(node.frag[0], 'failed', 'Undefined Block');
	} else if (Block.then) {
		node = CMP_CREATE_DUMMY(name, attrs);

		Block
			.then((XBlock) => {
				const cmpNode = new XBlock(node.attrs, {
					parent: parentThis,
					events,
					slots,
				});
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
		const cmpNode = new Block(attrs, {
			parent: parentThis,
			events,
			slots,
		});

		node = {
			frag: cmpNode['__view__'].frag,
			update: (attrs) => cmpNode.update(attrs),
		};

		ctx.connected && cmpNode['connectedCallback'] && cmpNode['connectedCallback']();
	}

	node.frag.appendTo(parentFrag);

	return node;
}

let CMP_COMPILER:{blockify: Function, configure: Function, deps: any} = null;

function CMP_SET_COMPILER(X) {
	CMP_COMPILER = X;
}

function CMP_TO_CLASS(block) {
	const Class = block.prototype && block.prototype.isBlock ? block : CMP_COMPILER.blockify(block);

	if (!Class.prototype.__template__) {
		const {configure, deps} = CMP_COMPILER;
		const {template} = Class;
		const compile = configure({
			scope: [
				'__this__',
				'__slots__',
				'__blocks__',
				'attrs',
			].concat(
				Class.classNames ? '__classNames__' : [],
			),
			blocks: Object.keys(Class.blocks || {}),
			cssModule: !!Class.classNames,
		});
		const templateFactory = compile(template);

		Class.prototype.__template__ = templateFactory(Object.keys(deps).reduce((obj, name) => {
			obj[name] = deps[name][1];
			return obj;
		}, {}));
	}

	return Class;
}

function CMP_INIT(blocks, names) {
	names.forEach(name => {
		const block = blocks[name];

		if (block.length === 0 && !block.prototype.isBlock) {
			let promise;

			try {
				promise = block();

				if (promise.then) {
					promise = promise.then(asyncBlock => (blocks[name] = CMP_TO_CLASS(asyncBlock)));
				} else {
					promise = Promise.reject(new Error(`«${name}» — если это блок, то должен быть хотя бы один аргумент`));
				}
			} catch (err) {
				promise = Promise.reject(err);
			}

			blocks[name] = promise;
		} else {
			blocks[name] = CMP_TO_CLASS(block);
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
	CMP_TO_CLASS,

	CMP_COMPILER,
	CMP_SET_COMPILER,

	CMP_INLINE,
	CMP_CREATE_INLINE,
	CMP_CREATE,
}

// export function anim(animName, parent, callback) {
// 	const _ga = GlobalAnimator;
// 	const Anim = Animator.get(animName);
// 	const children = parent.children || parent;
// 	const startIndex = children.length;
// 	const appended = [];
//
// 	GlobalAnimator = Anim;
//
// 	callback();
//
// 	GlobalAnimator = _ga;
//
//
// 	for (let i = startIndex; i < children.length; i++) {
// 		if (children[i].nodeType === 1) {
// 			appended.push(children[i]);
// 		}
// 	}
//
// 	if (appended.length) {
// 		const anim = new Anim();
//
// 		anim.events && anim.events(appended[0]);
//
// 		setTimeout(() => {
// 			anim.appear && anim.appear(appended);
// 		}, 0);
// 	}
// }
