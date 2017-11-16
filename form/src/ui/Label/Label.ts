import Block from '@exility/block';
import {IUILabel, UIFormContext} from '../../interfaces';

export default class UIForm extends Block<IUILabel, UIFormContext> {
	static template = `
		label[
			@click
		]
			::children
	`;

	'@click'() {
		const elem = this.context.$form.getElementByLabel(this.attrs.for);

		if (elem) {
			elem.focus();
		} else {
			console.warn(`[@exility/form] Element #${this.attrs.for} not found`);
		}
	}
}
