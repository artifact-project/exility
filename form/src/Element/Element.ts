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
		var elem = __this__.formElement;
	
		input.input[
			@focus
			@blur
			
			class.active=\${elem.active}
			class.readOnly=\${elem.readOnly}
			class.disabled=\${elem.disabled}
			class.changed=\${elem.changed}
			class.touched=\${elem.touched}
			class.invalid=\${elem.invalid}
			class.submitting=\${elem.submitting}
			
			name=\${elem.name}
			type=\${elem.type}
			value=\${elem.value}
			checked=\${elem.checked}
			disabled=\${elem.disabled}
			readOnly=\${elem.readOnly || inp.submitting}
			autoFocus=\${elem.autoFocus}
			maxLength=\${elem.maxLength}
			tabIndex=\${elem.tabIndex}
		]
	`;

	private formElement: any;

	constructor(attrs, options) {
		super(attrs, options);
		this.formElement = this.getContext().register(this);
	}

	getDefaults() {
		return {
			type: 'text',
		};
	}

	getContext() {
		return this.context.$form;
	}

	disconnectedCallback() {
		this.getContext().unregister(this);
	}
}
