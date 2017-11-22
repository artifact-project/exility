export interface IRuleDefinitions {
	[selector: string]: IRuleEntries;
}

export interface IComputedRule {
	isFx: boolean;
	used: boolean;
	name: string;
	cssText: string;
	linked: string[];
}

export interface IFx {
	value: string;
	computedRule: IComputedRule;
}

export interface IRuleEntries {
	[selector: string]: string | number | IRuleEntries | IFx;
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

const nextTick = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : setTimeout;

const notPx = {
	opacity: 1,
};

let registry: {[index:string]: IComputedRule} = {};
let SEED = +(process.env.SEED || Math.round(Math.random() * 1e4));
let cid = SEED;

let __cssNode__: HTMLStyleElement = null;
let __cssRules__: {[computedName: string]: CSSStyleRule} = {};
let __cssSheet__: CSSStyleSheet = null;

const __cssQueue__: IRuleRegistryEntry[] = [];
let __cssQueueLock__ = false;

export function setStyleNode(el: HTMLElement, names?: string[]) {
	if (el && el['sheet']) {
		__cssNode__ = <HTMLStyleElement>el;
		__cssSheet__ = el['sheet'];

		if (names == null) {
			names = (__cssNode__.getAttribute('data-names') || '').split(',');
		}

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
	if (!notPx.hasOwnProperty(name) && (value >= 0 || value <= 0)) {
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
	__cssRules__[name] = insertCSSRule(`._${name},${linked.join(',')}`, cssText);
}

function insertCSSRule(selectorText: string, cssText: string): CSSStyleRule {
	const idx = __cssSheet__.cssRules.length;
	__cssSheet__.insertRule(`${selectorText}{${cssText}}`, idx);
	return <CSSStyleRule>__cssSheet__.cssRules[idx];
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

export function getUsedCSS(all?: boolean): IUsedCSS {
	const results = {
		names: [],
		cssText: '',
	};

	Object.keys(registry).forEach(name => {
		const {used, isFx, linked, cssText} = registry[name];

		if (all || used) {
			let value = `${isFx ? `@keyframes _${name}` : linked.join(',')}{${cssText}}\n`;

			if (process.env.NODE_ENV !== 'production') {
				!isFx && (value = `._${name},${value}`);
			}

			results.names.push(name);
			results.cssText += value;
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

function getComputedRule(cssText, isFx = false) {
	const computedName = hash(cssText);

	if (!registry.hasOwnProperty(computedName)) {
		registry[computedName] = {
			isFx,
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

function compileRawRuleProps(rawRule, origSelector?, linkedRules?, exports?) {
	return Object.keys(rawRule).map(propName => {
		let value = rawRule[propName];

		if (R_HAS_REF.test(<string>propName)) {
			return compileRawRule(
				propName.replace(R_REFS, addDot(origSelector)),
				<IRuleEntries>value,
				exports,
				linkedRules,
			);
		} else {
			if (propName === 'animation') {
				linkRules(linkedRules, origSelector.split(/\s*\./).pop(), value.computedRule);
				value = value.value;
			}

			return `${toKebabCase(propName)}:${computeCSSPropValue(propName, value)};`;
		}
	}).join('');
}

function linkRules(linkedRules, name, computedRule) {
	!linkedRules[name] && (linkedRules[name] = []);
	linkedRules[name].push(computedRule);
}

function compileRawRule(selectors: string, rawRule: IRuleEntries, exports, linkedRules) {
	selectors.split(R_SELECTOR_GLUE).forEach(origSelector => {
		const cssText = compileRawRuleProps(rawRule, origSelector, linkedRules, exports);
		const origNames = [];
		const computedRule = getComputedRule(cssText);
		const publicSelector = origSelector.replace(R_SELECTOR, (_, origName) => {
			origNames.push(origName);
			return addDot(getPublicName(exports, origName, computedRule.name));
		});

		origNames.forEach(name => {
			linkRules(linkedRules, name, computedRule);
		});

		!computedRule.linked.includes(publicSelector) && computedRule.linked.push(publicSelector);
	});
}

export function fx(keyframes: {[frame:string]: IRuleEntries}) {
	const cssText = Object.keys(keyframes)
		.map(name => `${(+name >= 0) ? `${name}%` : name}{${compileRawRuleProps(keyframes[name])}}`)
		.join('');
	const computedRule = getComputedRule(cssText, true);

	return (detail: string): IFx => ({
		value: `_${computedRule.name} ${detail}`,
		computedRule,
	});
}

export interface ICSSFactory {
	(rules: IRuleDefinitions): {[name: string]: string};
	fx: (keyframes: {[frame:string]: IRuleEntries}) => (detail: string) => IFx;
	scheme: (name: string, list: string[]) => {[name: string]: string};
}

export type CSSMap = {[name: string]: string};

function css(rules: IRuleDefinitions): CSSMap {
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
					nextTick(updateRules);
				}
			});
		});
	}

	return exports;
}

export function scheme(id: string, list: string[]) {
	if (!/^[a-z][a-z0-9-]+$/.test(id)) {
		throw new Error('[@exility/css] scheme name must be includes only a-z, 0-9 and -');
	}

	return list.reduce((rules: IRuleDefinitions, name) => {
		Object.defineProperty(rules, name, {
			writable: false,
			configurable: false,
			get() {
				return {};
			},
		});

		return rules;
	}, {});
}

css['fx'] = fx;
css['scheme'] = scheme;

export function addPrefix(prefix: string, list: string[]) {
	return list.map(val => prefix + val);
}

export function addPostfix(postfix: string, list: string[]) {
	return list.map(val => val + postfix);
}

export default <ICSSFactory>css;

if (process.env.RUN_AT !== 'server') {
	setStyleNode(
		typeof document !== 'undefined' ? document.getElementById('__css__') : null,
	);
}
