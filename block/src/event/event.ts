export type DOMEvent = Event;

export interface IEvent<T, D, E> {
	readonly type: string;
	readonly detail: D;
	readonly originalEvent: E;

	readonly target: T;
	readonly currentTarget: T;

	readonly defaultPrevented: boolean;
	readonly propagationStopped: boolean;
	readonly propagationImmediateStopped: boolean;
}

interface IWritable<T> {
	target: T;
	currentTarget: T;

	defaultPrevented: boolean;
	propagationStopped: boolean;
	propagationImmediateStopped: boolean;
}

export interface IEmitter<T> {
	dispatchEvent<D extends object, E extends DOMEvent>(event: XEvent<T, D, E>);
	dispatchEvent<D extends object, E extends DOMEvent>(type: string, detail?: D, originalEvent?: E);
}

export default class XEvent<T, D extends object, E extends DOMEvent> implements IEvent<T, D, E> {
	readonly type: string = null;
	readonly detail: D = null;
	readonly originalEvent: E = null;

	readonly target: T = null;
	readonly currentTarget: T = null;

	readonly defaultPrevented: boolean = false;
	readonly propagationStopped: boolean = false;
	readonly propagationImmediateStopped: boolean = false;

	constructor(type: string, detail?: D, originalEvent?: E) {
		this.type = type;
		this.detail = detail || null;
		this.originalEvent = originalEvent || null;
	}

	preventDefault() {
		if (!this.defaultPrevented) {
			const {originalEvent} = this;

			(this as IWritable<T>).defaultPrevented = true;
			originalEvent && originalEvent.preventDefault && originalEvent.preventDefault();
		}
	}

	stopPropagation() {
		if (!this.propagationStopped) {
			const {originalEvent} = this;

			(this as IWritable<T>).propagationStopped = true;
			originalEvent && originalEvent.stopPropagation && originalEvent.stopPropagation();
		}
	}

	stopImmediatePropagation() {
		if (!this.propagationImmediateStopped) {
			const {originalEvent} = this;

			(this as IWritable<T>).propagationImmediateStopped = true;
			originalEvent && originalEvent.stopImmediatePropagation && originalEvent.stopImmediatePropagation();
		}
	}

	setTarget(target: T) {
		(this as IWritable<T>).target = target;
		(this as IWritable<T>).currentTarget = target;
	}
}
