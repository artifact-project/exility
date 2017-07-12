import {
	ICompilerOptions,
	createCompiler,

	stringifyObjectKey,
	stringifyParsedValue,
	stringifyAttributeValue,
} from '@exility/compile';
import {XNode, IXNode, XNodeConstructor, utils} from '@exility/parser';

import {
	core as stdlib,
	dom as stddom,
} from '@exility/stdlib';

type COMPILED_ATTR = [string, string, boolean];

const R_IS_EVENT_ATTR = /^(on-|@)/;
const {ATTR_TO_PROPS, BOOL_ATTRS} = stddom;
const {
	ROOT_TYPE,
	TEXT_TYPE,
	KEYWORD_TYPE,
	TAG_TYPE,
	HIDDEN_CLASS_TYPE,
	EXPRESSION_TYPE,
	DEFINE_TYPE,
	CALL_TYPE,
	PSEUDO_ELEMENT_TYPE,
} = utils;

interface Node {
	type: string;

	name: string;
	compiledName: string;

	attrs: any;
	compiledAttrs: Array<COMPILED_ATTR>;

	value: string;
	compiledValue: string;

	children: Node[];
	hasKeywords: boolean;
	computed: boolean;

	hasComputedName: boolean;
	hasComputedAttrs: boolean;
	hasComputedValue: boolean;
	hasComputedChildren: boolean;

	slots: Node[];
	calls: string[];
	isSlot: boolean;
	alternate: Node[];

	wsBefore: boolean
	wsAfter: boolean;
}

export interface IDOMCompilerOptions extends ICompilerOptions {
}

const compiler = createCompiler<IDOMCompilerOptions>((options: IDOMCompilerOptions) => (bone: XNode, {scope: scopeVars, cssModule}) => {
	const TO_STR = '__STDLIB_TO_STRING';
	const constPrefix = '_$';
	const constObjects = [];

	const customElems = [];
	const isCustomElems = {};
	const fragments = [];
	const superSlots = [];
	const hasScopeSlots = scopeVars.includes('__slots__');
	const useCSSModule = cssModule && scopeVars.includes('__classNames__');

	let gid = 0;
	let varMax = 0;
	let hasBlocks = false;

	if (options.blocks) {
		options.blocks.forEach(name => {
			hasBlocks = true;
			isCustomElems[name] = {
				name: name,
				type: 'inline',
				external: true,
			};
		});
	}

	function compileEvent(node, attr, name: string, value: string) {
		let parsedName: string[];
		let isRemit = name.charAt(0) === '@';
		let isExpr = true;

		parsedName = name.replace(R_IS_EVENT_ATTR, '').split('.');
		name = parsedName.shift();

		if (isRemit) {
			let remitArgs = node.attrs[attr[0]][0];

			value = `{
				ctx: __this__,
				fn: ${JSON.stringify(remitArgs[0] === true ? name : remitArgs[0].trim())},
				detail: `;

			if (remitArgs.length > 1) {
				remitArgs = remitArgs.slice(1).filter(item => !!item.type);

				if (remitArgs.length) {
					value += `{${remitArgs.map(prop => {
						const compiledProp = stringifyParsedValue(prop);
						return `${prop.raw.split('.').pop()}: ${compiledProp.value}`;
					}).join(', ')}}`;
				} else {
					value += 'null';
				}
			} else {
				isExpr = false;
				value += 'null';
			}

			value += '}';
		}

		return {
			name,
			value,
			isExpr,
			mods: parsedName.length ? `eventsMods[${JSON.stringify(name)}] = ${JSON.stringify(parsedName)};` : ''
		};
	}

	function preprocessing(bone: IXNode, slots?: Node[], usedSlots?: any): Node {
		const raw: any = bone.raw || {};
		const type = bone.type;

		let name = raw.name;
		let compiledName = stringifyParsedValue(name, TO_STR);
		let attrs = raw.attrs || {};
		let hasComputedAttrs = false;
		let isCustomElem = isCustomElems[name];

		// if (/^[A-Z]/.test(name)) {
		// 	hasBlocks = true;
		// 	isCustomElem = true;
		// 	isCustomElems[name] = {
		// 		name: name,
		// 		type: 'inline',
		// 		external: true,
		// 	};
		// }

		let compiledAttrs: Array<COMPILED_ATTR> = Object.keys(attrs).map((name: string): COMPILED_ATTR => {
			const useCLN = name === 'class' && useCSSModule;
			const encode = (useCLN || BOOL_ATTRS[name] || isCustomElem || R_IS_EVENT_ATTR.test(name) || !/^class/.test(name))
				? null
				: TO_STR;
			const attr = stringifyAttributeValue(
				name,
				attrs[name],
				encode,
				(bone as XNode)
			);

			if (useCLN) {
				attr.value = `__CLN(${attr.value})`;
				attr.computed = true; // todo: только если это не продакшен!
			}

			hasComputedAttrs = hasComputedAttrs || attr.computed || R_IS_EVENT_ATTR.test(name);

			return [name, attr.value, attr.computed];
		});

		let value = raw.value;
		let compiledValue = TEXT_TYPE === type ? stringifyParsedValue(value, TO_STR) : {value: '', computed: false};
		let hasKeywords = false;
		let hasComputedChildren = false;

		const children = [];
		const overridenSlots = isCustomElem ? [] : null;
		const defaultSlot = isCustomElem ? [] : null;

		if (CALL_TYPE === type) {
			attrs = raw.args;
			usedSlots && (usedSlots[name] = true);
		}

		if (KEYWORD_TYPE === type && name === 'import') {
			isCustomElems[attrs.name] = {
				type: 'import',
				name: attrs.name,
				external: true,
			};
		}

		bone.nodes.forEach((childBone: IXNode) => {
			const type = childBone.type;

			if (DEFINE_TYPE === type) {
				if (childBone.raw.type === 'parenthesis') {
					// Определение слота
					const node = preprocessing(childBone);

					node.isSlot = true;
					(isCustomElem ? overridenSlots : slots).push(node);
					usedSlots && (usedSlots[node.name] = true);

					hasComputedChildren = hasComputedChildren || node.computed;
				} else {
					// Создание custom-элемента
					usedSlots = {};

					const slots = [];
					const node = preprocessing(childBone, slots, usedSlots);

					node.slots = slots;
					node.calls = Object.keys(usedSlots);

					customElems.push(node);
					isCustomElems[node.name] = node;
				}
			} else {
				const node = preprocessing(childBone, null, usedSlots);

				hasKeywords = hasKeywords || KEYWORD_TYPE === type || node.hasKeywords;
				hasComputedChildren = hasComputedChildren || node.computed;

				if (isCustomElem) {
					if (node.type === PSEUDO_ELEMENT_TYPE) {
						overridenSlots.push(node);
					} else {
						defaultSlot.push(node);
					}
				} else if (HIDDEN_CLASS_TYPE === type) {
					children.push.apply(children, node.children);
				} else if (KEYWORD_TYPE === type && childBone.raw.name === 'else') {
					children[children.length - 1].alternate.push(node);
				} else {
					children.push(node);
				}
			}
		});

		if (isCustomElem && defaultSlot.length) {
			const __default = preprocessing(new XNode(PSEUDO_ELEMENT_TYPE, {
				name: 'children'
			}), null, usedSlots);
			__default.children = defaultSlot;
			overridenSlots.push(__default);
		}

		return {
			type,
			computed: (
				KEYWORD_TYPE === type ||
				compiledName.computed ||
				compiledValue.computed ||
				hasComputedAttrs ||
				hasComputedChildren
			),

			name,
			compiledName: compiledName.value,

			attrs,
			compiledAttrs,
			value,
			compiledValue: compiledValue.value,
			children,

			hasComputedName: compiledName.computed,
			hasComputedValue: compiledValue.computed,
			hasComputedAttrs,
			hasComputedChildren,

			hasKeywords,
			calls: null,
			slots: overridenSlots,
			isSlot: false,
			alternate: [],
			wsBefore: raw.wsBefore,
			wsAfter: raw.wsAfter,
		};
	}

	function compileUpdaters(updaters) {
		return updaters.map(upd => {
			if (upd.test) {
				return upd.entries.length ? `
					if (${upd.test}) {
						${compileUpdaters(upd.entries)}
					}
				` : '';
			} else {
				return upd;
			}
		}).join('\n');
	}

	// Выделение статического объекта (todo: одинаковые блоки)
	function allocateConstObject(code) {
		return `${constPrefix + constObjects.push(code)}.cloneNode(true)`;
	}

	function compileSlots(parentName: string, slots: Node[], updaters, fragments) {
		if (slots && slots.length) {
			return `{
				${slots.map(node => `
					${node.compiledName}: function (${parentName}, __super__) {
						${compileChildren(parentName, node.children, updaters, fragments)}
					}
				`).join(',\n')}
			}`;
		} else {
			return 'null';
		}
	}

	// Компиляция подготовленной ноды
	function compileNode(parentName: string, node: Node, updaters, fragments) {
		const type = node.type;
		const name = node.name;
		const compiledName = node.compiledName;
		const attrs = node.attrs;
		const slots = node.slots;
		const children = node.children;

		if (KEYWORD_TYPE === type) {
			if ('fx' === name) {
				// Эффекты
				return `
					__STDDOM_FX(${node.attrs.name}, ${parentName}, function () {
						${compileChildren(parentName, children, updaters, fragments)}
					});
				`;
			} else if ('import' === name) {
				// Импорт блоков
				return `__STDDOM_CMP_IMPORT("${node.attrs.name}", ${node.attrs.from.replace(/;+$/, '')});`;
			} else if ('if' === name || 'else' === name) {
				// Условные операторы
				const condBaseId = ++gid;
				const condNames = [node].concat(node.alternate).map((node) => {
					const condUpd = [];
					const condName = `__IF_${++gid}`;
					const children = node.children;

					fragments.push(`
						function ${condName}(frag) {
							return ${node.attrs.test || 'true'} ? frag || ${condName}_exec(__ctx) : null;
						}
						
						function ${condName}_exec(__parent) {
							var __ctx = __STDDOM_CONTEXT(__parent);
							var __fragIf = __STDDOM_FRAGMENT();
							${compileChildren('__fragIf', children, condUpd, fragments)}
							return {
								ctx: __ctx,
								frag: __fragIf,
								update: function () {
									${condUpd.join('\n')}
								}
							};
						}
					`);

					return condName;
				});

				updaters.push(`__STDDOM_UPD_IF(__ctx, ${condBaseId});`);

				return `__STDDOM_IF(${parentName}, __ctx, ${condBaseId}, [${condNames.join(', ')}]);`;
			} else if ('for' === name) {
				// Цыклы
				const forName = `__FOR_ITERATOR_${++gid}`;
				const forKey = attrs.key || '$index';
				const forUpd = [];
				const forId = ++gid;
				const forBaseArgs = `${attrs.data}, ${JSON.stringify(attrs.id)}, ${forName}`;
				const forFrags = [];

				fragments.push(`
					function ${forName}(__parent, ${attrs.as}, ${forKey}) {
						var __ctx = __STDDOM_CONTEXT(__parent);
						var __fragFor = __STDDOM_FRAGMENT();
						${compileChildren('__fragFor', children, forUpd, forFrags)}
						${forFrags.join('\n')}
						return {
							ctx: __ctx,
							frag: __fragFor,
							data: ${attrs.as},
							index: ${forKey},
							update: function (__${attrs.as}, __${forKey}) {
								${attrs.as} = __${attrs.as}
								${forKey} = __${forKey}
								${forUpd.join('\n')}
							}
						};
					}
				`);

				updaters.push(`__STDDOM_UPD_FOR(__ctx, ${forId}, ${forBaseArgs});`);

				return `__STDDOM_FOR(${parentName}, __ctx, ${forId}, ${forBaseArgs});`;
			} else {
				throw 'todo kw';
			}
		} else if (TEXT_TYPE === type) {
			// Просто текст
			return compileTextNode(parentName, node, updaters, fragments);
		} else if (PSEUDO_ELEMENT_TYPE === type) {
			if (/^super\./.test(name)) {
				return `__super__[${compiledName.replace(/^"super\./, '"')}]();`;
			} else {
				const slotName = `__SLOT_${name.replace(/[^0-9a-z]/ig, '_')}`;
				const slotNameUsed = `${slotName}_used`;
				const slotUpdaters = [];

				superSlots.push([compiledName, slotName]);

				const slotCode = `
					var ${slotNameUsed} = false;
					function ${slotName}() {
						${slotNameUsed} = true;
						${compileChildren(parentName, node.children, slotUpdaters, fragments)}
					}
					${hasScopeSlots
						? `__STDLIB_SLOT(${parentName}, __slots__, __super__, ${compiledName}, ${slotName});`
						: `${slotName}();`
					}
				`;

				updaters.push({
					test: `${slotName}_used`,
					entries: slotUpdaters,
				});

				return slotCode;
			}
		} else if (TAG_TYPE === type) {
			const tagId = ++gid;
			const varName = `__x` + tagId;

			let code = [];

			if (isCustomElems[name]) {
				// Хмммм
				const isExternal = isCustomElems[name].external;
				let cmpAttrs = '';
				let cmpAttrsExp = [];
				let cmpEvents = [];

				node.compiledAttrs.forEach((attr: COMPILED_ATTR) => {
					let [name, value, isExpr] = attr;

					if (R_IS_EVENT_ATTR.test(name)) {
						cmpEvents.push(compileEvent(node, attr, name, value));
					} else if (name === '__attrs__') {
						cmpAttrs = `var __CMP_ATTRS = __STDLIB_CLONE_OBJECT(${value});\n${cmpAttrs}`;
						cmpAttrsExp.unshift(`var __CMP_ATTRS = __STDLIB_CLONE_OBJECT(${value});`);
					} else {
						let expr = `__CMP_ATTRS[${JSON.stringify(name == 'class' ? 'className' : name)}] = ${value};`;

						cmpAttrs += expr;
						isExpr && cmpAttrsExp.push(expr);
					}
				});

				const cmdEventsStr = [];

				cmpEvents.forEach(({name, value, isExpr}) => {
					const eventName = JSON.stringify(name);

					cmdEventsStr.push(`${eventName}: ${value}`);
					isExpr && updaters.push(`${varName}.events[${eventName}] = ${value};`);
				});

				if (!/^var\s/.test(cmpAttrs)) {
					cmpAttrs = `var __CMP_ATTRS = {};\n${cmpAttrs}`;
					cmpAttrsExp.unshift('var __CMP_ATTRS = {};');
				}

				code.push(cmpAttrs);

				if (isExternal) {
					code.push(`var ${varName} = __STDDOM_CMP_CREATE(__ctx, __blocks__,`);
				} else {
					code.push(`var ${varName} = __STDDOM_CMP_CREATE_INLINE(__CMP_INLINE_STORE,`);
				}

				code.push(`
					${parentName},
					__this__,
					${compiledName},
					__CMP_ATTRS,
					${cmpEvents.length ? `{${cmdEventsStr.join(', ')}}` : 'null'},
					${compileSlots(parentName, node.slots, updaters, fragments)}
				);`);

				(cmpAttrsExp.length > 0) && updaters.push(`${cmpAttrsExp.join('\n')}\n${varName}.update(__CMP_ATTRS);`);
			} else {
				if (node.hasComputedName || node.hasComputedAttrs) {
					code.push(`var ${varName} = __STDDOM_LIVE_NODE(${parentName}, __ctx, ${tagId}, ${node.compiledName});`);
					node.hasComputedName && updaters.push(`__STDDOM_UPD_LIVE_NODE(__ctx[${tagId}], ${node.compiledName});`);
				} else {
					code.push(`var ${varName} = __STDDOM_NODE(${parentName}, ${compiledName});`);
				}

				code = code.concat(
					node.compiledAttrs.map((attr: COMPILED_ATTR): string => {
						let fn;
						let expr = varName;
						let [name, value, isExpr] = attr;
						let extraStaticExpr = '';

						if (R_IS_EVENT_ATTR.test(name)) {
							const compiledEvent = compileEvent(node, attr, name, value);

							fn = '__STDDOM_ON';
							expr = `__ctx[${tagId}]`;

							name = compiledEvent.name;
							value = compiledEvent.value;
							isExpr = compiledEvent.isExpr;

							if (compiledEvent.mods) {
								extraStaticExpr += `\n${expr}.${compiledEvent.mods}`;
							}
						} else if (isExpr || node.hasComputedName) {
							fn = ATTR_TO_PROPS.hasOwnProperty(name) ? '__STDDOM_D_PROP' : '__STDDOM_D_ATTR';
							expr = `__ctx[${tagId}]`;
						} else {
							fn = ATTR_TO_PROPS.hasOwnProperty(name) ? '__STDDOM_PROP' : '__STDDOM_ATTR';
						}

						expr = `${fn}(${expr}, ${JSON.stringify(ATTR_TO_PROPS[name] || name)}, ${value})`;
						isExpr && updaters.push(expr);

						return expr + (extraStaticExpr ? `\n${extraStaticExpr}` : '');
					}),

					compileChildren(varName, children, updaters, fragments)
				);
			}

			node.wsBefore && code.unshift(`__STDDOM_TEXT(${parentName}, ' ');`);
			node.wsAfter && code.push(`__STDDOM_TEXT(${parentName}, ' ');`);

			return code.join('\n');
		}
	}

	function compileTextNode(parentName: string, {hasComputedValue, value, compiledValue}:Node, updaters, fragments) {
		if (hasComputedValue) {
			return (value as any).map((item: any) => {
				if (EXPRESSION_TYPE === item.type) {
					const id = ++gid;
					updaters.push(`__STDDOM_UPD_VALUE(__ctx[${id}], ${item.raw});`);
					return `__STDDOM_VALUE(${parentName}, __ctx, ${id}, ${item.raw});`;
				} else {
					return `__STDDOM_TEXT(${parentName}, ${stringifyObjectKey(item)});`;
				}
			}).join('\n');
		} else {
			return `__STDDOM_TEXT(${parentName}, ${compiledValue});`;
		}
	}

	function compileChildren(parentName: string, children: Node[], updaters: string[], fragments) {
		return children.map(child => compileNode(parentName, child, updaters, fragments)).join('\n');
	}

	function compileFragment(node: Node) {
		const updaters = [];
		const children = rootNode.children;
		const length = children.length;
		const first = children[0];
		let res = `var __frag = __STDDOM_FRAGMENT();\n`;

		if (ROOT_TYPE === node.type) {
			if (length === 0) {
				// ...
			} else if (length === 1 && (first.type === TEXT_TYPE && first.hasComputedValue && first.value.length > 1)) {
				res += compileNode('__frag', first, updaters, fragments);
			} else if (length > 1) {
				// throw 'todo';
				res += compileChildren('__frag', node.children, updaters, fragments);
			} else {
				res += compileNode('__frag', first, updaters, fragments);
			}
		} else if (DEFINE_TYPE === node.type) {
			// Компонент
			res += compileChildren('__frag', node.children, updaters, fragments);

			return `
				function (attrs) {
					${node.attrs.map(name => `var ${name} = attrs.${name};`).join('\n')}
					var __ctx = __STDDOM_CONTEXT();
					${res}
					${fragments.join('\n')}
					return {
						ctx: __ctx,
						frag: __frag,
						update: function (__NATTRS__) {
							attrs = __NATTRS__;
							${node.attrs.map(name => `${name} = __NATTRS__.${name};`).join('\n')}
							${compileUpdaters(updaters)}
						}
					};
				}
			`;
		} else {
			throw 'todo';
		}

		const computed = scopeVars && scopeVars.length || updaters.length > 0;

		if (useCSSModule) {
			updaters.unshift('__CLN.upd(__classNames__);');
		}

		return `
			${computed ? `var __ctx = __STDDOM_CONTEXT();` : ''}
			${superSlots.length ? `var __super__ = {
				${superSlots.map(([slot, fn]) => `${slot}: ${fn}`).join(',\n')}
			};` : ''}
			${res}
			${fragments.join('\n')}
			return {
				ctx: ${computed ? '__ctx' : 'null'},
				frag: __frag,
				container: null,
				mountTo: function (container) {
					this.container = container;
					__frag.mountTo(container);
					${computed ? `__STDDOM_LIFECYCLE(__ctx, 'connectedCallback');` : ''}
					return this;
				},
				update: ${computed ? `function (__NEWSCOPE__) {
					__SCOPE__ = __NEWSCOPE__;
					${scopeVars ? scopeVars
						.filter(name => /^[_a-z]([0-9a-z_]*)$/i.test(name))
						.map(name => `${name} = __NEWSCOPE__.${name};`)
						.join('\n') : ''
					}
					${compileUpdaters(updaters)}
				}` : '__STDLIB_NOOP'}
			}
		`;
	}

	const rootNode = preprocessing(bone);
	let results = compileFragment(rootNode);

	const globals = [];
	const globalVars: string[] = [];

	while (varMax--) {
		globalVars.push(`_$$${varMax + 1}`);
	}

	if (hasBlocks) {
		globals.push('__STDDOM_CMP_SET_COMPILER(__COMPILER__);');
		results = `
			__STDDOM_CMP_INIT(__blocks__, ${JSON.stringify(options.blocks)});
			${results}
		`;
	}

	if (useCSSModule) {
		results = `
			var __CLN = __STDLIB_CSS_MODULE(__classNames__);
			${results}
		`;
	}

	if (customElems.length) {
		globalVars.push('__CMP_INLINE_STORE = {}');

		customElems.forEach(node => {
			globals.push(`__STDDOM_CMP_INLINE(__CMP_INLINE_STORE, ${node.compiledName}, ${compileFragment(node).trim()});`);
		});
	}

	constObjects.forEach((code, idx) => {
		globalVars.push(`${constPrefix + (idx + 1)} = ${code}`);
	});

	return {
		deps: {
			stdlib: ['__STDLIB', stdlib],
			stddom: ['__STDDOM', stddom],
		},
		before: [].concat(
			globalVars.length ? `var ${globalVars.join(',\n')};` : [],
			globals.length ? globals : [],
		).join('\n'),
		code: results
	};
});


export default compiler;
