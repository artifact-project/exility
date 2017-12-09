import {
	SELF_CLOSED_TAGS,

	ICompilerOptions,
	createCompiler,

	stringifyObjectKey,
	stringifyParsedValue,
	stringifyAttributeValue,
} from '@exility/compile';
import {core as stdlib, dom as stddom} from '@exility/stdlib';
import {XNode, IXNode, XNodeConstructor, utils} from '@exility/parser';


const R_IS_EVENT = /^(on-|@)/;

const {
	ROOT_TYPE,
	DTD_TYPE,
	TAG_TYPE,
	COMMENT_TYPE,
	TEXT_TYPE,
	KEYWORD_TYPE,
	HIDDEN_CLASS_TYPE,
	DEFINE_TYPE,
	PSEUDO_ELEMENT_TYPE,
	CALL_TYPE,
	QUOTE_CODE,
	EXPRESSION_TYPE,
} = utils;

let mcid = 0;
const KEYWORDS = {
	'const': ({name, expr}) => [`var ${name} = ${expr};\n`, ''],

	'if': ({test}) => [
		`if (${test}) {`,
		'}',
	],

	'else': ({test}) => [
		(test ? `else if (${test}) {` : 'else {'),
		'}',
	],

	'for': ({data, as, key}) => [
		`__STDLIB_EACH(${data}, function EACH_ITERATOR(${as}, ${key || '$index'}) {`,
		'});',
	],
};


export interface StringModeOptions extends ICompilerOptions {
	prettify?: boolean;
	comment?: boolean;
	metaComments?: boolean;
	blocks?: string[];
}

function clean(content): string {
	let prev;

	do {
		prev = content;
		content = content
			.replace(/(__ROOT \+= .*?)";\n*__ROOT \+= "/g, '$1')
			.replace(/(__ROOT \+= .*?\));\n?__ROOT \+= /g, '$1 + ')
			.replace(/(__ROOT \+= ".*?");\n*__ROOT \+= \(/g, '$1 + (')
		;
	} while (prev !== content);

	content = content
		.replace(/ \+ ""/g, '')
		.replace(/(var __ROOT )\+=/g, '$1=')
		.replace(/ = "\\n/, ' = "')
		.replace(/\\n";\n$/, '";')
		.replace(/__ROOT \+= "";/g, '')
		.trim()
		.replace(/(var __ROOT = )"";[\n\s]*__ROOT \+?= /g, '$1')
		.replace(/";\n__ROOT \+= ([_a-zA-Z])/g, '" + $1')
	;

	return content.replace(/var __ROOT = ([^\n]+)[\n\t]+return __ROOT;?/g, 'return $1');
}

const compiler = createCompiler<StringModeOptions>((options) => (node: XNode) => {
	const {prettify, metaComments, blocks, cssModule, scope:scopeVars} = options;
	const hasBlocks = !!(blocks && blocks.length);
	const NL = prettify ? '\n' : '';
	const CUSTOM_ELEMENTS = {};
	const globalFragments = [];
	const NodeClass = <XNodeConstructor>node.constructor;
	const TO_STR = '__STDLIB_TO_STRING';
	const HTML_ENCODE = '__STDLIB_HTML_ENCODE';
	const HTML_TEXT_ENCODE = metaComments ? `${HTML_ENCODE}_MC` : HTML_ENCODE;
	const slotsCode = [];
	const useCSSModule = cssModule && scopeVars.includes('__classNames__');
	let domDepth = 0;

	mcid = 0;

	if (hasBlocks) {
		blocks.forEach(name => {
			CUSTOM_ELEMENTS[name] = {
				name: name,
				external: true,
			};
		});
	}

	function push(value: string, raw?: boolean): string {
		return `__ROOT += ${raw ? value : stringifyParsedValue(value, HTML_ENCODE).value};\n`;
	}

	function pushText(value: string): string {
		return `__ROOT += ${stringifyParsedValue(value, HTML_TEXT_ENCODE).value};\n`;
	}

	function pushAttr(name, values, bone): string {
		const useCLN = name === 'class' && useCSSModule;
		let {value} = stringifyAttributeValue(name, values, HTML_ENCODE, bone);

		if (useCLN) {
			value = `__CLN(${value})`;
		}

		value = (value.charCodeAt(0) === QUOTE_CODE) ? `"\\${value}` : `"\\"" + ${value}`;
		value = (value.charCodeAt(value.length - 1) === QUOTE_CODE) ? `${value.slice(0, -1)}\\""` : `${value} + "\\""`;

		return push(value, true);
	}

	function getSlots(nodes: IXNode[], type: string) {
		const defines = [];
		const defaultSlot = new NodeClass(type, {
			name: 'children',
			type: 'parenthesis',
			attrs: [],
		});

		nodes.forEach(node => {
			if (node.type === type) {
				defines.push(node);
			} else {
				defaultSlot.nodes.push(node);
			}
		});

		if (defines.length && defaultSlot.nodes.length) {
			throw new Error('Mixed content');
		}

		return {
			defines,
			defaultSlot,
		};
	}

	function compileSlots(nodes: IXNode[], type: string = DEFINE_TYPE): string {
		const {defaultSlot, defines} = getSlots(nodes, type);

		if (defines.length) {
			return `{${defines.map(define => `${define.raw.name}: ${clean(compile(define, ''))}`).join(', ')}}`;
		} else {
			return `{children: ${clean(compile(defaultSlot, ''))}}`;
		}
	}

	function compile(node, pad: string, callList?: string[], defaultSlots?: any) {
		const raw = node.raw || {};
		const type = node.type;
		let name = raw.name;
		let code = '';
		let innerCallList = DEFINE_TYPE === type ? [] : callList;
		let innerDefaultSlotsList = (DEFINE_TYPE === type && raw.type === 'bracket') ? {} : defaultSlots;

		if (!prettify) {
			pad = '';
		}

		if (CUSTOM_ELEMENTS[name] && CUSTOM_ELEMENTS[name].external) {
			CUSTOM_ELEMENTS[name].slots = node.nodes.length ? compileSlots(node.nodes, PSEUDO_ELEMENT_TYPE) : 'null';
			node.nodes = [];
		}

		if (DTD_TYPE === type) {
			code = push(`<!DOCTYPE ${raw.value == 5 ? 'html' : raw.value}>${NL}`);
		} else {
			if (type === TAG_TYPE) {
				domDepth++;
			}

			let hasText = false;
			let content = node.nodes.map((child) => {
				hasText = child.type === 'text' || hasText;
				return compile(child, type == '#root' ? '' : pad + '  ', innerCallList, innerDefaultSlotsList);
			}).join('');

			if (type === TAG_TYPE) {
				domDepth--;
			}

			if (hasText) {
				content = content.trim();
			} else {
				content = push(NL) + content + push(pad);
			}

			if (ROOT_TYPE === type) {
				code = content;
			} else if (KEYWORD_TYPE === type) {
				const pair = KEYWORDS[name](raw.attrs);

				code = `${pair[0]}\n${content}\n${pair[1]}`;

				if (metaComments) {
					if (name === 'if' || name === 'for') {
						const cid = ++mcid;

						raw.cid = cid;
						code = `\n__ROOT += "<!--${name}${cid}-->";\n${code}`;
						(name !== 'if')  && (code += `\n__ROOT += "<!--/${name}${cid}-->";`);
					}

					if (name === 'if' || name === 'else') {
						if (!node.next || node.next.raw.name !== 'else') {
							code += `\n__ROOT += "<!--/if${node.raw.cid}-->";`;
						} else {
							node.next.raw.cid = raw.cid;
						}
					}
				}
			} else if (CALL_TYPE === type) {
				callList.push(name);

				if (/^super\./.test(name)) {
					name = `this.${name.substr(6)}`;
				}

				code = `if (${name}) {\n__ROOT += ${name}`;
				code += defaultSlots
					? `.call(${['__super'].concat(raw.args).join(',')});\n}\n`
					: `(${raw.args.join(',')});\n}\n`;
			} else if (DEFINE_TYPE === type) {
				if (raw.type === 'parenthesis') {
					code = `function ${name}(${raw.attrs.join ? raw.attrs.join(', ') : ''}) {\n`
						+ `var __ROOT = "";\n`
						+ `${content}\n`
						+ `return __ROOT\n}\n`
					;

					if (defaultSlots) {
						defaultSlots[name] = code;
						code = '';
					}
				} else {
					// todo: Пересечение attrs и innerCallList
					const vars = [].concat(
						raw.attrs.map(name => `${name} = attrs.${name}`),
						innerCallList.map(name => `${name} = __slots && __slots.${name} || __super.${name}`)
					);

					vars.unshift(
						'__super = {attrs: attrs' +
						Object.keys(innerDefaultSlotsList).map((name) => {
							return `,\n  ${name}: ${innerDefaultSlotsList[name]}`;
						}).join('') +
						'}'
					);

					CUSTOM_ELEMENTS[name] = {
						name,
						external: false,
					};

					globalFragments.push(
						`function ${name}(attrs, __slots) {\n`,
						(vars.length ? `var ${vars.join(',\n      ')}\n` : ''),
						`var __ROOT = "";\n${content}return __ROOT\n}\n`
					);
				}
			} else if (TEXT_TYPE === type) {
				code = (metaComments ? pushText : push)(raw.value);
			} else if (COMMENT_TYPE === type) {
				code = options.comment ? push(`${pad}<!--${raw.value}-->${NL}`) : NL;
			} else if (HIDDEN_CLASS_TYPE === type) {
				code = content + NL;
			} else if (CUSTOM_ELEMENTS[name]) {
				const elem = CUSTOM_ELEMENTS[name];
				const attrsStr = raw.attrs.__attrs__
					? stringifyParsedValue(raw.attrs.__attrs__).value
					: `{${Object
						.keys(raw.attrs || {})
						.map(name => `${stringifyObjectKey(name)}: ${stringifyParsedValue(raw.attrs[name]).value}`)
						.join(', ')}}`;

				if (elem.external) {
					code = `${pad}__ROOT += __BLOCK_RENDER(__blocks__, __nctx__, "${name}", ${attrsStr}, ${elem.slots});\n`;
				} else {
					code = `${pad}__ROOT += ${name}(${attrsStr}`;
					code += node.nodes.length ? `, ${compileSlots(node.nodes)});\n` : `);\n`;
				}
			} else if (PSEUDO_ELEMENT_TYPE === type) {
				const slotName = `__SLOT_${name.replace(/[^0-9a-z]/ig, '_')}`;
				const slotCode = `function ${slotName}(__this__, __super__) {
					var __ROOT = "";
					${content}
					return __ROOT;
				}`;

				if (!node.parent || CUSTOM_ELEMENTS[node.parent.raw.name]) {
					code = slotCode;
				} else if (/^super\./.test(name)) {
					code = `__ROOT += __super__["${name.replace(/^super\./, '')}"]();`;
				} else {
					slotsCode.push(`
						${slotCode}
						__super__["${raw.name}"] = ${slotName};
					`);

					code = `__ROOT += __STDLIB_SLOT(__this__, __slots__, __super__, "${raw.name}", ${slotName});`;
				}
			} else {
				const attrsList = [];

				if (domDepth === 0 && useCSSModule) {
					raw.attrs.class = raw.attrs.class || [];
					raw.attrs.class.push([{
						type: EXPRESSION_TYPE,
						raw: '__classNames__.hasOwnProperty(":host") ? ":host" : ""',
					}]);
				}

				Object.keys(raw.attrs || {}).forEach(name => {
					const value = raw.attrs[name];

					if (name === 'ref') {
						// todo: test-case
						return;
					} else if (name === 'innerHTML') {
						content = push(stringifyAttributeValue(name, value, TO_STR).value, true);
					} else if (!R_IS_EVENT.test(name)) {
						if (name !== 'class') {
							const encode = (stddom.BOOL_ATTRS[name] ? null : TO_STR);
							const computed = stringifyAttributeValue(name, value, encode);

							if (computed.computed) {
								if (!globalFragments['__xav']) {
									globalFragments['__xav'] = true;
									globalFragments.push('var __xav;');
								}

								attrsList.push(`
									if (__xav = ${computed.value}) {
										${push(`" ${name}${stddom.BOOL_ATTRS[name] ? '"' : '=\\"" + __xav + "\\""'}`, true)}
									}
								`);
							} else {
								attrsList.push(push(` ${name}=`) + pushAttr(name, value, node));
							}
						} else {
							attrsList.push(push(` ${name}=`) + pushAttr(name, value, node));
						}
					}
				});

				code = push(`${pad}<`) + push(name) + attrsList.join('');

				if (SELF_CLOSED_TAGS[name]) {
					code += push(`/>${NL}`);
				} else {
					code += push('>') + content + push('</') + push(name) + push(`>${NL}`);
				}
			}
		}

		return code;
	}

	let code = `${compile(node, '')}\nreturn __ROOT`;

	code = `var ${(/^__ROOT/.test(code) ? '' : '__ROOT = "";\n')}${code}`;

	if (hasBlocks) {
		if (scopeVars.indexOf('__this__') !== -1) {
			code = `var __nctx__ = __STDLIB_NEXT_CONTEXT(__this__);\n${code}`;
		} else {
			code = `var __nctx__;\n${code}`;
		}

		globalFragments.unshift(`
			function __BLOCK_INIT(blocks, name) {
				var XBlock = blocks[name];
				
				if (XBlock.template) {
					blocks[name] = __COMPILER__.compileBlock(blocks[name]);
				}
			}
		
			function __BLOCK_RENDER(blocks, nctx, name, attrs, slots) {
				var XBlock = blocks[name];
				
				if (XBlock && XBlock.prototype && XBlock.prototype.isBlock) {
					var block = new XBlock(attrs, {
						slots: slots,
						context: nctx
					});
					return block.__view__;
				} else {
					return '<div data-block="' + name + '" class="block-dummy block-dummy-loading"></div>';
				}
			}
		`);

		code = `${blocks.map(name => `__BLOCK_INIT(__blocks__, "${name}");`).join('\n')}\n${code}`;
	}

	if (slotsCode.length) {
		code = `var __super__ = {};\n${slotsCode.join('')}\n${code}`;
	}

	if (useCSSModule) {
		code = `
			var __CLN = __STDLIB_CSS_MODULE(__classNames__);
			${code}
		`;
	}

	return {
		deps: {
			'stdlib': ['__STDLIB', stdlib],
		},
		before: clean(globalFragments.join('')),
		code: clean(code),
	};
});

export default compiler;
