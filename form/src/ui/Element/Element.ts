import Block from '@exility/block';
import {IFormElement, UIElementAttrs, UIElementContext} from '../../interfaces';

// todo: `class.shape-${x}`, `class.size-${y}`, maybe `class.${name}`?

export default class UIElement extends Block<UIElementAttrs, UIElementContext> {
	static template = `
		const elem = __this__.getFormElement();
		const tag = (elem.type === 'textarea' || elem.type === 'select') ? elem.type : 'input';
	
		\${tag}.is-\${elem.type}[
			ref="input"
		
			@blur
			@focus
			
			@input="input"
			@change="input"
			
			@keydown="input"
			@keyup="input"
			@keypress="input"
			
			@cut="input"
			@copy="input"
			@paste="input"
						
			class.shape_\${elem.shape}=\${elem.shape}
			class.size_\${elem.size}=\${elem.size}
			
			class.active=\${elem.active}
			class.checked=\${elem.checked}
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
			readOnly=\${elem.readOnly || elem.submitting}
			autoFocus=\${elem.autoFocus}
			maxLength=\${elem.maxLength}
			selectedIndex=\${elem.selectedIndex}
			placeholder=\${elem.placeholder}
		]
			if (tag === 'select') > for (opt in attrs.options)
				option[value=\${opt.value}] | \${opt.text}
	`;

	private input: HTMLInputElement;
	private formElement: IFormElement;

	registerRef(name: 'input', el) {
		this[name] = el;
	}

	getFormElement() {
		if (this.formElement == null) {
			this.formElement = this.context.$form.connectElement(this);
		}

		return this.formElement;
	}

	getDefaults() {
		return {
			type: 'text',
		};
	}

	disconnectedCallback() {
		this.context.$form.disconnectElement(this);
		this.input = null;
		this.formElement = null;
	}

	focus() {
		setTimeout(() => {
			try {
				this.input.focus();
			} catch (err) {
				console.warn('[@exility/form] ui/Element', err);
			}
		});
	}
}