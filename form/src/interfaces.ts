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
	options?: ElementOptionAttrs[];
}

export interface ElementOptionAttrs {
	text: string;
	value?: string;
}

export interface ElementContext {
	$form: any;
}
