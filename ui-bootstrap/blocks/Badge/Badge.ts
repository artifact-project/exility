import Block from '../Core/Core';

export interface IBadgeAttrs {
	type?: 'default' | 'primary' | 'success' | 'info' | 'warning' | 'danger';
	pill?: boolean;
}

export default class Badge extends Block<IBadgeAttrs> {
	static template = `
		.badge.badge-\${attrs.type}[
			class.badge-pill=\${attrs.pill}
		] > ::children
	`;

	getDefaults(): IBadgeAttrs {
		return {
			type: 'default',
		};
	}
}
