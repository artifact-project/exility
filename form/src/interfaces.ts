export interface ValueBox {
	name?: string;
	value?: string;
	checked?: boolean;
	selectedIndex?: number;
}

export interface Validity {
	id: string;
	detail: object;
	nested?: Validity;
}

export type ValidateRule = (vbox: ValueBox) => Validity;

export interface ElementAttrs {
	name: string;
	type?: string;
	value?: string;
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

export interface ElementContext {
	$form: any;
}
