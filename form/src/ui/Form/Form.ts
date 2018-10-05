import Block from '@exility/block';
import {UIFormAttrs, UIFormContext} from '../../interfaces';
import UIElement from '../Element/Element';
import UIButton from '../Button/Button';

export default class UIForm extends Block<UIFormAttrs, UIFormContext> {
	static classNames = true;

	static blocks = {
		Button: UIButton,
		Element: UIElement,
	};

	static template = `
		const form = context.$form;

		form.\${form.id}[
			@reset
			@submit="submit \${form.values}"

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

	'@submit'({originalEvent}) {
		this.context.$form.handleSubmit(originalEvent);
	}

	'@reset'({originalEvent}) {
		this.context.$form.handleReset(originalEvent);
	}
}
