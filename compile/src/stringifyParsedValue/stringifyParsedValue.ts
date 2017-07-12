import {IXNode, utils} from '@exility/parser';

const {stringify} = JSON;
const {EXPRESSION_TYPE, INHERIT_TYPE, GROUP_TYPE} = utils;

export const R_QUOTE_START = /^"/;
export const R_QUOTE_END = /"$/;

export type ParsedTokenValue = null | string | true | {type: string, test?: string, raw: ParsedValue};
export type ParsedValue = ParsedTokenValue | Array<ParsedTokenValue | ParsedTokenValue[]>;

export type StringValue = {value: string | null, computed: boolean};

function stringifyParsedValue(values: ParsedValue, escape?: string, node?: IXNode): StringValue;
function stringifyParsedValue(values, escape, node) {
	let value = null;
	let computed = false;

	if (node == null) {
		node = {};
	}

	if (values != null) {
		switch (values.type) {
			case GROUP_TYPE:
				value = `(${values.test} ? ${stringifyParsedValue(values.raw, escape, node).value} : "")`;
				computed = true;
				break;

			case INHERIT_TYPE:
				const selfMode = values.raw === 'self';
				let target = node;

				value = '"NULL_INHERIT_REF"';

				do {
					!selfMode && (target = target.parent);

					if (target && target.raw.attrs.class) {
						const parentValue = stringifyParsedValue(target.raw.attrs.class[0], escape, target);

						value = parentValue.value;
						computed = computed || parentValue.computed;
						break;
					}

					selfMode && (target = target.parent);
				} while (target);
				break;

			case EXPRESSION_TYPE:
				value = (escape ? escape : '') + `(${values.raw})`;
				computed = true;
				break;

			default:
				if (values === true || typeof values === 'string') {
					value = stringify(values);
				} else {
					const length = values.length;
					let next = stringifyParsedValue(values[0], escape, node);

					value = next.value;
					computed = next.computed;

					if (length > 1) {
						for (let i = 1; i < length; i++) {
							next = stringifyParsedValue(values[i], escape, node);
							computed = computed || next.computed;

							if (R_QUOTE_END.test(value) && R_QUOTE_START.test(next.value)) {
								value = value.slice(0, -1) + next.value.slice(1);
							} else {
								value += ` + ${next.value}`;
							}
						}
					}
				}
				break;
		}
	}

	return {
		value,
		computed,
	};
}


export default stringifyParsedValue;
