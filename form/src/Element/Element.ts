import Block from '@exility/block';
import css from '@exility/css';

export interface ElementAttrs {
	name: string;
	required?: boolean;
	readOnly?: boolean;
	disabled?: boolean
	autoFocus?: boolean
	minLength?: number;
	maxLength?: number;
}

export default class Input extends Block<ElementAttrs, null> {
	static classNames = css({
		'input': {
			width: '100%',
			border: '1px solid red',
		},
	});

	static template = `
		var inp = context.$form[attrs.name];
	
		input.input[
			@focus
			@blur
			class.submitting=\${inp.submitting}
			name=\${inp.name}
			type=\${inp.type}
			value=\${inp.value}
			checked=\${attrs.checked}
			disabled=\${attrs.disabled}
			readOnly=\${attrs.readOnly}
			autoFocus=\${attrs.autoFocus}
		]
	`;

	getContext() {
		return this.context.$form;
	}

	connectedCallback() {
		this.getContext().register(this);
	}

	disconnectedCallback() {
		this.getContext().unregister(this);
	}
}
