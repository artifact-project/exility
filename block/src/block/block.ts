import XEvent, {DOMEvent, IEmitter} from '../event/event';

export type IBlock = typeof Block;

export interface IBlockIds {
	[index: string]: IBlock;
}

export interface IBlocks {
	[index: string]: Block<any>;
}

export interface IBlockRefs {
	[index: string]: HTMLElement;
}

export interface IBlockOptions {
	events?: object;
	parent?: typeof Block;
	slots?: object;
}

export interface IPlainBlock<A> {
	template: string;
	getDefaults?(): A;
	connectedCallback?();
	disconnectedCallback?();
	attributeChangedCallback?<K extends keyof A>(attrName: K, oldValue: A[K], newValue: A[K]): void;
}

export default class Block<A> implements IEmitter<IBlock> {
	static classify<X>(ClassOrLike: string | IPlainBlock<X> | IBlock): typeof Block {
		if (typeof ClassOrLike === 'string') {
			ClassOrLike = <IPlainBlock<X>>{template: ClassOrLike};
		} else if (ClassOrLike instanceof Block) {
			return <IBlock>ClassOrLike;
		}

		class NewBlock extends Block<X> {
			constructor(attrs, options) {
				super(attrs, options);
				ClassOrLike.hasOwnProperty('constructor') && ClassOrLike.constructor.call(this, attrs);
			}
		}

		Object.keys(ClassOrLike).forEach(name => {
			NewBlock.prototype[name] = ClassOrLike[name];
		});

		NewBlock.template = ClassOrLike.template;
		NewBlock.prototype.constructor = NewBlock;

		return <any>NewBlock;
	}

	ids: IBlockIds = {};
	refs: IBlockRefs = {};

	name: string;
	attrs: A;

	private __scope__ = null;
	private __view__ = null;

	// инжектиться из «вне»
	private __template__;
	private __parent__;
	private __events__;

	// Базлвый шаблон
	static template: string | ((attrs) => void) = null;
	static blocks: object;

	constructor(attrs: A, options?: IBlockOptions) {
		const defaults = this.getDefaults();

		for (const key in defaults) {
			if (defaults.hasOwnProperty(key)) {
				if (attrs[key] == null) {
					attrs[key] = defaults[key];
				}
			}
		}

		if (options == null) {
			options = {};
		}

		this.attrs = attrs;
		this.__events__ = options.events;
		this.__parent__ = options.parent;

		this.__scope__ = {
			attrs,
			__blocks__: this.constructor['blocks'],
			__classNames__: this.constructor['classNames'],
			__this__: this,
			__slots__: options.slots,
		};

		// console.log(this.__template__.toString());
		this.__view__ = this.__template__(this.__scope__);
	}

	isBlock() {
		return true;
	}

	protected getDefaults(): Partial<A> {
		return {};
	}

	protected connectedCallback(): void {
	}

	protected disconnectedCallback(): void {
	}

	protected attributeChangedCallback<K extends keyof A>(attrName: K, oldValue: A[K], newValue: A[K]): void {
	}

	dispatchEvent<D extends object, E extends DOMEvent>(event: XEvent<IBlock, D, E>);
	dispatchEvent<D extends object, E extends DOMEvent>(type: string, detail?: D, originalEvent?: E);
	dispatchEvent(type, detail?, originalEvent?) {
		const event = type instanceof XEvent ? type : new XEvent(type, detail, originalEvent);
		const eventType = event.type;
		const atName = `@${eventType}`;
		let __parent__ = this;

		event.setTarget(this);

		this[atName] && this[atName](event);

		do {
			const {__events__} = __parent__;

			if (__events__ && __events__.hasOwnProperty(eventType)) {
				let {ctx, fn, detail} = __events__[eventType];

				if (event.detail != null) {
					if (detail == null) {
						detail = event.detail;
					} else {
						detail = {...event.detail, ...detail};
					}
				}

				// todo: relatedTarget
				const nextEvent = new XEvent(fn, detail, event.originalEvent);

				if (ctx.dispatchEvent) {
					ctx.dispatchEvent(nextEvent);
				} else if (ctx.hasOwnProperty(`@${fn}`)) {
					ctx[`@${fn}`](nextEvent);
				}

				if (nextEvent.propagationStopped) {
					break;
				}
			} else if (__parent__ !== this && __parent__[atName]) {
				__parent__[atName] && __parent__[atName](event);

				if (event.propagationStopped) {
					break;
				}
			}

			__parent__ = __parent__.__parent__;
		} while (__parent__);
	}

	update(partialAttrs: Partial<A>) {
		const previousAttrs = this.attrs;
		const changed = [];
		let changedLength = 0;

		for (const key in partialAttrs) {
			if (partialAttrs.hasOwnProperty(key)) {
				const oldValue = previousAttrs[key];
				let newValue = partialAttrs[key];

				if (newValue == null) {
					newValue = null;
				}

				if (oldValue !== newValue) {
					changed.push(key, oldValue, newValue);
					changedLength += 3;

					this.attrs[key] = newValue;
				}
			}
		}

		// Если есть изменения, обновляем объект
		if (changedLength) {
			this.__scope__.__classNames__ = this.constructor['classNames'];
			this.__view__.update(this.__scope__);

			for (let idx = 0; idx < changedLength; idx += 3) {
				this.attributeChangedCallback(changed[idx], changed[idx + 1], changed[idx + 2]);
			}
		}
	}
}
