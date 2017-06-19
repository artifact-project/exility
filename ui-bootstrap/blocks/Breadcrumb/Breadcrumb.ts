import Block from '../Core/Core';

export interface IBreadcrumbAttrs {
	items: IBreadcrumItemAttrs[];
}

export interface IBreadcrumItemAttrs {
	href: string;
	text: string;
}

export default class Breadcrumb extends Block<IBreadcrumbAttrs> {
	static template = `
		nav.breadcrumb > for (item in attrs.items)
			\${item === attrs.items[attrs.items.length - 1] ? 'span' : 'a'}.breadcrumb-item[
				href=\${item.href}
				class.active=\${item === attrs.items[attrs.items.length - 1]}
			] | \${item.text}
	`;
}
