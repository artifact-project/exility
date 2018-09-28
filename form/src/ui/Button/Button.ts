import Block from '@exility/block';
import {IFormElement, UIButtonAttrs, UIElementContext} from '../../interfaces';

export default class UIButton extends Block<UIButtonAttrs, UIElementContext> {
	static classNames = true;

	static template = `
		const elem = __this__.getFormElement();
	
		button.is-\${elem.type}[
			ref="btn"
		
			@blur
			@focus

			class.shape-\${elem.shape}=\${elem.shape}
			class.size-\${elem.size}=\${elem.size}
			
			class.active=\${elem.active}
			class.disabled=\${elem.submitting || elem.disabled}
			class.submitting=\${elem.submitting}
			
			name=\${elem.name}
			type=\${elem.type}
			disabled=\${elem.disabled}
			autoFocus=\${elem.autoFocus}
		] > ::children
	`;

	private btn: HTMLButtonElement;
	private formElement: IFormElement;

	registerRef(name: 'btn', el) {
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
			type: 'submit',
		};
	}

	disconnectedCallback() {
		this.btn = null;
		this.formElement = null;
		this.context.$form.disconnectElement(this);
	}

	focus() {
		setTimeout(() => {
			try {
				this.btn.focus();
			} catch (err) {
				console.warn('[@exility/form] ui/Button', err);
			}
		});
	}
}
