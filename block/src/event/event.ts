export type DOMEvent = Event;

export interface IWritable<T> {
	target: T;
	currentTarget: T;

	defaultPrevented: boolean;
	propagationStopped: boolean;
	propagationImmediateStopped: boolean;
}

export interface IEvent<T, D, E> extends Readonly<IWritable<T>> {
	readonly type: string;
	readonly detail: D;
	readonly originalEvent: E;

	readonly domType: string;
	readonly domTarget: HTMLElement;
}

function _callOriginalEventMethod(target, name) {
	const originalEvent = target.originalEvent;
	originalEvent && (typeof originalEvent[name] === 'function') && originalEvent[name]();
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

	readonly domType: string = null;
	readonly domTarget: HTMLElement = null;

	readonly defaultPrevented: boolean = false;
	readonly propagationStopped: boolean = false;
	readonly propagationImmediateStopped: boolean = false;

	constructor(type: string, detail?: D, originalEvent?: E) {
		this.type = type;
		this.detail = detail || null;
		this.originalEvent = originalEvent || null;

		if (originalEvent && originalEvent.target && (originalEvent.target as HTMLElement).nodeType) {
			// todo: Cover me!
			this.domType = originalEvent.type;
			this.domTarget = originalEvent.target as HTMLElement;
		}
	}

	preventDefault() {
		if (!this.defaultPrevented) {
			(this as IWritable<T>).defaultPrevented = true;
			_callOriginalEventMethod(this, 'preventDefault');
		}
	}

	stopPropagation() {
		if (!this.propagationStopped) {
			(this as IWritable<T>).propagationStopped = true;
			_callOriginalEventMethod(this, 'stopPropagation');
		}
	}

	stopImmediatePropagation() {
		if (!this.propagationImmediateStopped) {
			(this as IWritable<T>).propagationImmediateStopped = true;
			_callOriginalEventMethod(this, 'stopImmediatePropagation');
		}
	}

	setTarget(target: T) {
		(this as IWritable<T>).target = target;
		(this as IWritable<T>).currentTarget = target;
	}
}
