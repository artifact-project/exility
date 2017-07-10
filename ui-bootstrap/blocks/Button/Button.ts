import Block from '../Core/Core';
import CanDisabled from '../../interfaces/CanDisabled';
import Clickable from '../../interfaces/Clickable';

export interface ButtonAttrs extends CanDisabled, Clickable {
	type?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'link';
	size?: 'lg' | 'sm';
	outline?: boolean;
	block?: boolean;
	value?: string | number;
}

export default class Button extends Block<ButtonAttrs> {
	static template = `
		button.btn.btn-\${(attrs.outline ? 'outline-' : '') + attrs.type}[
			@click
			class.btn-\${attrs.size}=\${attrs.size}
			class.btn-block=\${attrs.block}
			disabled=\${attrs.disabled}
			aria-disabled=\${attrs.disabled ? attrs.disabled + '' : null}
			type=\${attrs.type === 'primary' ? 'submit' : 'button'}
		] | \${attrs.value}
	`;

	getDefaults(): ButtonAttrs {
		return {
			type: 'primary',
		};
	}
}
