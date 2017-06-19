import {storiesOf, action, Spec} from '@exility/storybook';
import Badge, {IBadgeAttrs} from './Badge';

function getAttrs(extra: IBadgeAttrs = {}): Spec<IBadgeAttrs> {
	return ['default', 'primary', 'success', 'info', 'warning', 'danger'].map(type => ({
		attrs: {
			type,
			...extra,
		},
		slots: {
			children: '| ' + type.charAt(0).toUpperCase() + type.substr(1),
		}
	}));
}


const stories = storiesOf('Badge', module);

stories.add<IBadgeAttrs>(
	'types',
	Badge,
	getAttrs()
);

stories.add<IBadgeAttrs>(
	'pill',
	Badge,
	getAttrs({pill: true})
);
