import {storiesOf, action, Spec} from '@exility/storybook';
import Badge, {BadgeAttrs} from './Badge';

function getAttrs(extra: BadgeAttrs = {}): Spec<BadgeAttrs>[] {
	return ['default', 'primary', 'success', 'info', 'warning', 'danger'].map(type => ({
		attrs: {
			type,
			...extra,
		} as BadgeAttrs,
		slots: {
			children: '| ' + type.charAt(0).toUpperCase() + type.substr(1),
		}
	}));
}


const stories = storiesOf('Badge', module);

stories.add<BadgeAttrs>(
	'types',
	Badge,
	getAttrs()
);

stories.add<BadgeAttrs>(
	'pill',
	Badge,
	getAttrs({pill: true})
);
