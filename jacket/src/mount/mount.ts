import Block, {BlockClass} from '@exility/block';
import {mountTo, runtimeBlockActivate} from '@exility/dom';

export class DOMWrapper {
	isDOMWrapper: boolean = true;

	constructor(public target: Block<any, any>, private el: Element) {
	}

	get classList() {
		const className = this.el.className.trim();
		return className === '' ? [] : className.split(/\s+/);
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

	val(): string;
	val(value: string): this;
	val() {
		if (arguments.length) {
			return this.attr('value', arguments[0]);
		} else {
			return this.attr('value');
		}
	}

	attr(name: string): any;
	attr(name: string, value: boolean): this;
	attr(name: string, value: number): this;
	attr(name: string, value: string): this;
	attr() {
		const name = arguments[0];
		const {el} = this;

		if (arguments.length == 2) {
			const value = arguments[1];

			if (name in el) {
				el[name] = value;
			} else {
				el.setAttribute(name, value);
			}

			return this;
		} else {
			return (name in el) ? el[name] : el.getAttribute(name);
		}
	}

	attrs() {
		return [].reduce.call(this.el.attributes, (attrs, {name, value}) => {
			attrs[name] = value;
			return attrs
		}, {});
	}

	simulate(eventName: string, detail?: object) {
		const event = new CustomEvent(eventName, {
			bubbles: true,
			cancelable: true,
			detail,
		});

		!this.el['disabled'] && this.el.dispatchEvent(event);
		return this;
	}

	find(selector: string): DOMWrapper {
		return new DOMWrapper(this.target, this.el.querySelector(selector));
	}

	update(attrs) {
		this.target.update(attrs);
	}
}

export function create<A, C extends object>(UI: BlockClass<A, C>, attrs: A, context: C, events?) {
	runtimeBlockActivate(UI);

	return mount(new UI(attrs, {context}), events);
}

export default function mount(block: Block<any, any>, events: object = {}): DOMWrapper {
	const container = document.createElement('div');

	block['__events__'] = Object.keys(events).reduce((obj, name) => {
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
