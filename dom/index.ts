import {requiredScopeKeys} from '@exility/block';
import {
	core as stdlib,
	dom as stddom,
} from '@exility/stdlib';
import createCompiler from './src/compiler/compiler';
import mountTo from './src/mountTo/mountTo';

function runtimeBlockActivate(Block) {
	if (!Block.prototype['__template__']) {
		const compile = createCompiler({
			blocks: Block.blocks ? Object.keys(Block.blocks) : [],
			scope: requiredScopeKeys,
		});
		const templateFactory = compile(Block.template);

		Block.prototype['name'] = Block.prototype['name'] || Block.name;
		Block.prototype['__template__'] = templateFactory({
			stddom,
			stdlib,
		});
	}
}

export {
	mountTo,
	createCompiler,
	runtimeBlockActivate,
};
