const R_HTML_ENTITES = /[&<>"]/;
const R_HTML_ENTITY_AMP = /&/g;
const R_HTML_ENTITY_LT = /</g;
const R_HTML_ENTITY_GT = />/g;
const R_HTML_ENTITY_QUOTE = /"/g;

function NOOP() {}

function HTML_ENCODE(value?) {
	if (value == null) {
		return '';
	}

	if (R_HTML_ENTITES.test(value)) {
		if (value.indexOf('&') !== -1) {
			value = value.replace(R_HTML_ENTITY_AMP, '&amp;');
		}

		if (value.indexOf('<') !== -1) {
			value = value.replace(R_HTML_ENTITY_LT, '&lt;');
		}

		if (value.indexOf('>') !== -1) {
			value = value.replace(R_HTML_ENTITY_GT, '&gt;');
		}

		if (value.indexOf('"') !== -1) {
			value = value.replace(R_HTML_ENTITY_QUOTE, '&quot;');
		}

		return value;
	}

	return value.toString();
}

export default {
	NIL: null,

	R_HTML_ENTITES,
	R_HTML_ENTITY_AMP,
	R_HTML_ENTITY_LT,
	R_HTML_ENTITY_GT,
	R_HTML_ENTITY_QUOTE,

	NOOP,

	TO_STRING(value?) {
		return value == null ? '' : value + '';
	},

	RETURN_EMPTY_STRING() {
		return '';
	},

	HTML_ENCODE,

	HTML_ENCODE_MC(value?) {
		return `<!--(-->${HTML_ENCODE(value)}<!--)-->`;
	},

	EACH(data, callback: (value, key) => void) {
		if (data != null) {
			if (data.forEach) {
				const length = data.length;

				for (let i = 0; i < length; i++) {
					callback(data[i], i);
				}
			} else {
				for (let key in data) {
					if (data.hasOwnProperty(key)) {
						callback(data[key], key);
					}
				}
			}
		}
	},

	SLOT(parentBlock, slots: object, __super__: object, name: string, fn: Function, parent: object) {
		if (slots && slots.hasOwnProperty(name)) {
			return slots[name](parentBlock, __super__, parent);
		} else {
			return fn(parentBlock);
		}
	},

	CLONE_OBJECT(target: object) {
		const cloned = {};

		if (target != null) {
			for (const key in target) {
				cloned[key] = target[key];
			}
		}

		return cloned;
	},

	NEXT_CONTEXT(block) {
		// todo: можно попробовать ещё __proto__ использовать для скорости
		if (typeof block.getContextForNested === "function") {
			const next = (NOOP.prototype = block.context, new NOOP);
			const ctx = block.getContextForNested();

			for (const key in ctx) {
				next[key] = ctx[key];
			}

			return next;
		} else {
			return block.context;
		}
	},

	CONTEXT_IS_CHANGED(previousContext, nextContext) {
		if (nextContext && previousContext) {
			for (let key in nextContext) {
				if (previousContext[key] !== nextContext[key]) {
					return true;
				}
			}

			return false;
		}

		return true;
	},

	CSS_MODULE(classNames:{[index:string]: string}) {
		const R_WS = /\s+/, WS = ' ', EMPTY = '';

		function classNameGetter(name: string) {
			if (name === EMPTY) {
				return EMPTY;
			} else if (classNames.hasOwnProperty(name)) {
				return classNames[name];
			} else if (name.indexOf(WS) !== -1) {
				return (classNames[name] = name.trim().split(R_WS).map(classNameGetter).join(WS));
			} else {
				return `[warn: ${name}]`;
			}
		}

		classNameGetter['upd'] = function (newClassNames) {
			classNames = newClassNames;
		};

		return classNameGetter;
	}
};
