import Block from '@exility/block';
import {UIFormAttrs, UIFormContext} from '../../interfaces';
import UIElement from '../Element/Element';

export default class UIForm extends Block<UIFormAttrs, UIFormContext> {
	static blocks = {
		Element: UIElement,
	};

	static template = `
		const form = context.$form;
	
		form.\${form.id}[
			@submit="handleEvent"
			@reset="handleEvent"
			
			class.changed=\${form.changed}
			class.invalid=\${form.invalid}
			class.locked=\${form.locked}
			
			class.submitting=\${form.submitting}
			class.submitFailed=\${form.submitFailed}
			class.submitSucceeded=\${form.submitSucceeded}
		]
			::children
	`;

	connectedCallback() {
		this.context.$form.connectForm(this);
	}

	disconnectedCallback() {
		this.context.$form.disconnectForm(this);
	}

	'@focus'({target, originalEvent}) {
		this.context.$form.handleEvent(target, originalEvent);
	}

	'@blur'({target, originalEvent}) {
		this.context.$form.handleEvent(target, originalEvent);
	}

	'@input'({target, originalEvent}) {
		this.context.$form.handleEvent(target, originalEvent);
	}
}
