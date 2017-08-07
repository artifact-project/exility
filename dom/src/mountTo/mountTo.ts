export default function mountTo(target: Element | Document, block) {
	block['__view__'].mountTo(target);
}
