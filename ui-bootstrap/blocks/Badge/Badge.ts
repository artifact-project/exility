import Block from '../Core/Core';

export interface BadgeAttrs {
	type?: 'default' | 'primary' | 'success' | 'info' | 'warning' | 'danger';
	pill?: boolean;
}

export default class Badge extends Block<BadgeAttrs> {
	static template = `
		.badge.badge-\${attrs.type}[
			class.badge-pill=\${attrs.pill}
		] > ::children
	`;

	getDefaults(): BadgeAttrs {
		return {
			type: 'default',
		};
	}
}
