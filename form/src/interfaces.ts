export interface ElementAttrs {
	name: string;
	type?: string;
	required?: boolean;
	readOnly?: boolean;
	disabled?: boolean
	autoFocus?: boolean
	minLength?: number;
	maxLength?: number;
}

export interface ElementContext {
	$form: any;
}
