export default function mountTo(target: Element, block) {
	block['__view__'].mountTo(target);
}
