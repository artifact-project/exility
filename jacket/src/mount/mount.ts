import Block from '@exility/block';
import {mountTo} from '@exility/dom';

export class DOMWrapper {
	constructor(public target: Block<any>, private el: Element) {
	}

	on<E extends Event>(name: string, fn: (evt: E) => void) {
		this.target['__events__'][name] = {
			ctx: {[`@${name}`]: fn},
			fn: name,
		}
	}

	off(name: string) {
		delete this.target['__events__'][name];
	}

	html() {
		return this.el.outerHTML;
	}

	text() {
		return this.el.textContent;
	}

	attr(name: string) {
		if (name in this.el) {
			return this.el[name];
		} else {
			return this.el.getAttribute(name);
		}
	}

	attrs() {
		return [].reduce.call(this.el.attributes, (attrs, {name, value}) => {
			attrs[name] = value;
			return attrs
		}, {});
	}

	simulate(eventName: string) {
		const event = new CustomEvent(eventName);
		!this.el['disabled'] && this.el.dispatchEvent(event);
	}

	find(selector: string): DOMWrapper {
		return new DOMWrapper(this.target, this.el.querySelector(selector));
	}

	update(attrs) {
		this.target.update(attrs);
	}
}

export default function mount(block: Block<any>, events?) {
	const container = document.createElement('div');

	block['__events__'] = Object.keys(events || {}).reduce((obj, name) => {
		obj[name] = {
			ctx: {
				[`@${name}`]: events[name],
			},
			fn: name,
		};

		return obj;
	}, {});

	mountTo(container, block);

	return new DOMWrapper(block, <HTMLElement>container.firstChild);
}
