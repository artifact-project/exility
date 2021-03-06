const tsc = require('typescript');
const tsConfig = require('../tsconfig.json');
const {default:exilityTransformer} = require('@exility/ts-transformer');

module.exports = {
	process(src, path) {
		if (path.endsWith('.ts') || path.endsWith('.tsx')) {
			return tsc.transpileModule(src, {
				compilerOptions: tsConfig.compilerOptions,
				fileName: path,
				transformers: {
					before: [exilityTransformer()],
					after: [],
				},
			}).outputText;
		}

		return src;
	},
};
