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

	SLOT(slots: object, __super__: object, name: string, fn: Function, parent: object) {
		if (slots && slots.hasOwnProperty(name)) {
			return slots[name](__super__, parent);
		} else {
			return fn();
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

	CSS_MODULE(classNames:{[index:string]: string}) {
		function classNameGetter(name: string) {
			if (classNames.hasOwnProperty(name)) {
				return classNames[name];
			} else if (name.indexOf(' ') !== -1) {
				return (classNames[name] = name.trim().split(/\s+/).map(classNameGetter).join(' '));
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
