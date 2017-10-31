import Block, {IBlock, requiredScopeKeys} from './src/block/block';

interface BlockClass<A, C extends object> {
	new (attrs: A, options?: {context?: C}): Block<A, C>;
}

export {
	IBlock,
	requiredScopeKeys,
	BlockClass,
};

export default Block;
