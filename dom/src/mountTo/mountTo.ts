export default function mountTo(target: Element | Document | DocumentFragment, block) {
	if (block.__view__ === null) {
		throw new Error(`[@exility/dom] ${block.constructor.name} not compiled`);
	}

	block.__view__.mountTo(target);
}
