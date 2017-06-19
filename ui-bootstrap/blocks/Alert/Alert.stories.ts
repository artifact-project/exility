import {storiesOf, action} from '@exility/storybook';
import Alert, {IAlertAttrs, AlertLink, AlertHeading} from './Alert';

const stories = storiesOf('Alert', module);
const types = {
	success: '<strong>Well done!</strong> You successfully read this important alert message.',
	info: '<strong>Heads up!</strong> This alert needs your attention, but it\'s not super important.',
	warning: '<strong>Well done!</strong> You successfully read this important alert message.',
	danger: '<strong>Oh snap!</strong> Change a few things up and try submitting again.',
};

const withLins = {
	success: `<strong>Well done!</strong> You successfully read <AlertLink href="#">this important alert message</AlertLink>.`,
	info: `<strong>Heads up!</strong> This <AlertLink href="#">alert needs your attention</AlertLink>, but it's not super important.`,
	warning: `<strong>Warning!</strong> Better check yourself, you're <AlertLink href="#">not looking too good</AlertLink>.`,
	danger: `<strong>Oh snap!</strong> <AlertLink href="#">Change a few things up</AlertLink> and try submitting again.`,
};

stories.addList<IAlertAttrs>(
	'types',
	Alert,
	Object.keys(types).reduce((spec, type) => {
		spec[type] = {
			attrs: {type},
			slots: {children: `#|${types[type]}|#`},
		};
		return spec;
	}, {})
);

stories.addList<IAlertAttrs>(
	'with link',
	Alert,
	Object.keys(withLins).reduce((spec, type) => {
		spec[type] = {
			attrs: {type},
			slots: {children: `#|${withLins[type]}|#`},
		};
		return spec;
	}, {}),
	{AlertLink}
);

stories.addList<IAlertAttrs>(
	'heading',
	Alert,
	Object.keys(withLins).reduce((spec, type) => {
		spec[type] = {
			attrs: {type},
			slots: {
				children: `
					AlertHeading | ${types[type].match(/>(.*?)</)[1]}
					p > #|${types[type].replace(/<.+>/, '')}|#
				`,
			},
		};
		return spec;
	}, {}),
	{AlertHeading}
);

stories.addList<IAlertAttrs>(
	'dismissible',
	Alert,
	Object.keys(withLins).reduce((spec, type) => {
		spec[type] = {
			attrs: {type, dismissible: true},
			slots: {children: `#|${withLins[type]}|#`},
			events: {
				'close': action('alert close!')
			}
		};
		return spec;
	}, {}),
	{AlertLink}
);
