"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ATTR_TO_PROPS = {
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
var BOOL_ATTRS = {
    'checked': true,
    'autofocus': true,
};
function GET_PARENT_NODE(frag) {
    // todo: Не использовать nodeType-геттер
    if (frag.click) {
        return frag;
    }
    else {
        return GET_PARENT_NODE(frag.parentNode);
    }
}
function HANDLE_EVENT(evt) {
    var type = evt.type;
    var handle = this.events[type];
    if (this.eventsMods.hasOwnProperty(type)) {
        this.eventsMods[type].forEach(function (name) {
            // todo: Переделать
            if (name === 'prevent') {
                evt.preventDefault();
            }
        });
    }
    if (handle.hasOwnProperty('fn')) {
        var ctx = handle.ctx;
        var fnName = handle.fn;
        if (ctx.dispatchEvent) {
            ctx.dispatchEvent(fnName, handle.detail == null ? null : handle.detail, evt);
        }
        else {
            var fn = ctx["@" + ctx];
            if (handle.hasOwnProperty('detail')) {
                fn.call(ctx, handle.detail);
            }
            else {
                fn(evt, null);
            }
        }
    }
    else {
        handle(evt);
    }
}
function MOUNT_TO(container) {
    this.parentNode = container;
    for (var i = 0; i < this.length; i++) {
        container.appendChild(this[i]);
    }
}
function LIFECYCLE(ctx, name) {
    ctx.connected = name === 'connectedCallback';
    var cursor = ctx.first;
    if (cursor != null) {
        do {
            LIFECYCLE(cursor, name);
        } while (cursor = cursor.next);
    }
    var blocks = ctx.blocks;
    var idx = blocks.length;
    while (idx--) {
        var cmp = blocks[idx];
        cmp[name] && cmp[name]();
    }
}
function ATTR(el, name, value) {
    el.setAttribute(name, value);
}
function D_ATTR(node, name, value) {
    if (node.attrs[name] !== value) {
        node.el.setAttribute(name, value);
        node.attrs[name] = value;
    }
}
function PROP(el, name, value) {
    el[name] = value;
}
function D_PROP(node, name, value) {
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
    return APPEND(parent, document.createTextNode(value == null ? '' : value));
}
function VALUE(parent, ctx, id, value) {
    var el = TEXT(parent, value);
    ctx[id] = { el: el, value: value };
    return el;
}
function UPD_VALUE(node, value) {
    if (node.value !== value) {
        node.value = value;
        node.el.nodeValue = value == null ? '' : value;
    }
}
function APPEND_TO_BEFORE(frag, before) {
    var parentNode = GET_PARENT_NODE(frag);
    var refNode = before.hasOwnProperty('frag') ? (before.frag[0] || before.anchor) : before;
    this.parentNode = frag;
    if (this.length === 1) {
        parentNode.insertBefore(this[0], refNode);
    }
    else if (this.length > 1) {
        for (var i = 0; i < this.length; i++) {
            parentNode.insertBefore(this[i], refNode);
        }
    }
}
function REMOVE() {
    var parentNode = GET_PARENT_NODE(this);
    if (this.length === 1) {
        parentNode.removeChild(this[0]);
    }
    else if (this.length > 1) {
        for (var i = 0; i < this.length; i++) {
            parentNode.removeChild(this[i]);
        }
    }
}
function APPEND_TO(parent) {
    this.parentNode = parent;
    if (this.length === 1) {
        parent.appendChild(this[0]);
    }
    else if (this.length > 1) {
        for (var i = 0; i < this.length; i++) {
            parent.appendChild(this[i]);
        }
    }
}
function REPLACE_CHILD_FRAG(oldFrag, newFrag) {
    var domParent = GET_PARENT_NODE(this);
    if (newFrag.length === 1) {
        this[0] = newFrag[0];
        domParent.insertBefore(newFrag[0], oldFrag[0]);
        domParent.removeChild(oldFrag[0]);
        for (var idx = 0; idx < this.parentNode.length; idx++) {
            if (this.parentNode[idx] === oldFrag[0]) {
                this.parentNode[idx] = newFrag[0];
            }
        }
    }
    else {
        throw 'todo';
    }
}
function FRAGMENT(parentNode) {
    return {
        length: 0,
        nodeType: 0,
        parentNode: parentNode,
        appendChild: APPEND_CHILD,
        appendTo: APPEND_TO,
        appendToBefore: APPEND_TO_BEFORE,
        replaceChildFrag: REPLACE_CHILD_FRAG,
        remove: REMOVE,
        mountTo: MOUNT_TO,
    };
}
function CONTEXT(parent) {
    return {
        connected: parent ? parent.connected : false,
        blocks: [],
        next: null,
        prev: null
    };
}
function ADD_CHILD_CONTEXT(parent, child) {
    var last = parent.last;
    child.connected = parent.connected;
    child.parent = parent;
    if (last == null) {
        parent.first = parent.last = child;
    }
    else {
        last.next = child;
        child.prev = last;
        parent.last = child;
    }
    return child;
}
function REMOVE_CONTEXT(ctx) {
    var parent = ctx.parent, prev = ctx.prev, next = ctx.next;
    (parent.first === ctx) && (parent.first = next);
    (parent.last === ctx) && (parent.last = prev);
    (prev !== null) && (prev.next = next);
    (next !== null) && (next.prev = prev);
}
function NODE(parent, name) {
    return APPEND(parent, document.createElement(name));
}
function LIVE_NODE(parent, ctx, id, name) {
    var el = APPEND(parent, document.createElement(name));
    ctx[id] = {
        el: el,
        name: name,
        parent: parent,
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
        var parent_1 = GET_PARENT_NODE(node.parent);
        var attrs = node.attrs;
        var pool = node.pool;
        var oldEl = node.el;
        var el = void 0;
        pool[node.name] = oldEl;
        node.name = name;
        if (pool.hasOwnProperty(name)) {
            el = pool[name];
        }
        else {
            el = document.createElement(name);
        }
        for (var key in attrs) {
            if (ATTR_TO_PROPS.hasOwnProperty(key)) {
                el[key] = attrs[key];
            }
            else {
                el.setAttribute(key, attrs[key]);
            }
        }
        node.el = el;
        parent_1.insertBefore(el, oldEl);
        parent_1.removeChild(oldEl);
        var child = void 0;
        while (child = oldEl.firstChild) {
            el.appendChild(child);
        }
    }
}
function IF(parent, ctx, id, items) {
    var length = items.length;
    var nodes = {};
    var node;
    for (var i = 0; i < length; i++) {
        node = nodes[i] = items[i]();
        if (node !== null) {
            break;
        }
    }
    ctx[id] = {
        node: node,
        anchor: TEXT(parent, ''),
        parent: parent,
        items: items,
        length: length,
        nodes: nodes,
        animator: null,
    };
    if (node !== null) {
        ADD_CHILD_CONTEXT(ctx, node.ctx);
        node.frag.appendTo(parent);
    }
}
function UPD_IF(ctx, id) {
    var condition = ctx[id];
    var length = condition.length;
    var items = condition.items;
    var animator = condition.animator;
    var nodes = condition.nodes;
    var node = condition.node;
    var newNode;
    var update = false;
    for (var i = 0; i < length; i++) {
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
            }
            else {
                node && animator.remove([node]);
                if (newNode) {
                    newNode.frag.appendToBefore(condition.parent, condition.anchor);
                    animator.append([newNode]);
                }
            }
        }
        else {
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
    var index = idProp ? {} : null;
    var nodes;
    var node;
    var item;
    if (data != null) {
        if (data instanceof Array) {
            var length_1 = data.length;
            nodes = new Array(length_1);
            for (var i = 0; i < length_1; i++) {
                item = data[i];
                node = iterator(ctx, item, i);
                nodes[i] = node;
                node.frag.appendTo(parent);
                ADD_CHILD_CONTEXT(ctx, node.ctx);
                if (index !== null) {
                    index[item[idProp]] = node;
                }
            }
        }
        else {
            // todo
        }
    }
    else {
        nodes = [];
    }
    ctx[id] = {
        anchor: TEXT(parent, ''),
        parent: parent,
        nodes: nodes,
        index: index,
        length: nodes.length,
        pool: [],
        animator: null,
    };
}
function UPD_FOR(ctx, id, data, idProp, iterator) {
    var foreach = ctx[id];
    var pool = foreach.pool;
    var parent = foreach.parent;
    var anchor = foreach.anchor;
    var oldNodes = foreach.nodes;
    var oldLength = foreach.length;
    var animator = foreach.animator;
    var oldIndex = foreach.index;
    var newIndex = idProp ? {} : null;
    var pivotIdx = 0;
    var newNodes;
    var node;
    var item;
    var idValue;
    if (data != null) {
        if (data instanceof Array) {
            var length_2 = data.length;
            newNodes = new Array(length_2);
            for (var i = 0; i < length_2; i++) {
                item = data[i];
                if (newIndex !== null) {
                    idValue = item[idProp];
                    if (oldIndex.hasOwnProperty(idValue)) {
                        node = oldIndex[idValue];
                        node.update(item, i);
                        node.reused = true;
                        if (pivotIdx < node.index) {
                            pivotIdx = node.index;
                        }
                        else {
                            node.frag.appendToBefore(parent, oldNodes[pivotIdx + 1] || anchor);
                        }
                    }
                    else {
                        if (pool.length) {
                            node = pool.pop();
                            node.update(item, i);
                        }
                        else {
                            node = iterator(ctx, item, i);
                        }
                        ADD_CHILD_CONTEXT(ctx, node.ctx);
                        LIFECYCLE(node.ctx, 'connectedCallback');
                        node.frag.appendToBefore(parent, oldNodes[pivotIdx + 1] || anchor);
                        animator && animator.append && animator.append([node]);
                    }
                    newIndex[idValue] = node;
                }
                else if (i < oldLength) {
                    node = oldNodes[i];
                    node.reused = true;
                    node.update(item, i);
                }
                else {
                    if (pool.length) {
                        node = pool.pop();
                        node.update(item, i);
                    }
                    else {
                        node = iterator(ctx, item, i);
                    }
                    ADD_CHILD_CONTEXT(ctx, node.ctx);
                    LIFECYCLE(node.ctx, 'connectedCallback');
                    node.frag.appendToBefore(parent, anchor);
                }
                node.index = i;
                newNodes[i] = node;
            }
        }
        else {
            // todo
        }
    }
    else {
        newNodes = [];
    }
    var idx = oldLength;
    var useAnim = animator && animator.remove;
    while (idx--) {
        node = oldNodes[idx];
        if (!node.reused) {
            node.update(node.data, idx);
            if (useAnim) {
                animator.remove([node], pool);
            }
            else {
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
    var node = store[name](attrs);
    node.__parent__ = parentThis;
    node.__events__ = events;
    node.frag.appendTo(parentFrag);
    return node;
}
function CMP_DUMMY_STATE(el, state, stateText) {
    el.className = "block-dummy block-dummy-" + state;
    stateText && el.setAttribute('data-block-error', stateText);
}
function CMP_CREATE_DUMMY(name, attrs) {
    var dummy = document.createElement('div');
    ATTR(dummy, 'data-block', name);
    CMP_DUMMY_STATE(dummy, 'loading');
    var node = {
        frag: {
            0: dummy,
            length: 1,
            appendTo: function (parent) {
                parent.appendChild(dummy);
            }
        },
        attrs: attrs,
        update: function (attrs) {
            node.attrs = attrs;
        }
    };
    return node;
}
function CMP_CREATE(ctx, blocks, parentFrag, parentThis, name, attrs, events, slots) {
    var node;
    var Block = blocks[name];
    if (Block == null) {
        node = CMP_CREATE_DUMMY(name, attrs);
        CMP_DUMMY_STATE(node.frag[0], 'failed', 'Undefined Block');
    }
    else if (Block.then) {
        node = CMP_CREATE_DUMMY(name, attrs);
        Block
            .then(function (XBlock) {
            var cmpNode = new XBlock(node.attrs, {
                parent: parentThis,
                events: events,
                slots: slots,
            });
            var view = cmpNode['__view__'];
            ctx.blocks.push(cmpNode);
            ADD_CHILD_CONTEXT(ctx, view.ctx);
            if (parentFrag.replaceChildFrag) {
                parentFrag.replaceChildFrag(node.frag, view.frag);
            }
            else {
                parentFrag.insertBefore(view.frag[0], node.frag[0]);
                parentFrag.removeChild(node.frag[0]);
            }
            node.frag = view.frag;
            node.update = function (attrs) { return cmpNode.update(attrs); };
            ctx.connected && cmpNode['connectedCallback'] && cmpNode['connectedCallback']();
        })
            .catch(function (err) {
            CMP_DUMMY_STATE(node.frag[0], 'failed', err.stack || err.toString());
        });
    }
    else {
        var cmpNode_1 = new Block(attrs, {
            parent: parentThis,
            events: events,
            slots: slots,
        });
        node = {
            frag: cmpNode_1['__view__'].frag,
            update: function (attrs) { return cmpNode_1.update(attrs); },
        };
        ctx.connected && cmpNode_1['connectedCallback'] && cmpNode_1['connectedCallback']();
    }
    node.frag.appendTo(parentFrag);
    return node;
}
var CMP_COMPILER = null;
function CMP_SET_COMPILER(X) {
    CMP_COMPILER = X;
}
function CMP_TO_CLASS(block) {
    var Class = block.prototype && block.prototype.isBlock ? block : CMP_COMPILER.blockify(block);
    if (!Class.prototype.__template__) {
        var configure = CMP_COMPILER.configure, deps_1 = CMP_COMPILER.deps;
        var template = Class.template;
        var compile = configure({
            scope: [
                '__this__',
                '__slots__',
                '__blocks__',
                'attrs',
            ],
            blocks: Object.keys(Class.blocks || {}),
        });
        var templateFactory = compile(template);
        Class.prototype.__template__ = templateFactory(Object.keys(deps_1).reduce(function (obj, name) {
            obj[name] = deps_1[name][1];
            return obj;
        }, {}));
    }
    return Class;
}
function CMP_INIT(blocks, names) {
    names.forEach(function (name) {
        var block = blocks[name];
        if (block.length === 0 && !block.prototype.isBlock) {
            var promise = void 0;
            try {
                promise = block();
                if (promise.then) {
                    promise = promise.then(function (asyncBlock) { return (blocks[name] = CMP_TO_CLASS(asyncBlock)); });
                }
                else {
                    promise = Promise.reject(new Error("\u00AB" + name + "\u00BB \u2014 \u0435\u0441\u043B\u0438 \u044D\u0442\u043E \u0431\u043B\u043E\u043A, \u0442\u043E \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u0438\u043D \u0430\u0440\u0433\u0443\u043C\u0435\u043D\u0442"));
                }
            }
            catch (err) {
                promise = Promise.reject(err);
            }
            blocks[name] = promise;
        }
        else {
            blocks[name] = CMP_TO_CLASS(block);
        }
    });
}
// All
exports.default = {
    BOOL_ATTRS: BOOL_ATTRS,
    ATTR_TO_PROPS: ATTR_TO_PROPS,
    MOUNT_TO: MOUNT_TO,
    LIFECYCLE: LIFECYCLE,
    APPEND: APPEND,
    APPEND_TO: APPEND_TO,
    APPEND_CHILD: APPEND_CHILD,
    HANDLE_EVENT: HANDLE_EVENT,
    GET_PARENT_NODE: GET_PARENT_NODE,
    REMOVE: REMOVE,
    APPEND_TO_BEFORE: APPEND_TO_BEFORE,
    REPLACE_CHILD_FRAG: REPLACE_CHILD_FRAG,
    FRAGMENT: FRAGMENT,
    CONTEXT: CONTEXT,
    ADD_CHILD_CONTEXT: ADD_CHILD_CONTEXT,
    REMOVE_CONTEXT: REMOVE_CONTEXT,
    NODE: NODE,
    LIVE_NODE: LIVE_NODE,
    UPD_LIVE_NODE: UPD_LIVE_NODE,
    TEXT: TEXT,
    VALUE: VALUE,
    UPD_VALUE: UPD_VALUE,
    ATTR: ATTR,
    D_ATTR: D_ATTR,
    PROP: PROP,
    D_PROP: D_PROP,
    ON: ON,
    IF: IF,
    UPD_IF: UPD_IF,
    FOR: FOR,
    UPD_FOR: UPD_FOR,
    CMP_INIT: CMP_INIT,
    CMP_TO_CLASS: CMP_TO_CLASS,
    CMP_COMPILER: CMP_COMPILER,
    CMP_SET_COMPILER: CMP_SET_COMPILER,
    CMP_INLINE: CMP_INLINE,
    CMP_CREATE_INLINE: CMP_CREATE_INLINE,
    CMP_CREATE: CMP_CREATE,
};
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
