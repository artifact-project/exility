import {storiesOf, Spec} from '@exility/storybook';
import Button, {ButtonAttrs} from './Button';

const stories = storiesOf('Button', module);

function getAttrs(extra: ButtonAttrs = {}): Spec<ButtonAttrs>[] {
	return [{
		attrs: ['primary', 'secondary', 'success', 'info', 'warning', 'danger', 'link'].map(type => ({
			type,
			value: type.charAt(0).toUpperCase() + type.substr(1),
			...extra
		}) as ButtonAttrs)
	}];
}

stories.addList<ButtonAttrs>(
	'types & disabled',
	Button,
	{
		'base': getAttrs(),
		'disabled': getAttrs({disabled: true}),
	}
);

stories.addList<ButtonAttrs>(
	'outline',
	Button,
	{
		'outline': getAttrs({outline: true}),
		'outline & disabled': getAttrs({disabled: true, outline: true}),
	}
);

stories.addList<ButtonAttrs>(
	'sizes',
	Button,
	{
		'large, size: lg': getAttrs({size: 'lg'}),
		'small, size: sm': getAttrs({size: 'sm'}),
	}
);

stories.addList<ButtonAttrs>(
	'block',
	Button,
	{
		'first': [
			{value: 'Block level button', block: true},
		],
		'second': [
			{value: 'Block level button', block: true, outline: true},
		]
	}

);
