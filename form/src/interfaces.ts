import Block from '@exility/block';
import {ThemeProvider} from '@exility/css';

export interface LikeBlock {
	forceUpdate(): void;
}

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
	attrs: UIButtonAttrs;
	focus(): void;
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
	focus(): void;
}

export interface IFormContext {
	id: string;

	submitting: boolean;
	submitFailed: boolean;
	submitSucceeded: boolean;

	handleEvent(block: IUIElement, event: Event);
	handleSubmit(event: Event);
	handleReset(event: Event);

	get(name: string): IFormElement;

	connectForm(ui: Block<any, any>): void;
	disconnectForm(ui: Block<any, any>): void;

	connectElement(block: IUIElement): IFormElement;
	disconnectElement(block: IUIElement): IFormElement;

	connectError(ui: Block<any, any>): void;
	disconnectError(ui: Block<any, any>): void;
}

export type FormContextConfig<V> = {
	theme?: ThemeProvider;

	rules?: {
		[name: string]: ValidateRule;
	};

	validation?: {
		[name: string]: ValidateRule;
	};

	submit: (values: V, context: IFormContext) => Promise<any>,
	submitFailed?: (error: any, values: V, context: IFormContext) => void,
	submitSucceeded?: (results: any, values: V, context: IFormContext) => void,
}

export type UIElementShape = string;
export type UIElementSizes = 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl'

export interface UIElementAttrs {
	id?: string;
	name: string;
	shape?: UIElementShape;
	size?: UIElementSizes;
	type?: string;
	value?: string;
	checked?: boolean;
	placeholder?: string;
	required?: boolean;
	readOnly?: boolean;
	disabled?: boolean
	autoFocus?: boolean
	minLength?: number;
	maxLength?: number;
	tabIndex?: number;
	options?: ElementOptionAttrs[];
}

export interface UIButtonAttrs {
	id?: string;
	name: string;
	shape?: UIElementShape;
	size?: UIElementSizes;
	type?: string;
	value?: string;
	disabled?: boolean
	autoFocus?: boolean
	tabIndex?: number;
}

export interface ElementOptionAttrs {
	text: string;
	value?: string;
}

export interface UIElementContext {
	$form: IFormContext;
}

export interface WithFormContext {
	$form: IFormContext;
}
