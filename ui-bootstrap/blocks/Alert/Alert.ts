import Block from '../Core/Core';

export interface IAlertAttrs {
	type?: 'success' | 'info' | 'warning' | 'danger';
	dismissible?: boolean;
}

export interface IAlertLinkAttrs {
	name?: string;
	href?: string;
	target?: string;
}

export class AlertClose extends Block<null> {
	static template = `
		button.close[
			@click="close"
			type="button"
			aria-label="Close"
		] > span[aria-hidden="true"] | ×
	`;
}

export class AlertHeading extends Block<null> {
	static template = `
		h2.alert-heading > ::children
	`;
}

export class AlertLink extends Block<IAlertLinkAttrs> {
	static template = `
		a.alert-link[
			name=\${attrs.name}
			href=\${attrs.href}
			target=\${attrs.target}
		] > ::children
	`;
}

export default class Alert extends Block<IAlertAttrs> {
	static blocks = {AlertClose};
	static template = `
		.alert.alert-\${attrs.type}[
			role="alert"
			class.alert-dismissible=\${attrs.dismissible}
		]
			if (attrs.dismissible) > AlertClose
			::children
	`;

	getDefaults(): IAlertAttrs {
		return {
			type: 'success',
			dismissible: false,
		};
	}
}
