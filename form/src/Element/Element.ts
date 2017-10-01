import Block from '@exility/block';
import css from '@exility/css';
import {ElementAttrs, ElementContext} from '../interfaces';

export default class Element extends Block<ElementAttrs, ElementContext> {
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
			class.disabled=\${inp.disabled}
			class.readOnly=\${inp.readOnly}
			class.submitting=\${inp.submitting}
			name=\${inp.name}
			type=\${inp.type}
			value=\${inp.value}
			checked=\${attrs.checked}
			disabled=\${attrs.disabled}
			readOnly=\${attrs.readOnly || inp.submitting}
			autoFocus=\${attrs.autoFocus}
		]
	`;

	constructor(attrs, options) {
		super(attrs, options);
		this.getContext().register(this);
	}

	getDefaults() {
		return {type: 'text'};
	}

	getContext() {
		return this.context.$form;
	}

	disconnectedCallback() {
		this.getContext().unregister(this);
	}
}
