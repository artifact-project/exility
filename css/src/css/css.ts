export interface IRuleDefinitions {
	[selector: string]: IRuleEntries;
}

export interface IRuleEntries {
	[selector: string]: string | number | IRuleEntries;
}

interface IRuleRegistryEntry {
	used: boolean;
	name: string;
	cssText: string;
	linked: string[];
}

export interface IUsedCSS {
	names: string[];
	cssText: string;
}

const R_UPPER = /[A-Z]/;
const R_SELECTOR_GLUE = /\s*,\s*/;
const R_SELECTOR = /(?:^|\.)([a-z][a-z\d_-]+)/ig;
const R_HAS_REF = /&/;
const R_REFS = /&/g;
const DOT_CODE = '.'.charCodeAt(0);

const notPx = {
	opacity: 1,
};

let registry = {};
let SEED = +(process.env.SEED || Math.round(Math.random() * 1e4));
let cid = SEED;

let __cssNode__: HTMLStyleElement = null;
let __cssRules__: {[computedName: string]: CSSStyleRule};
let __cssSheet__: CSSStyleSheet;

const __cssQueue__: IRuleRegistryEntry[] = [];
let __cssQueueLock__ = false;

export function setStyleNode(el: HTMLElement, names: string[]) {
	if (el && el['sheet']) {
		__cssNode__ = el;
		__cssSheet__ = el['sheet'];

		[].forEach.call(__cssSheet__.cssRules, (rule, idx) => {
			__cssRules__[names[idx]] = rule;
		});
	} else {
		console.warn('[@exility/css] el — must be HTMLStyleElement');
	}
}

function getNextName() {
	return `_${(cid++).toString(36)}`;
}

function hash(value: string): string {
	let idx = value.length;
	let hash = SEED;

	while (idx--) {
		hash = (hash * 33) ^ value.charCodeAt(idx);
	}

	return (hash >>> 0).toString(36);
}

function computeCSSPropValue(name, value) {
	if (!notPx.hasOwnProperty(name) && value >= 0 || value <= 0) {
		value += 'px';
	}

	return value;
}

function kebabReplacer(chr) {
	return `-${chr.toLowerCase()}`;
}

function toKebabCase(name) {
	return name.replace(R_UPPER, kebabReplacer);
}

function insertRule({name, linked, cssText}: IRuleRegistryEntry) {
	const idx = __cssSheet__.cssRules.length;

	__cssSheet__.insertRule(`.${name},${linked.join(',')}{${cssText}}\n`, idx);
	__cssRules__[name] = <CSSStyleRule>__cssSheet__.cssRules[idx];
}

function updateRules() {
	__cssQueueLock__ = false;
	__cssQueue__.forEach(rule => {
		const cssRule = __cssRules__[rule.name];

		if (cssRule === void 0) {
			insertRule(rule);
		} else {
			cssRule.selectorText = [`.${rule.name}`].concat(rule.linked).join(',');
		}
	});
	__cssQueue__.length = 0;
}

export function revertCSSNode() {
	const dummyCSS = document.getElementById('__css__');
	const {parentNode} = dummyCSS;

	parentNode.insertBefore(__cssNode__, dummyCSS);
	parentNode.removeChild(dummyCSS);
}

export function getUsedCSS(all?: boolean): IUsedCSS {
	const results = {
		names: [],
		cssText: '',
	};

	Object.keys(registry).forEach(name => {
		const {used, linked, cssText} = registry[name];

		if (all || used) {
			results.names.push(name);
			results.cssText += `${linked.join(',')}{${cssText}}\n`;

			if (process.env.NODE_ENV !== 'production') {
				results.cssText = `.${name},${results.cssText}`;
			}
		}
	});

	return results;
}

export function resetCSS(newSeed) {
	cid = newSeed;
	SEED = newSeed;
	registry = {};
	__cssRules__ = {};
	__cssQueue__.length = 0;
}

function getPublicName(exports, name, computedName) {
	if (!exports.hasOwnProperty(name)) {
		if (process.env.NODE_ENV !== 'production') {
			exports[name] = `${name}-${computedName}`;
		} else {
			exports[name] = getNextName();
		}
	}

	return exports[name];
}

function getComputedRule(cssText) {
	const computedName = hash(cssText);

	if (!registry.hasOwnProperty(computedName)) {
		registry[computedName] = {
			used: false,
			name: computedName,
			cssText,
			linked: [],
		};
	}

	return registry[computedName];
}

function addDot(selector) {
	return selector.charCodeAt(0) === DOT_CODE ? selector : `.${selector}`;
}

function compileRawRule(selectors: string, rawRule: IRuleEntries, exports, linkedRules) {
	selectors.split(R_SELECTOR_GLUE).forEach(origSelector => {
		let cssText = '';

		Object.keys(rawRule).forEach(propName => {
			const value = rawRule[propName];

			if (R_HAS_REF.test(<string>propName)) {
				compileRawRule(
					propName.replace(R_REFS, addDot(origSelector)),
					<IRuleEntries>value,
					exports,
					linkedRules,
				);
			} else {
				cssText += `${toKebabCase(propName)}:${computeCSSPropValue(propName, value)};`;
			}
		});

		const computedRule = getComputedRule(cssText);
		const origNames = [];
		const publicSelector = origSelector.replace(R_SELECTOR, (_, origName) => {
			origNames.push(origName);
			return addDot(getPublicName(exports, origName, computedRule.name));
		});

		origNames.forEach(name => {
			!linkedRules[name] && (linkedRules[name] = []);
			linkedRules[name].push(computedRule);
		});

		!computedRule.linked.includes(publicSelector) && computedRule.linked.push(publicSelector);
	});
}

export default function css(rules: IRuleDefinitions): {[name: string]: string} {
	const exports = {};
	const linkedRules = {};

	Object.keys(rules).forEach(selectors => {
		compileRawRule(selectors, rules[selectors], exports, linkedRules);
	});

	if (process.env.RUN_AT === 'server') {
		const proxy = {};

		Object.keys(exports).forEach(name => {
			const rules = linkedRules[name];
			const privateName = exports[name];

			Object.defineProperty(proxy, name, {
				get() {
					rules.forEach(rule => {
						rule.used || (rule.used = true);
					});

					return privateName;
				},
			});
		});

		return proxy;
	} else if (__cssNode__ !== null) {
		Object.keys(exports).forEach(name => {
			linkedRules[name].forEach(rule => {
				__cssQueue__.push(rule);

				if (!__cssQueueLock__) {
					__cssQueueLock__ = true;
					updateRules();
				}
			});
		});
	}

	return exports;
}

if (process.env.RUN_AT !== 'server') {
	setStyleNode(
		typeof document !== 'undefined' ? document.getElementById('__css__') : null,
		(process.env.EXILITY_CSS || '').split(','),
	);
}
