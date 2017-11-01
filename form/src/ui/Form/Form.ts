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
			
			@blur="input"
			@focus="input"
			
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

	'@input'({target, originalEvent}) {
		console.log(arguments[0]);
		this.context.$form.handleEvent(target, originalEvent);
	}
}
