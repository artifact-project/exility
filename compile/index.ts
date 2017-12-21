import COMMON_TEST from './src/COMMON_TEST/COMMON_TEST';
import SELF_CLOSED_TAGS from './src/SELF_CLOSED_TAGS/SELF_CLOSED_TAGS';

import createCompiler, {ICompilerOptions} from './src/createCompiler/createCompiler';

import stringifyObjectKey from './src/stringifyObjectKey/stringifyObjectKey';
import stringifyParsedValue from './src/stringifyParsedValue/stringifyParsedValue';
import stringifyAttributeValue from './src/stringifyAttributeValue/stringifyAttributeValue';
import simpleJavaScriptBeautifier from './src/simpleJavaScriptBeautifier/simpleJavaScriptBeautifier';


export {
	COMMON_TEST,
	SELF_CLOSED_TAGS,

	createCompiler,
	ICompilerOptions,

	stringifyObjectKey,
	stringifyParsedValue,
	stringifyAttributeValue,
	simpleJavaScriptBeautifier,
};

export function applyTraits(traits, raw) {
	raw.traits && raw.traits.forEach(({name}) => {
		if (traits.hasOwnProperty(name)) {
			const trait = traits[name];

			for (let key in trait) {
				if (trait.hasOwnProperty(key)) {
					if (raw.attrs.hasOwnProperty(key)) {
						raw.attrs[key] = trait[key].concat(raw.attrs[key]);
					} else {
						raw.attrs[key]= trait[key];
					}
				}
			}
		}
	});
}
