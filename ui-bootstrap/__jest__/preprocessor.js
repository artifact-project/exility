// todo: Удалить после публикации `ts-transformer`!
require('ts-node').register({
	ignore: /node_modules\/(?!skeletik|@exility)/,
});

const tsc = require('typescript');
const tsConfig = require('../tsconfig.json');
const {default:exilityTransformer} = require('@exility/ts-transformer');
const {default:txReflector} = require('tx-reflector/src/transformer/transformer');

module.exports = {
	process(src, path) {
		if (path.endsWith('.ts') || path.endsWith('.tsx')) {
			return tsc.transpileModule(src, {
				compilerOptions: tsConfig.compilerOptions,
				fileName: path,
				transformers: {
					before: [
						exilityTransformer,
						txReflector,
					],
					after: [],
				},
			}).outputText;
		}

		return src;
	},
};
