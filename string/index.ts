import {requiredScopeKeys} from '@exility/block';
import {core as stdlib} from '@exility/stdlib';
import createCompiler, {StringModeOptions} from './src/compiler/compiler';

function runtimeBlockActivate(Block, options: Partial<StringModeOptions>) {
	if (!Block.prototype['__template__']) {
		const compile = createCompiler({
			...options,
			blocks: Object.keys(Block.blocks),
			scope: requiredScopeKeys,
			cssModule: !!Block.classNames,
		});
		const templateFactory = compile(Block.template);

		Block.prototype['name'] = Block.prototype['name'] || Block.name;
		Block.prototype['__template__'] = templateFactory({stdlib});

		return compile;
	}
}

export {
	createCompiler,
	runtimeBlockActivate,
};
