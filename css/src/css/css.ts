export interface CSSRules {
	[selector: string]: any;
}

interface ComputedRule {
	used: boolean;
	name: string;
	cssText: string;
	tags: string[];
}

interface ComputedRules {
	[computedName: string]: ComputedRule;
}

const R_TAG = /^<(.+)\/>$/;
const R_UPPER = /[A-Z]/;

const registry: ComputedRules = {};
const SEED = +(process.env.SEED || 0);

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

function simpleChecksum(value: string): string {
	let idx = value.length;
	let hash = SEED;

	while (idx--) {
		hash = (hash * 33) ^ value.charCodeAt(idx);
	}

	return (hash >>> 0).toString(36);
}

function computeCSSPropValue(name, value) {
	if (value >= 0 || value <= 0) {
		value += 'px';
	}

	return value;
}

function toKebabCase(chr) {
	return `-${chr.toLowerCase()}`;
}

function computeCSSPropName(name) {
	return name.replace(R_UPPER, toKebabCase);
}

function computeCSS(rule) {
	const props = [];

	Object.keys(rule).forEach(prop => {
		props.push(`${computeCSSPropName(prop)}:${computeCSSPropValue(prop, rule[prop])}`);
	});

	return props.join(';');
}

function computeRule(rule: any): ComputedRule {
	const cssText = computeCSS(rule);
	const computedName = `_${simpleChecksum(cssText)}`;

	if (!registry.hasOwnProperty(computedName)) {
		registry[computedName] = {
			used: false,
			name: computedName,
			tags: [],
			cssText,
		};
	}

	return registry[computedName];
}

function useRule(rule: ComputedRule, tagName?: string) {
	rule.used = true;
	tagName && rule.tags.push(tagName);
}

function isRuleForTag(name) {
	return R_TAG.test(name);
}

function getCSSText({tags, name, cssText}: ComputedRule) {
	return `${tags && tags.length ? tags.join(',') + ',' : ''}.${name}{${cssText}}`;
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

		if (isRuleForTag(name)) {
			const tagName = name.replace(R_TAG, '$1');
			const tagRule = __cssRules__[name];

			if (tagRule) {
				tagRule.selectorText = tagRule.selectorText.replace(`${tagName}, `, '');
			}

			if (cssRule) {
				cssRule.selectorText = `${tagName}, ${cssRule.selectorText}`;
				__cssRules__[name] = cssRule;
			} else {
				insertRule(rule);
			}
		} else if (!cssRule) {
			insertRule(rule);
		}
	});
}

export function getUsedCSS(): {names: string[], cssText: string} {
	const results = {
		names: [],
		cssText: '',
	};

	Object.keys(registry).forEach(name => {
		const {used} = registry[name];

		if (used) {
			results.names.push(name);
			results.cssText += `${getCSSText(registry[name])}\n`;
		}
	});


	return results;
}

export default function css(rules: CSSRules): {[name: string]: string} {
	const exports = {};

	Object.keys(rules).forEach(name => {
		const rule = computeRule(rules[name]);

		if (__cssNode__) {
			exports[name] = rule.name;
			__cssQueue__.push([name, rule]);

			if (!__cssQueueLock) {
				__cssQueueLock = true;
				requestAnimationFrame(updateRules);
			}
		} else if (isRuleForTag(name)) {
			useRule(rule, name.replace(R_TAG, '$1'));
		} else {
			Object.defineProperty(exports, name, {
				get() {
					rule.used || useRule(rule);
					return process.env.NODE_ENV !== 'production' ? ` ${name}[ ${rule.name} ]` : rule.name;
				}
			});
		}
	});

	return exports;
}
