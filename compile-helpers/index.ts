import COMMON_TEST from './src/COMMON_TEST/COMMON_TEST';
import SELF_CLOSED_TAGS from './src/SELF_CLOSED_TAGS/SELF_CLOSED_TAGS';

import createCompiler, {ICompilerOptions} from './src/createCompiler/createCompiler';

import stdlib from './src/stdlib/stdlib';
import stringifyObjectKey from './src/stringifyObjectKey/stringifyObjectKey';
import stringifyParsedValue from './src/stringifyParsedValue/stringifyParsedValue';
import stringifyAttributeValue from './src/stringifyAttributeValue/stringifyAttributeValue';
import simpleJavaScriptBeautifier from './src/simpleJavaScriptBeautifier/simpleJavaScriptBeautifier';


export {
	COMMON_TEST,
	SELF_CLOSED_TAGS,

	createCompiler,
	ICompilerOptions,

	stdlib,
	stringifyObjectKey,
	stringifyParsedValue,
	stringifyAttributeValue,
	simpleJavaScriptBeautifier,
};

