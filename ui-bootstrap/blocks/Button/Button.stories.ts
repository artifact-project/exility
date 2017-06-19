import {storiesOf, Spec} from '@exility/storybook';
import Button, {IButtonAttrs} from './Button';

const stories = storiesOf('Button', module);

function getAttrs(extra: IButtonAttrs = {}): Spec<IButtonAttrs>[] {
	return [{
		attrs: ['primary', 'secondary', 'success', 'info', 'warning', 'danger', 'link'].map(type => ({

			type,
			value: type.charAt(0).toUpperCase() + type.substr(1),
			...extra
		}) as IButtonAttrs)
	}];
}

stories.addList<IButtonAttrs>(
	'types & disabled',
	Button,
	{
		'base': getAttrs(),
		'disabled': getAttrs({disabled: true}),
	}
);

stories.addList<IButtonAttrs>(
	'outline',
	Button,
	{
		'outline': getAttrs({outline: true}),
		'outline & disabled': getAttrs({disabled: true, outline: true}),
	}
);

stories.addList<IButtonAttrs>(
	'sizes',
	Button,
	{
		'large, size: lg': getAttrs({size: 'lg'}),
		'small, size: sm': getAttrs({size: 'sm'}),
	}
);

stories.addList<IButtonAttrs>(
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
