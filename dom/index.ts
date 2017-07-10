import {requiredScopeKeys} from '@exility/block';
import createCompiler from './src/compiler/compiler';

import {stdlib} from '@exility/compile-helpers';
import stddom from './src/stddom/stddom';
import mountTo from './src/mountTo/mountTo';

function runtimeBlockActivate(Block) {
	const compile = createCompiler({
		blocks: Object.keys(Block.blocks),
		scope: requiredScopeKeys
	});
	const templateFactory = compile(Block.template);

	Block.prototype['name'] = Block.prototype['name'] || Block.name;
	Block.prototype['__template__'] = templateFactory({
		stddom,
		stdlib,
	});
}

export {
	stdlib,
	stddom,
	mountTo,
	createCompiler,
	runtimeBlockActivate,
};
