export interface IRules {
	[selector: string]: IRule;
}

export interface IRule {
	[selector: string]: string | number | IRule;
}

interface ComputedRule {
	used: boolean;
	name: string;
	cssText: string;
	linked: string[];
	pseudo: ComputedRule[];
	dependsOn: ComputedRule[];
}

interface ComputedRules {
	[computedName: string]: ComputedRule;
}

export interface CSSResult {
	names: string[];
	cssText: string;
}

const AMP_CODE = '&'.charCodeAt(0);
const R_UPPER = /[A-Z]/;
const SEED = +(process.env.SEED || 0);

let registry: ComputedRules = {};

const __cssNode__ = typeof document !== 'undefined' ? document.getElementById('__css__') : null;
const __cssRules__ = {};
const __cssSheet__: CSSStyleSheet = __cssNode__ ? __cssNode__['sheet'] : null;
const __cssQueue__ = [];
let __cssQueueLock = false;

if (__cssNode__) {
	[].forEach.call(__cssSheet__.rules, (rule) => {
		rule.selectorText.split(/\,\s*/).forEach(selector => {
			__cssRules__[selector.charAt(0) === '.' ? selector.substr(1) : `<${selector}/>`] = rule;
		});
	});
}

function hash(value: string): string {
	let idx = value.length;
	let hash = SEED;

	while (idx--) {
		hash = (hash * 33) ^ value.charCodeAt(idx);
	}

	return `_${(hash >>> 0).toString(36)}`;
}

function computeCSSPropValue(name, value) {
	if (value >= 0 || value <= 0) {
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

function computeCSS(rule) {
	const props = [];
	const nested = [];

	Object.keys(rule).forEach(prop => {
		if (prop.charCodeAt(0) === AMP_CODE) {
			nested.push(computeRule(rule[prop]));
		} else {
			props.push(`${toKebabCase(prop)}:${computeCSSPropValue(prop, rule[prop])}`);
		}
	});

	return props.join(';');
}

function computeRule(rule: any): ComputedRule {
	const cssText = computeCSS(rule);
	const computedName = hash(cssText);

	if (!registry.hasOwnProperty(computedName)) {
		registry[computedName] = {
			used: false,
			name: computedName,
			linked: [],
			pseudo: [],
			dependsOn: [],
			cssText,
		};
	}

	return registry[computedName];
}

function useRule(rule: ComputedRule) {
	rule.used = true;

	if (rule.dependsOn.length) {
		rule.dependsOn.forEach(rule => useRule(rule));
	}
}

function getCSSText({name, cssText, linked}: ComputedRule) {
	return `${(linked.length ? linked.join(',') + ',' : '')}.${name}{${cssText}}`;
}

function insertRule(rule: ComputedRule) {
	const idx = __cssSheet__.rules.length;

	__cssSheet__.insertRule(getCSSText(rule), idx);
	__cssRules__[rule.name] = idx;
}

function updateRules() {
	__cssQueueLock = false;
	__cssQueue__.forEach(([name, rule]) => {
		const cssRule = __cssRules__[rule.name];

		if (!cssRule) {
			insertRule(rule);
		}
	});
}

export function revertCSSNode() {
	const dummyCSS = document.getElementById('__css__');
	const {parentNode} = dummyCSS;

	parentNode.insertBefore(__cssNode__, dummyCSS);
	parentNode.removeChild(dummyCSS);
}

export function getUsedCSS(all?: boolean): CSSResult {
	const results = {
		names: [],
		cssText: '',
	};

	Object.keys(registry).forEach(name => {
		const {used} = registry[name];

		if (all || used) {
			results.names.push(name);
			results.cssText += `${getCSSText(registry[name])}\n`;
		}
	});

	return results;
}

export function resetCSS() {
	registry = {};
}

export default function css(rules: IRules): {[name: string]: string} {
	const exports = {};
	const compuledRules = {};
	const proxy = {};
	const keys = Object.keys(rules);

	keys.forEach(name => {
		const rule = computeRule(rules[name]);

		if (name.indexOf(':') > -1) {
			const [rootName, pseudoName] = name.split(':');
			const rootRule = registry[exports[rootName]];
			const extraName = hash(`${rootRule.name}-${rule.name}-${pseudoName}`);

			rule.linked.push(`.${extraName}:${pseudoName}`);
			rootRule.dependsOn.push(rule);
			exports[rootName] += ` ${extraName}`;
		}

		compuledRules[name] = rule;

		if (__cssNode__) {
			exports[name] = rule.name;
			__cssQueue__.push([name, rule]);

			if (!__cssQueueLock) {
				__cssQueueLock = true;
				requestAnimationFrame(updateRules);
			}
		} else {
			exports[name] = rule.name;
		}
	});

	if (process.env.RUN_AT === 'server') {
		keys.forEach(name => {
			const rule = compuledRules[name];
			const value = exports[name];

			Object.defineProperty(proxy, name, {
				get() {
					rule.used || useRule(rule);
					return process.env.NODE_ENV !== 'production' ? ` ${name}[ value ]` : value;
				},
			});
		});

		return proxy;
	} else {
		return exports;
	}
}
