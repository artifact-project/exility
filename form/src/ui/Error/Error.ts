import Block from '@exility/block';
import {UIErrorAttrs, UIFormContext} from '../../interfaces';

export default class UIError extends Block<UIErrorAttrs, UIFormContext> {
	static classNames = true;

	static template = `
		const group = context.$form.getElementsGroup(attrs.for);
	
		if (group.invalid)
			.error.\${group.validaty.id}[
				class.active=\${group.active}
				class.changed=\${group.changed}
				class.touched=\${group.touched}
			]
				| \${group.getErrorText(attrs.i18n)}
	`;

	connectedCallback() {
		this.context.$form.connectError(this);
	}

	disconnectedCallback() {
		this.context.$form.disconnectError(this);
	}
}
