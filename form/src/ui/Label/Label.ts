import Block from '@exility/block';
import {UILabelAttrs, UIFormContext} from '../../interfaces';

export default class UIForm extends Block<UILabelAttrs, UIFormContext> {
	static classNames = true;

	static template = `
		label[
			@click
		]
			::children
	`;

	'@click'() {
		const elem = this.context.$form.get(this.attrs.for);

		if (elem) {
			elem.focus();
		} else {
			console.warn(`[@exility/form] Element #${this.attrs.for} not found`);
		}
	}
}
