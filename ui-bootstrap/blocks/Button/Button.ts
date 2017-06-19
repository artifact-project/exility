import Block from '../Core/Core';

export interface IButtonAttrs {
	type?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'link';
	size?: 'lg' | 'sm';
	outline?: boolean;
	block?: boolean;
	disabled?: boolean;
	value?: string | number;
}

export default class Button extends Block<IButtonAttrs> {
	static template = `
		button.btn.btn-\${(attrs.outline ? 'outline-' : '') + attrs.type}[
			@click
			class.btn-\${attrs.size}=\${attrs.size}
			class.btn-block=\${attrs.block}
			disabled=\${attrs.disabled}
			type=\${attrs.type === 'primary' ? 'submit' : 'button'}
		] | \${attrs.value}
	`;

	getDefaults(): IButtonAttrs {
		return {
			type: 'primary',
		};
	}
}
