export default function mountTo(target: Element | Document | DocumentFragment, block) {
	block['__view__'].mountTo(target);
}
