import Block from '@exility/block';

export interface ValueBox {
	name?: string;
	value?: string;
	checked?: boolean;
	selectedIndex?: number;
	values?: any;
}

export interface Validity {
	id: string;
	detail: object & {value?: string, checked?: boolean, length?: number};
	nested?: Validity;
}

export type ValidateRule = (vbox: ValueBox) => Validity;

export interface UIFormAttrs {
	name?: string;
	context?: IFormContext;
}

export interface UILabelAttrs {
	for: string;
}

export interface UIErrorAttrs {
	for: string;
}

export interface UIFormContext {
	$form: IFormContext;
}

export interface IUIElement {
	attrs: UIElementAttrs;
}

export interface IUILabel {
	attrs: UILabelAttrs;
}

export interface IFormElement {
	name: string;
	value: string;
	checked: boolean;
	errors: {
		[name: string]: Validity;
	};
	invalid: boolean;
}

export interface IFormContext {
	id: string;
	handleEvent(block: IUIElement, event: Event);
	getElementByLabel(name: string): IUIElement;

	connectForm(ui: Block<any, any>): void;
	disconnectForm(ui: Block<any, any>): void;

	connectElement(block: IUIElement): IFormElement;
	disconnectElement(block: IUIElement): IFormElement;

	connectError(ui: Block<any, any>): void;
	disconnectError(ui: Block<any, any>): void;
}

export type FormContextConfig = {
	rules?: {
		[name: string]: ValidateRule;
	};

	validation?: {
		[name: string]: ValidateRule;
	};
}

export interface UIElementAttrs {
	name: string;
	shape?: string;
	size?: 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl';
	type?: string;
	value?: string;
	checked?: boolean;
	required?: boolean;
	readOnly?: boolean;
	disabled?: boolean
	autoFocus?: boolean
	minLength?: number;
	maxLength?: number;
	tabIndex?: number;
	options?: ElementOptionAttrs[];
}

export interface ElementOptionAttrs {
	text: string;
	value?: string;
}

export interface UIElementContext {
	$form: IFormContext;
}
